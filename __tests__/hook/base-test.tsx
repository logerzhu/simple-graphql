// @flow
/* eslint-env jest */
import SGExecutor from '../SGExecutor'

test('Hook生成', async () => {
  const executor = await SGExecutor.new(
    {
      queries: {
        test: {
          output: { type: 'JSON' },
          resolve: async function () {
            return 'OK1'
          }
        }
      },
      hooks: [
        {
          name: 'test1',
          description: 'Test hook',
          priority: 3,
          filter: ({ type, name, targetConfig }) => true,
          hook: async function (
            { type, name, targetConfig },
            { source, args, context, info, sgContext },
            next
          ) {
            const result = await next()
            if (result === 'OK3') {
              return 'Pass'
            }
            return result
          }
        },
        {
          name: 'test2',
          description: 'Test hook',
          priority: 1,
          filter: ({ type, name, targetConfig }) => true,
          hook: async function (
            { type, name, targetConfig },
            { source, args, context, info, sgContext },
            next
          ) {
            const result = await next()
            if (result === 'OK1') {
              return 'OK2'
            }
            return result
          }
        },
        {
          name: 'test3',
          description: 'Test hook',
          priority: 2,
          filter: ({ type, name, targetConfig }) => true,
          hook: async function (
            { type, name, targetConfig },
            { source, args, context, info, sgContext },
            next
          ) {
            const result = await next()
            if (result === 'OK2') {
              return 'OK3'
            }
            return result
          }
        }
      ]
    },
    {}
  )

  const result = await executor.exec(
    `
  query{
    test
  }
  `,
    {}
  )
  expect(result.errors).toBeUndefined()
  expect(result?.data?.test).toEqual('Pass')
})
