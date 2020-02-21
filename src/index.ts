import { Pool, TimeoutError } from 'tarn'
import { RateLimiter } from 'limiter'
import { filterObject, VNDBResponse } from './utils'
import VNDBConnection from './connection'
import { PromiseInspection } from 'tarn/lib/PromiseInspection'

/**
 * An object that contains the various connection options used to connect to the VNDB API
 */
interface ConnectionOptions {
  host?: string
  port?: number
  encoding?: string
  commandLimit?: number
  commandInterval?: number
  minConnection?: number
  maxConnection?: number
  connectionTimeout?: number
  idleTimeoutMillis?: number
  acquireTimeout?: number
  propagateCreateError?: boolean
}

/**
 * The default connection options, allows 10 requests per 30 seconds and 1 to 10 connections, you can them by passing your own connection options
 */
const defaultOptions: ConnectionOptions = {
  host: 'api.vndb.org',
  port: 19535,
  encoding: 'utf-8',
  commandLimit: 10,
  commandInterval: 30000,
  minConnection: 1,
  maxConnection: 10,
  connectionTimeout: 30000,
  idleTimeoutMillis: 30000,
  acquireTimeout: 60000,
  propagateCreateError: false,
}

/**
 * Represents the main VNDB API client
 * Uses Rate Limiting and Connection Pooling for maximum efficiency according to the limits described by the VNDB API
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
  private error: Error | undefined

  /**
   * Creates a new VNDB client
   * @param clientName A custom name used to identify the client connecting to the API
   * @param options Connection options used to connect to the API, any option not provided will be retrieved from [[defaultOptions]]
   */
  constructor(clientName: string, options?: ConnectionOptions) {
    options = filterObject(options)
    this.options = { ...defaultOptions, ...options }
    this.limiter = new RateLimiter(this.options.commandLimit as number, this.options.commandInterval as number)
    this.pool = new Pool({
      create: (): PromiseLike<VNDBConnection> => {
        return new Promise((resolve, reject) => {
          const conn = new VNDBConnection()
          conn
            .connect(
              this.options.host as string,
              this.options.port as number,
              this.options.encoding as string,
              this.options.connectionTimeout as number,
            )
            .then(() => {
              conn
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
   * Send a query to the VNDB API by creating a [[VNDBConnection]]
   * @param query A VNDB API compatible query string, @see {@link https://vndb.org/d11}
   * @return Resolves when the response is recieved
   */
  query(query: string): Promise<VNDBResponse> {
    return new Promise((resolve, reject) => {
      this.limiter.removeTokens(1, () => {
        this.pool
          .acquire()
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
              // which means error occured during creation of connection,
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
   * Destroy this client and close any open connections
   */
  destroy(): Promise<PromiseInspection<{}> | PromiseInspection<void>> {
    return this.pool.destroy()
  }
}

export default VNDB
