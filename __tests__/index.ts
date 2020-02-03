import Hello, { Greeter } from '../src/index'

test('My Greeter', () => {
  expect(Greeter('Pragun')).toBe('Hello, Pragun')
})

test('My Hello', () => {
  expect(Hello('Pragun')).toBe('Hullo, Pragun')
})
