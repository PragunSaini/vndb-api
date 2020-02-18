import tls from 'tls'
import { randomBytes } from 'crypto'

/**
 * A VNDB connection object. Uses a TLS Socket to provide the connection
 */
class VNDBConnection {
  /** The end-of-line character */
  private eol: string
  /** The TLS socket object */
  public socket: tls.TLSSocket | undefined = undefined
  /** A unique connection socket id */
  public id: string

  /**
   * Create a new connection object
   */
  constructor() {
    this.eol = '\x04'
    this.id = randomBytes(12).toString('base64')
  }

  /**
   * Create a socket and connect it to the VNDB API
   * @param host VNDB API hostname
   * @param port VNDB API port (use the TLS port, not the TCP one)
   * @param encoding Type of encoding used
   * @return Resolves once the socket has connected to the server
   */
  connect(host: string, port: number, encoding = 'utf-8'): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.socket = undefined
        reject({
          code: 'CONTIMEOUT',
          message: 'Connection timed out',
        })
      }, 30000)

      this.socket = tls.connect({ host, port }, () => {
        this.socket?.setEncoding(encoding)
        this.socket?.removeAllListeners('error')
        this.socket?.removeAllListeners('connect')
        resolve()
      })

      this.socket.once('error', e => {
        this.socket = undefined
        reject({ ...e, message: 'Connection failed' })
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
        reject({ code: 'NOTCONNECTED', message: 'Please connect first' })
      }

      this.socket?.once('error', e => {
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
          reject({ code: 'LOGINREJECT', message: response })
        }
      })

      this.socket?.write(`login {"protocol":1,"client":"${clientName}","clientver":1.0}${this.eol}`)
    })
  }

  /**
   * Used to end the connection
   * @return Resolves once the connection is ended
   */
  disconnect(): Promise<void> {
    return new Promise(resolve => {
      if (this.socket == undefined) {
        resolve()
      }
      this.socket?.on('end', () => {
        this.socket = undefined
        resolve()
      })
      this.socket?.end()
    })
  }
}

export default VNDBConnection
