import genericPool, { Pool } from 'generic-pool'
import { RateLimiter } from 'limiter'
import { filterObject } from './utils'
import VNDBConnection from './connection'

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
}

/**
 * The default connection options
 */
const defaultOptions: ConnectionOptions = {
  host: 'api.vndb.org',
  port: 19535,
  encoding: 'utf-8',
  commandLimit: 200,
  commandInterval: 60000,
  minConnection: 1,
  maxConnection: 10,
  connectionTimeout: 30000,
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
   * Creates a new VNDB client
   * @param clientName A custom name used to identify the client connecting to the API
   * @param options Connection options used to connect to the API, any option not provided will be retrieved from [[defaultOptions]]
   */
  constructor(clientName: string, options?: ConnectionOptions) {
    options = filterObject(options)
    this.options = { ...defaultOptions, ...options }
    this.limiter = new RateLimiter(this.options.commandLimit as number, this.options.commandInterval as number)
    this.pool = genericPool.createPool(
      {
        create: () => {
          return new Promise((resolve, reject) => {
            const conn = new VNDBConnection()
            conn
              .connect(this.options.host as string, this.options.port as number, this.options.encoding)
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
        destroy: conn => {
          return conn.disconnect()
        },
      },
      {
        max: this.options.maxConnection,
        min: this.options.minConnection,
        idleTimeoutMillis: this.options.connectionTimeout,
      },
    )
  }
}

export default VNDB
