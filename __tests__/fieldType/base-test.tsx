// @flow
/* eslint-env jest */
import SG from '../../src'
import SGExecutor from '../SGExecutor'

test('基本类型生成', async () => {
  const executor = await SGExecutor.new(
    {
      schemas: [
        SG.schema('Dummy', {
          plugin: {
            addMutation: true
          }
        }).fields({
          number: { type: 'Number' },
          numbers: {
            elements: { type: 'Number' }
          },
          boolean: {
            type: 'Boolean',
            nullable: true
          },
          booleans: {
            elements: { type: 'Boolean' },
            nullable: true
          },
          date: { type: 'Date' },
          integer: { type: 'Integer' },
          string: { type: 'String' },
          enum: {
            enum: ['A', 'B', 'C']
          },
          enums: {
            elements: {
              enum: ['A', 'B', 'C']
            }
          }
        })
      ]
    },
    {}
  )

  const values = {
    number: 123.2,
    numbers: [1.1, 9.1],
    boolean: true,
    booleans: [false, true],
    date: new Date().toJSON(),
    integer: 999,
    string: 'Hello',
    enum: 'A',
    enums: ['A', 'B']
  }

  const addResult = await executor.exec(
    `
  mutation($input:AddDummyInput!){
    addDummy(input:$input){
      clientMutationId
      addedDummyEdge{
        node{
          number
          numbers
          boolean
          booleans
          date
          integer
          string
          enum
          enums
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
  expect(addResult.data.addDummy.addedDummyEdge.node).toEqual(values)
})
