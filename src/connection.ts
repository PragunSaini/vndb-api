import tls from 'tls'
import { randomBytes } from 'crypto'
import { wait, parseResponse, errorParser, VNDBResponse, VNDBError } from './utils'

/**
 * A VNDB connection object. Uses a TLS Socket to provide the connection.
 */
class VNDBConnection {
  /**
   * @hidden
   * The end-of-line character
   */
  private eol: string
  /** The TLS socket object */
  public socket: tls.TLSSocket | undefined = undefined
  /** A unique connection socket id */
  public id: string

  /**
   * Create a new connection object.
   */
  constructor() {
    this.eol = '\x04'
    this.id = randomBytes(12).toString('base64')
  }

  /**
   * Initialize a socket and connect it to the VNDB API
   * @param host VNDB API hostname
   * @param port VNDB API port (use the TLS port, not the TCP one)
   * @param encoding Type of encoding used
   * @return Resolves once the socket has connected to the server
   */
  connect(host: string, port: number, encoding = 'utf-8'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = tls.connect({ host, port }, () => {
        this.socket?.setEncoding(encoding)
        this.socket?.removeAllListeners('error')
        this.socket?.removeAllListeners('connect')
        resolve()
      })

      this.socket.once('error', e => {
        this.socket = undefined
        reject({ ...e, message: 'Connection failed', status: 'error' })
      })
    })
  }

  /**
   * Used to login to the API. It is required before sending further queries.
   * @param clientName A custom name for the client connecting to the API
   * @return Resolves once the API confirms the login
   */
  login(clientName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket == undefined) {
        reject({ code: 'NOTCONNECTED', message: 'Please connect first', status: 'error' })
      }

      this.socket?.once('error', e => {
        this.disconnect()
        reject(e)
      })

      this.socket?.on('data', data => {
        const chunk: string = data.toString()
        const response = chunk.substring(0, chunk.indexOf(this.eol))
        if (response == 'ok') {
          this.socket?.removeAllListeners('error')
          this.socket?.removeAllListeners('data')
          resolve()
        } else {
          this.disconnect()
          reject({ ...errorParser(response), code: 'LOGINREJECT', status: 'error' })
        }
      })

      this.socket?.write(`login {"protocol":1,"client":"${clientName}","clientver":1.0}${this.eol}`)
    })
  }

  /**
   * Used to end the connection.
   * @return Resolves once the connection is ended
   */
  disconnect(): Promise<void> {
    return new Promise(resolve => {
      if (this.socket == undefined) {
        resolve()
      }
      this.socket?.once('end', () => {
        this.socket = undefined
        resolve()
      })
      this.socket?.end()
    })
  }

  /**
   * Used to send a query to the VNDB API.
   * @param query A VNDB API compatible query string
   * @see {@link https://vndb.org/d11}
   * @return Resolves when the response is recieved
   */
  query(query: string): Promise<VNDBResponse> {
    return new Promise((resolve, reject) => {
      // If not connected, error
      if (this.socket == undefined) {
        reject({ code: 'NOTCONNECTED', message: 'Please connect first', status: 'error' })
      }

      // Actions to perform when data is recieved
      this.socket?.on('data', data => {
        const chunk: string = data.toString()
        let response: string | VNDBResponse = chunk.substring(0, chunk.indexOf(this.eol))
        this.socket?.removeAllListeners('data')
        response = parseResponse(query, response)

        // handle errors
        if (response.status == 'error') {
          const error: VNDBError = response
          if (error.id == 'throttled') {
            wait((error.fullwait as number) * 1000).then(() => {
              this.query(query)
                .then(delayedResponse => {
                  resolve(delayedResponse)
                })
                .catch(e => {
                  reject(e)
                })
            })
          } else {
            reject(error)
          }
        } else {
          // if no error, then resolve
          resolve(response)
        }
      })

      // Send the query
      this.socket?.write(`${query}${this.eol}`)
    })
  }
}

export default VNDBConnection
