// @flow
/* eslint-env jest */
import SG from '../../src'
import SGExecutor from '../SGExecutor'

test('引用类型生成', async () => {
  const executor = await SGExecutor.new({
    schemas: [
      SG.schema('Dummy1', {
        plugin: {
          addMutation: true,
          updateMutation: true,
          deleteMutation: true
        }
      }).fields({
        name: 'String'
      }
      ).hasOne({
        dummyA: {
          target: 'Dummy2',
          foreignField: 'dummyA'
        }
      }).hasMany({
        dummyB: {
          target: 'Dummy2',
          foreignField: 'dummyB'
        }
      }),
      SG.schema('Dummy2', {
        plugin: {
          addMutation: true,
          updateMutation: true,
          deleteMutation: true
        }
      }).fields({
        name: 'String',
        dummyA: 'Dummy1',
        dummyB: 'Dummy1',
        dummyC: ['Dummy1']
      })]
  }, {})

  const dummy1Data = {
    name: 'Loger'
  }

  const addDummy1 = await executor.exec(`
  mutation($input:AddDummy1Input!){
    addDummy1(input:$input){
      clientMutationId
      addedDummy1Edge{
        node{
          id
          name
        }
      }
    }
  }
  `, {
    input: {
      clientMutationId: 'XX',
      ...dummy1Data
    }
  })
  expect(addDummy1.errors).toBeUndefined()
  const dummy1 = addDummy1.data.addDummy1.addedDummy1Edge.node
  expect(dummy1.name).toEqual(dummy1Data.name)

  const dummy2Data = {
    name: 'Loger2',
    dummyAId: dummy1.id,
    dummyBId: dummy1.id,
    dummyC: [dummy1.id]
  }

  const addDummy2 = await executor.exec(`
  mutation($input:AddDummy2Input!){
    addDummy2(input:$input){
      clientMutationId
      addedDummy2Edge{
        node{
          id
          name
          dummyA{id name}
          dummyB{id name}
          dummyC{id name}
        }
      }
    }
  }
  `, {
    input: {
      clientMutationId: 'XX',
      ...dummy2Data
    }
  })
  expect(addDummy2.errors).toBeUndefined()
  const dummy2 = addDummy2.data.addDummy2.addedDummy2Edge.node
  expect(dummy2.name).toEqual(dummy2Data.name)
  expect(dummy2.dummyA).toEqual(dummy1)
  expect(dummy2.dummyB).toEqual(dummy1)
  expect(dummy2.dummyC).toEqual([dummy1])
})
