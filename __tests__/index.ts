import VNDB from '../src/index'

describe('VNDB Client initialization tests', () => {
  const clientName = 'TambourineMan'

  test('Create client without custom options', () => {
    const vndb = new VNDB(clientName)
    expect(vndb.options).toBeDefined()
    expect(vndb.limiter).toBeDefined()
    expect(vndb.pool).toBeDefined()
  })

  test('Client null/undefined keys not used', () => {
    const vndb = new VNDB(clientName, { host: undefined, port: undefined })
    expect(vndb.options).toBeDefined()
    Object.keys(vndb.options).forEach(k => {
      expect(vndb.options[k]).toBeDefined()
      expect(vndb.options[k]).not.toBeNull()
    })
    expect(vndb.limiter).toBeDefined()
    expect(vndb.pool).toBeDefined()
  })
})
