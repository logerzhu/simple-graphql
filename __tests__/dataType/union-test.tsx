// @flow
/* eslint-env jest */
import { SGSchema } from '../../src'
import SGExecutor from '../SGExecutor'
import _ from 'lodash'

test('Union数据类型生成', async () => {
  const executor = await SGExecutor.new(
    {
      dataTypes: [
        {
          name: 'Text',
          definition: { type: 'String' }
        },
        {
          name: 'Union',
          definition: {
            discriminator: 'variant',
            mapping: {
              文本: { type: 'Text' },
              实体: { type: 'Dummy' },
              短文本: { type: 'Text' }
            }
          }
        }
      ],
      schemas: [
        new SGSchema('Dummy', {
          plugin: {
            addMutation: {
              enable: true
            }
          }
        }).fields({
          name: { type: 'Text' },
          data: { type: 'Union' },
          datas: { elements: { type: 'Union' } }
        })
      ]
    },
    {}
  )

  const values = {
    name: 'Hello',
    data: {
      variant: '实体',
      value: null
    },
    datas: null
  }

  const addResult1 = await executor.exec(
    `
  mutation($input:AddDummyInput!){
    addDummy(input:$input){
      clientMutationId
      addedDummyEdge{
        node{
          id
          name
          data{
            ... on _Union_Dummy{
              variant
              value{
                name
              }
            }
          }
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

  expect(addResult1.errors).toBeUndefined()
  const node1 = _.get(addResult1, 'data.addDummy.addedDummyEdge.node')
  expect(node1.name).toEqual(values.name)
  expect(node1.data).toEqual(values.data)

  const values2 = {
    name: 'Hello',
    data: {
      variant: '实体',
      value: node1.id
    },
    datas: [
      {
        variant: '文本',
        value: '测试'
      },
      {
        variant: '实体',
        value: node1.id
      }
    ]
  }
  const addResult2 = await executor.exec(
    `
  mutation($input:AddDummyInput!){
    addDummy(input:$input){
      clientMutationId
      addedDummyEdge{
        node{
          id
          name
          data{
            ... on _Union_Dummy{
              variant
              value{
                id
                name
              }
            }
          }
          datas{
            ... on _Union_Text{
              variant
              text:value
            }
            ... on _Union_Dummy{
              variant
              value{
                name
              }
            }
          }
        }
      }
    }
  }
  `,
    {
      input: {
        clientMutationId: 'XX',
        ...values2
      }
    }
  )

  expect(addResult2.errors).toBeUndefined()
  const node2 = _.get(addResult2, 'data.addDummy.addedDummyEdge.node')
  expect(node2.name).toEqual(values2.name)

  expect(node2.data.value.name).toEqual('Hello')
  expect(node2.datas[0].text).toEqual('测试')
  expect(node2.datas[1].value.name).toEqual('Hello')
})
