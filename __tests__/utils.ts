import { filterObject } from '../src/utils'

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
