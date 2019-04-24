// @flow
/* eslint-env jest */
import SG from '../../src'
import SGExecutor from '../SGExecutor'

test('Hook生成', async () => {
  const executor = await SGExecutor.new({
    services: [SG.service('Test').queries({
      test: {
        $type: 'JSON',
        resolve: async function () {
          return 'OK1'
        }
      }
    })],
    hooks: [{
      description: 'Test hook',
      priority: 3,
      filter: ({ type, name, options }) => true,
      hook: async function ({ type, name, options }, { source, args, context, info, sgContext }, next) {
        const result = await next()
        if (result === 'OK3') {
          return 'Pass'
        }
        return result
      }
    }, {
      description: 'Test hook',
      priority: 1,
      filter: ({ type, name, options }) => true,
      hook: async function ({ type, name, options }, { source, args, context, info, sgContext }, next) {
        const result = await next()
        if (result === 'OK1') {
          return 'OK2'
        }
        return result
      }
    },
    {
      description: 'Test hook',
      priority: 2,
      filter: ({ type, name, options }) => true,
      hook: async function ({ type, name, options }, { source, args, context, info, sgContext }, next) {
        const result = await next()
        if (result === 'OK2') {
          return 'OK3'
        }
        return result
      }
    }]
  }, {})

  const result = await executor.exec(`
  query{
    test
  }
  `, {})
  expect(result.errors).toBeUndefined()
  expect(result.data.test).toEqual('Pass')
})
