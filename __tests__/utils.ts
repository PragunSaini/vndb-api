import { wait, filterObject, parseResponse, errorParser } from '../src/utils'

describe('filterObject', () => {
  const testObj = {
    name: 'Ziggy Stardust',
    place: 'Mars',
    age: null,
    dob: undefined,
  }

  test('Passing undefined returns empty object', () => {
    const filteredObj = filterObject(undefined)
    expect(filteredObj).toStrictEqual({})
  })

  test('Nulls and undefined values removed from object', () => {
    const filteredObj = filterObject(testObj)
    Object.keys(filterObject).forEach(k => {
      expect(filteredObj[k]).not.toBeNull()
      expect(filteredObj[k]).not.toBeUndefined()
    })
  })

  test('Original values not altered', () => {
    const filteredObj = filterObject(testObj)
    Object.keys(filteredObj).forEach(k => {
      expect(filteredObj[k]).toEqual(testObj[k])
    })
  })
})

describe('parseResponse', () => {
  // Sample responses for testing
  const dbstatResponse =
    'dbstats {"chars":87296,"posts":134348,"tags":2526,"staff":19671,"traits":2718,"releases":66224,"users":153316,"vn":26825,"producers":9646,"threads":12773}'
  const errResponse = 'error {"id":"parse","msg":"Invalid command"}'
  const vnResponse =
    'results {"items":[{"released":"2004-04-28","languages":["en","es","it","ja","ko","pt-br","ru","vi","zh"],"orig_lang":["ja"],"title":"Clannad","platforms":["win","and","nds","psp","ps2","ps3","ps4","psv","swi","n3d","xb3","oth"],"id":4,"original":null}],"num":1,"more":false}'
  const ulistResponse =
    'results {"items":[{"notes":"","vn":4,"finished":null,"vote":100,"started":null,"lastmod":1568263783,"uid":165683,"added":1568263762,"voted":1568263762},{"notes":"","vn":11,"finished":null,"vote":90,"started":null,"lastmod":1564886056,"uid":165683,"added":1564886041,"voted":1564886041},{"added":1580651709,"voted":null,"started":null,"lastmod":1580651709,"uid":165683,"vote":null,"notes":"","vn":38,"finished":null},{"added":1579538579,"voted":1579538581,"started":null,"lastmod":1579538581,"uid":165683,"vote":60,"notes":"","finished":null,"vn":44},{"voted":null,"added":1580651631,"uid":165683,"started":null,"lastmod":1580651631,"vote":null,"notes":"","finished":null,"vn":57},{"vote":null,"vn":93,"finished":null,"notes":"","voted":null,"added":1580652368,"uid":165683,"lastmod":1580652368,"started":null},{"added":1580652336,"voted":1581100264,"started":null,"lastmod":1581100264,"uid":165683,"vote":80,"notes":"","finished":null,"vn":97},{"finished":null,"vn":211,"notes":"","vote":80,"lastmod":1580619032,"started":null,"uid":165683,"added":1580617922,"voted":1580617925},{"notes":"","finished":null,"vn":751,"vote":null,"uid":165683,"started":null,"lastmod":1580876478,"voted":null,"added":1580876478},{"notes":"","finished":null,"vn":945,"vote":null,"uid":165683,"started":null,"lastmod":1580876491,"voted":null,"added":1580876491}],"more":true,"num":10}'

  test('dbstats search type', () => {
    const response = parseResponse('dbstats', dbstatResponse)
    expect(response.status).toBeDefined()
    expect(response.status).toBe('dbstats')
    expect(response.searchType).toBeDefined()
    expect(response.searchType).toBe('dbstats')
  })

  test('error search type', () => {
    const query = 'Try not to give up on happiness'
    const response = parseResponse(query, errResponse)
    expect(response.status).toBeDefined()
    expect(response.status).toBe('error')
    expect(response.searchType).toBeDefined()
    expect(response.searchType).toBe(query)
    expect(response.code).toBe('PARSE')
  })

  test('get vn search type', () => {
    const query = 'get vn basic (id = 4)'
    const response = parseResponse(query, vnResponse)
    expect(response.status).toBeDefined()
    expect(response.status).toBe('results')
    expect(response.searchType).toBeDefined()
    expect(response.searchType).toBe('vn')
  })

  test('get ulist search type', () => {
    const query = 'get ulist basic (uid = 165683)'
    const response = parseResponse(query, ulistResponse)
    expect(response.status).toBeDefined()
    expect(response.status).toBe('results')
    expect(response.searchType).toBeDefined()
    expect(response.searchType).toBe('ulist')
  })
})

describe('errorParser', () => {
  const errorString = 'error {"field":"client","id":"badarg","msg":"Invalid client name"}'
  const error = errorParser(errorString)
  expect(error.status).toBeDefined()
  expect(error.status).toBe('error')
  expect(error.id).toBe('badarg')
})

describe('wait', () => {
  jest.useFakeTimers()

  test('wait promise resolves', () => {
    wait(1000).then(() => {
      // resolved
    })

    expect(setTimeout).toHaveBeenCalledTimes(1)
  })
})
