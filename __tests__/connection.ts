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
    idleTimeoutMillis: 30000,
    acquireTimeout: 60000,
    propagateCreateError: false,
  }
  const clientName = 'EradicateAllEnlightenment'

  let conn: VNDBConnection

  test('Connection established', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port)
    expect(conn.socket).toBeDefined()
  })

  test('Disconnect', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port)
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

  test('Invalid client name', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port)
    try {
      await conn.login('')
    } catch (e) {
      expect(e.code).toBe('LOGINREJECT')
    }
  })

  test('Multiple logins not allowed', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port)
    try {
      await conn.login(clientName)
      await conn.login(clientName)
    } catch (e) {
      expect(e.code).toBe('LOGINREJECT')
    }
  })

  test('Succesfull Login', async () => {
    conn = new VNDBConnection()
    await conn.connect(defaultOptions.host, defaultOptions.port)
    await conn.login(clientName)
  })

  afterEach(async () => {
    await conn.disconnect()
  })
})

describe('VNDB Connection Query', () => {
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
  const clientName = 'DizzyUpTheGirl'
  const conn = new VNDBConnection()

  test("Can't query without connecting", async () => {
    try {
      await conn.query('dbstats')
    } catch (e) {
      expect(e.code).toBe('NOTCONNECTED')
    }
  })

  test('dbstats', async () => {
    await conn.connect(defaultOptions.host, defaultOptions.port)
    await conn.login(clientName)
    const response = await conn.query('dbstats')
    expect(response.status).toBe('dbstats')
    expect(response.searchType).toBe('dbstats')
  })

  test('get vn', async () => {
    await conn.connect(defaultOptions.host, defaultOptions.port)
    await conn.login(clientName)
    const response = await conn.query('get vn basic (id = 4)')
    expect(response.status).toBe('results')
    expect(response.searchType).toBe('vn')
  })

  test('error response', async () => {
    await conn.connect(defaultOptions.host, defaultOptions.port)
    await conn.login(clientName)
    const query = 'get vn basic (id = clannad)'
    try {
      await conn.query(query)
    } catch (e) {
      expect(e.status).toBe('error')
      expect(e.searchType).toBe(query)
      expect(e.code).toBeDefined()
    }
  })

  afterEach(async () => {
    await conn.disconnect()
  })
})
