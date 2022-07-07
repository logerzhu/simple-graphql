// @flow
/* eslint-env jest */
import { SequelizeSGSchema } from '../../src'
import SGExecutor from '../SGExecutor'

test('引用类型生成', async () => {
  const executor = await SGExecutor.new(
    {
      schemas: [
        new SequelizeSGSchema('Dummy1', {
          plugin: {
            singularQuery: {
              enable: true
            },
            addMutation: {
              enable: true
            }
          }
        })
          .fields({
            name: { type: 'String' }
          })
          .hasOne({
            dummyA: {
              target: 'Dummy2',
              foreignField: 'dummyA'
            }
          })
          .hasMany({
            dummyB: {
              target: 'Dummy2',
              foreignField: 'dummyB',
              outputStructure: 'Array'
            },
            dummyC: {
              target: 'Dummy2',
              foreignField: 'dummyB'
            }
          }),
        new SequelizeSGSchema('Dummy2', {
          plugin: {
            addMutation: {
              enable: true
            }
          }
        }).fields({
          name: { type: 'String' },
          dummyA: { type: 'Dummy1' },
          dummyB: { type: 'Dummy1' },
          dummyC: {
            elements: { type: 'Dummy1' }
          },
          dummyD: {
            properties: {
              at: { type: 'Date' },
              dummyE: { type: 'Dummy1' },
              dummyF: { elements: { type: 'Dummy1' } }
            }
          }
        })
      ]
    },
    {}
  )

  const dummy1Data = {
    name: 'Loger'
  }

  const addDummy1 = await executor.exec(
    `
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
  `,
    {
      input: {
        clientMutationId: 'XX',
        ...dummy1Data
      }
    }
  )
  expect(addDummy1.errors).toBeUndefined()
  const dummy1 = addDummy1?.data?.addDummy1.addedDummy1Edge.node
  expect(dummy1.name).toEqual(dummy1Data.name)

  const dummy2Data = {
    name: 'Loger2',
    dummyAId: dummy1.id,
    dummyBId: dummy1.id,
    dummyC: [dummy1.id],
    dummyD: {
      at: new Date().toJSON(),
      dummyE: dummy1.id,
      dummyF: [dummy1.id]
    }
  }

  const addDummy2 = await executor.exec(
    `
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
          dummyD{
            at
            dummyE{id name}
            dummyF{id name}
          }
        }
      }
    }
  }
  `,
    {
      input: {
        clientMutationId: 'XX',
        ...dummy2Data
      }
    }
  )
  expect(addDummy2.errors).toBeUndefined()
  const dummy2 = addDummy2?.data?.addDummy2.addedDummy2Edge.node
  expect(dummy2.name).toEqual(dummy2Data.name)
  expect(dummy2.dummyA).toEqual(dummy1)
  expect(dummy2.dummyB).toEqual(dummy1)
  expect(dummy2.dummyC).toEqual([dummy1])
  expect(dummy2.dummyD.at).toEqual(dummy2Data.dummyD.at)
  expect(dummy2.dummyD.dummyE).toEqual(dummy1)
  expect(dummy2.dummyD.dummyF).toEqual([dummy1])

  const querySingleResult = await executor.exec(
    `
  query{
    dummy1(id:"${dummy1.id}"){
       id
       name
       dummyA{id name}
       dummyB{id name}
       dummyC{
        edges{
          node{id name}
        }
       }
    }
  }
  `,
    {}
  )

  expect(querySingleResult.errors).toBeUndefined()
  const qDummy1 = querySingleResult?.data?.dummy1
  expect(qDummy1.name).toEqual(dummy1Data.name)
  expect(qDummy1.dummyA).toEqual({ id: dummy2.id, name: dummy2.name })
  expect(qDummy1.dummyB).toEqual([{ id: dummy2.id, name: dummy2.name }])
  expect(qDummy1.dummyC).toEqual({
    edges: [{ node: { id: dummy2.id, name: dummy2.name } }]
  })
})
