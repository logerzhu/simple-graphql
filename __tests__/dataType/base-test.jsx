// @flow
/* eslint-env jest */
import SG from '../../src'
import SGExecutor from '../SGExecutor'

test('数据类型生成', async () => {
  const executor = await SGExecutor.new({
    schemas: [SG.schema('Dummy', {
      plugin: {
        addMutation: true
      }
    }).dataTypes({
      DummyData1: {
        name: 'String',
        data: 'DummyData2'
      },
      DummyData2: [{
        length: 'Number'
      }]
    }).fields({
      name: 'String',
      data: 'DummyData1'
    })]
  }, {})

  const values = {
    name: 'Hello',
    data: {
      name: 'Hello2',
      data: [{ length: 1 }, { length: 2 }]
    }
  }

  const addResult = await executor.exec(`
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
  `, {
    input: {
      clientMutationId: 'XX',
      ...values
    }
  })
  expect(addResult.errors).toBeUndefined()
  expect(addResult.data.addDummy.addedDummyEdge.node).toEqual(values)
})
