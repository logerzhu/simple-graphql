// @flow
/* eslint-env jest */
import SG from '../../src'
import SGExecutor from '../SGExecutor'

test('Add/Update/Delete Test', async () => {
  const executor = await SGExecutor.new({
    schemas: [SG.schema('Dummy', {
      plugin: {
        addMutation: true,
        updateMutation: true,
        deleteMutation: true
      }
    }).fields({
      number: 'Number',
      numbers: ['Number'],
      boolean: {
        $type: 'Boolean',
        required: false,
        resolve: async function ({ boolean }) {
          return boolean
        }
      },
      booleans: {
        $type: ['Boolean'],
        required: false
      },
      date: 'Date',
      integer: 'Integer',
      string: 'String',
      enum: new Set(['A', 'B', 'C']),
      enums: [new Set(['A', 'B', 'C'])],
      dummyA: 'Dummy',
      dummyB: ['Dummy'],
      dummyC: {
        at: 'Date',
        enum: new Set(['A', 'B', 'C']),
        enums: [new Set(['A', 'B', 'C'])],
        dummyE: 'Dummy',
        dummyF: ['Dummy']
      }
    })]
  }, {})

  const values = {
    number: 123.2,
    numbers: [1.1, 9.1],
    boolean: true,
    booleans: [false, true],
    date: (new Date()).toJSON(),
    integer: 999,
    string: 'Hello',
    enum: 'A',
    enums: ['A', 'B']
  }

  const addResult = await executor.exec(`
  mutation($input:AddDummyInput!){
    addDummy(input:$input){
      clientMutationId
      addedDummyEdge{
        node{
          id
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
  `, {
    input: {
      clientMutationId: 'XX',
      ...values
    }
  })
  expect(addResult.errors).toBeUndefined()
  const dummy1 = addResult.data.addDummy.addedDummyEdge.node

  const updateValues = {
    number: 13.2,
    numbers: [9.0],
    boolean: false,
    booleans: [true, true, false],
    date: (new Date()).toJSON(),
    integer: 0,
    string: 'Hello2',
    enum: 'B',
    enums: ['B', 'B', 'A'],
    dummyAId: dummy1.id,
    dummyB: [dummy1.id],
    dummyC: {
      at: (new Date()).toJSON(),
      enum: 'C',
      enums: ['C', 'B'],
      dummyE: dummy1.id,
      dummyF: [dummy1.id]
    }
  }

  const updateResult = await executor.exec(`
  mutation($input:UpdateDummyInput!){
    updateDummy(input:$input){
      clientMutationId
      changedDummy{
          number
          numbers
          boolean
          booleans
          date
          integer
          string
          enum
          enums
          dummyA {id number}
          dummyB {id numbers}
          dummyC {
              at
              enum
              enums
              dummyE {id enum}
              dummyF {id date}  
          }
      }
    }
  }
  `, {
    input: {
      clientMutationId: 'XX',
      id: dummy1.id,
      values: updateValues
    }
  })

  expect(updateResult.errors).toBeUndefined()
  const changedDummy1 = updateResult.data.updateDummy.changedDummy
  expect(changedDummy1.number).toEqual(updateValues.number)
  expect(changedDummy1.numbers).toEqual(updateValues.numbers)
  expect(changedDummy1.boolean).toEqual(updateValues.boolean)
  expect(changedDummy1.booleans).toEqual(updateValues.booleans)
  expect(changedDummy1.date).toEqual(updateValues.date)
  expect(changedDummy1.integer).toEqual(updateValues.integer)
  expect(changedDummy1.string).toEqual(updateValues.string)
  expect(changedDummy1.enum).toEqual(updateValues.enum)
  expect(changedDummy1.enums).toEqual(updateValues.enums)
  expect(changedDummy1.dummyA).toEqual({ id: dummy1.id, number: updateValues.number })
  expect(changedDummy1.dummyB).toEqual([{ id: dummy1.id, numbers: updateValues.numbers }])
  expect(changedDummy1.dummyC).toEqual({
    at: updateValues.dummyC.at,
    enum: updateValues.dummyC.enum,
    enums: updateValues.dummyC.enums,
    dummyE: { id: dummy1.id, enum: updateValues.enum },
    dummyF: [{ id: dummy1.id, date: updateValues.date }]
  })

  const deleteResult = await executor.exec(`
  mutation{
    deleteDummy(input:{
      clientMutationId: "XX",
      id: "${dummy1.id}"
      }
    ){
      clientMutationId
      deletedDummy{
         number
      }
    }
  }
  `, {})
  expect(deleteResult.errors).toBeUndefined()
  expect(deleteResult.data.deleteDummy.deletedDummy.number).toEqual(updateValues.number)
})
