import VNDB from '../src/index'

describe('VNDB Client initialization tests', () => {
  jest.setTimeout(30000)
  const clientName = 'GirlIAmTooShy'
  let vndb: VNDB

  test('Create client without custom options', () => {
    vndb = new VNDB(clientName)
    expect(vndb.options).toBeDefined()
    expect(vndb.limiter).toBeDefined()
    expect(vndb.pool).toBeDefined()
  })

  test('Client null/undefined keys not used', () => {
    vndb = new VNDB(clientName, { host: undefined, port: undefined })
    expect(vndb.options).toBeDefined()
    Object.keys(vndb.options).forEach(k => {
      expect(vndb.options[k]).toBeDefined()
      expect(vndb.options[k]).not.toBeNull()
    })
    expect(vndb.limiter).toBeDefined()
    expect(vndb.pool).toBeDefined()
  })

  test('Client uses custom options', () => {
    vndb = new VNDB(clientName, { maxConnection: 2, minConnection: 2 })
    expect(vndb.options).toBeDefined()
    expect(vndb.options.maxConnection).toBe(2)
    expect(vndb.options.minConnection).toBe(2)
    expect(vndb.limiter).toBeDefined()
    expect(vndb.pool).toBeDefined()
  })

  test('Invalid client name gets rejected', async () => {
    vndb = new VNDB('', { acquireTimeout: 5000, connectionTimeout: 2500 })
    try {
      await vndb.query('dbstats')
    } catch (e) {
      expect(e.status).toBe('error')
      expect(e.code).toBe('LOGINREJECT')
    }
  })

  test('Invalid host gets rejected', async () => {
    vndb = new VNDB('dio', { host: 'dio.ora', acquireTimeout: 5000, connectionTimeout: 2500 })
    try {
      await vndb.query('dbstats')
    } catch (e) {
      expect(e.code).toBe('ENOTFOUND')
    }
  })

  test('Invalid host rejected with propagateError option', async () => {
    vndb = new VNDB('dio', { host: 'dio.ora', propagateCreateError: true, connectionTimeout: 2500 })
    try {
      await vndb.query('dbstats')
    } catch (e) {
      expect(e.code).toBe('ENOTFOUND')
    }
  })

  afterEach(async () => {
    await vndb.destroy()
  })
})

describe('Query using the client', () => {
  jest.setTimeout(30000)
  const client = new VNDB('MomsSpaghetti', { propagateCreateError: true })

  test('dbstats query', async () => {
    const resp = await client.query('dbstats')
    expect(resp.status).toBe('dbstats')
    expect(resp.searchType).toBe('dbstats')
  })

  test('vn query', async () => {
    const resp = await client.query('get vn basic (id = 4)')
    expect(resp.status).toBe('results')
    expect(resp.searchType).toBe('vn')
  })

  test('error query', async () => {
    try {
      await client.query('get vn basic (id = 4444444)')
    } catch (e) {
      expect(e.status).toBe('error')
      expect(e.searchType).toBe('get vn basic (id = 4444444)')
    }
  })

  afterAll(async () => {
    await client.destroy()
  })
})
