import VNDBConnection from '../src/connection'

describe('VNDB Connection Object', () => {
  jest.setTimeout(35000)

  const defaultOptions = {
    host: 'api.vndb.org',
    port: 19535,
    encoding: 'utf-8',
    commandLimit: 200,
    commandInterval: 60000,
    minConnection: 1,
    maxConnection: 10,
    connectionTimeout: 30000,
  }
  const clientName = 'EradicateAllEnlightenment'

  let conn: VNDBConnection

  test('Invalid hostname', async () => {
    conn = new VNDBConnection()
    try {
      await conn.connect('thisisinvalidhost', defaultOptions.port, defaultOptions.encoding)
    } catch (e) {
      expect(e.code == 'CONTIMEOUT' || e.code == 'ENOTFOUND').toBe(true)
      expect(conn.socket).toBeUndefined()
    }
  })

  test('Invalid port', async () => {
    conn = new VNDBConnection()
    try {
      await conn.connect(defaultOptions.host, 1234, defaultOptions.encoding)
    } catch (e) {
      expect(e.code == 'CONTIMEOUT' || e.code == 'ENOTFOUND').toBe(true)
      expect(conn.socket).toBeUndefined()
    }
  })

  test('Connection established', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port, defaultOptions.encoding)
    expect(conn.socket).toBeDefined()
  })

  test('Disconnect', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port, defaultOptions.encoding)
    await conn.disconnect()
    expect(conn.socket).toBeUndefined()
  })

  test('Login without connect', async () => {
    conn = new VNDBConnection()
    try {
      await conn.login(clientName)
    } catch (e) {
      expect(e.code).toBe('NOTCONNECTED')
    }
  })

  test('Multiple logins not allowed', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port, defaultOptions.encoding)
    try {
      await conn.login(clientName)
      await conn.login(clientName)
    } catch (e) {
      expect(e.code).toBe('LOGINREJECT')
    }
  })

  test('Succesfull Login', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port, defaultOptions.encoding)
    await conn.login(clientName)
  })

  afterEach(() => {
    conn.disconnect()
  })
})
