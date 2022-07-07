// @flow
/* eslint-env jest */
import { SequelizeSGSchema } from '../../src'
import SGExecutor from '../SGExecutor'

test('数据类型生成', async () => {
  const executor = await SGExecutor.new(
    {
      dataTypes: [
        {
          name: 'DummyData1',
          definition: {
            properties: {
              name: { type: 'String' },
              data: { type: 'DummyData2' }
            }
          }
        },
        {
          name: 'DummyData2',
          definition: {
            elements: {
              properties: {
                length: { type: 'Number' }
              }
            }
          }
        }
      ],
      schemas: [
        new SequelizeSGSchema('Dummy', {
          plugin: {
            addMutation: {
              enable: true
            }
          }
        }).fields({
          name: { type: 'String' },
          data: { type: 'DummyData1' }
        })
      ]
    },
    {}
  )

  const values = {
    name: 'Hello',
    data: {
      name: 'Hello2',
      data: [{ length: 1 }, { length: 2 }]
    }
  }

  const addResult = await executor.exec(
    `
  mutation($input:AddDummyInput!){
    addDummy(input:$input){
      clientMutationId
      addedDummyEdge{
        node{
          name
          data{name data{length}}
        }
      }
    }
  }
  `,
    {
      input: {
        clientMutationId: 'XX',
        ...values
      }
    }
  )
  expect(addResult.errors).toBeUndefined()
  expect(addResult?.data?.addDummy?.addedDummyEdge?.node).toEqual(values)
})
