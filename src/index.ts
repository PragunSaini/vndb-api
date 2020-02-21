import { Pool, TimeoutError } from 'tarn'
import { RateLimiter } from 'limiter'
import { filterObject, VNDBResponse } from './utils'
import VNDBConnection from './connection'
import { PromiseInspection } from 'tarn/lib/PromiseInspection'

/**
 * An object that contains the various connection options used to connect to the VNDB API
 */
interface ConnectionOptions {
  /**
   * The VNDB API hostname
   * @default api.vndb.org
   */
  host?: string
  /**
   * The VNDB API port (use the TLS port)
   * @default 19535
   */
  port?: number
  /**
   * The encoding to use
   * @default utf-8
   */
  encoding?: string
  /**
   * The max number of queries allowed to send per [[queryInterval]] milliseconds
   * @default 10
   */
  queryLimit?: number
  /**
   * The time limit in which at most [[queryLimit]] queries are allowed to send (in milliseconds)
   * @default 30000
   */
  queryInterval?: number
  /**
   * The minimum number of connections to the API to keep in the pool
   * @default 1
   */
  minConnection?: number
  /**
   * The maximum number of connections to the API allowed
   * @default 10
   */
  maxConnection?: number
  /**
   * Unused/Free connections in the pool are destroyed after this many milliseconds
   * @default 30000
   */
  idleTimeoutMillis?: number
  /**
   * If a connection is not established within this many milliseconds, an error with the corresponding reason is generated
   * @default 30000
   */
  acquireTimeout?: number
  /**
   * If this is true, then the client errors out the first time unable to establish a connection and does not retry.
   * If this is false, then the client will retry for [[acquireTimeout]] milliseconds to establish a connection
   */
  propagateCreateError?: boolean
}

/**
 * @hidden
 * The default connection options, allows 10 requests per 30 seconds and 1 to 10 connections, you can them by passing your own connection options
 */
const defaultOptions: ConnectionOptions = {
  host: 'api.vndb.org',
  port: 19535,
  encoding: 'utf-8',
  queryLimit: 10,
  queryInterval: 30000,
  minConnection: 1,
  maxConnection: 10,
  idleTimeoutMillis: 30000,
  acquireTimeout: 30000,
  propagateCreateError: false,
}

/**
 * Represents the main VNDB API client.
 * Uses Rate Limiting and Connection Pooling for maximum efficiency according to the limits described by the VNDB API.
 * @see {@link https://vndb.org/d11}
 */
class VNDB {
  /** The connection options used to connect to the API */
  options: ConnectionOptions
  /** Used to rate limit the queries sent to the VNDB API to prevent overloading */
  limiter: RateLimiter
  /** A pool of connections to the API */
  pool: Pool<VNDBConnection>
  /**
   * @hidden
   * Used to store the error object for any error during creation of a connection
   */
  private error: object | undefined

  /**
   * Creates a new VNDB client.
   * @param clientName A custom name used to identify the client connecting to the API
   * @param options Connection options used to connect to the API, defaults will be used for any option not provided
   */
  constructor(clientName: string, options?: ConnectionOptions) {
    // Update any custom provided options
    options = filterObject(options)
    this.options = { ...defaultOptions, ...options }

    // Create a rate limiter
    this.limiter = new RateLimiter(this.options.queryLimit as number, this.options.queryInterval as number)

    // Create a connection pool
    this.pool = new Pool({
      create: (): PromiseLike<VNDBConnection> => {
        return new Promise((resolve, reject) => {
          const conn = new VNDBConnection()
          conn // first connect to the API
            .connect(this.options.host as string, this.options.port as number, this.options.encoding as string)
            .then(() => {
              conn // then login using the provided client name
                .login(clientName)
                .then(() => {
                  resolve(conn)
                })
                .catch(e => {
                  reject(e)
                })
            })
            .catch(e => {
              reject(e)
            })
        })
      },

      destroy: (conn: VNDBConnection): Promise<void> => {
        return conn.disconnect()
      },

      max: this.options.maxConnection as number,
      min: this.options.minConnection as number,
      idleTimeoutMillis: this.options.idleTimeoutMillis,
      acquireTimeoutMillis: this.options.acquireTimeout,
      propagateCreateError: this.options.propagateCreateError,
    })

    // Adds an event listener to the pool, if any resource creation fails, stores the reason in this.error
    this.pool.on('createFail', (id, err) => {
      this.error = err
    })
  }

  /**
   * Send a query to the VNDB API by creating a [[VNDBConnection]].
   * @param query A VNDB API compatible query string
   * @see {@link https://vndb.org/d11}
   * @return Resolves when the response is recieved
   */
  query(query: string): Promise<VNDBResponse> {
    return new Promise((resolve, reject) => {
      this.limiter.removeTokens(1, () => {
        this.pool
          .acquire() // get a connection from the pool
          .promise.then(conn => {
            conn
              .query(query)
              .then(response => {
                this.pool.release(conn)
                resolve(response)
              })
              .catch(e => {
                this.pool.release(conn)
                reject(e)
              })
          })
          .catch(e => {
            if (e instanceof TimeoutError) {
              // If error is due to timeout
              if (this.error == undefined) {
                reject({
                  code: 'CONTIMEOUT',
                  message: 'Connection timed out',
                  status: 'error',
                })
              }
              // otherwise error occured during creation of connection,
              // so use the error from this.error set by event
              reject(this.error)
            }
            // else it's a query related API error, only happens if propagateCreateError is set to true
            reject(e)
          })
      })
    })
  }

  /**
   * Destroy this client and close any open connections.
   * @return Resolves when the client is destroyed
   */
  destroy(): Promise<PromiseInspection<{}> | PromiseInspection<void>> {
    return this.pool.destroy()
  }
}

export default VNDB
