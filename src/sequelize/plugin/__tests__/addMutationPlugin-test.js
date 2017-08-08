// @flow
/* eslint-env jest */
import _ from 'lodash'
import GraphQLExecutor from '../../__tests__/GraphQLExecutor'

const graphQL = new GraphQLExecutor()

test('AddMutationPlugin should work.', async () => {
  const result = await graphQL.exec(`
  mutation{
    addUser(input:{
      clientMutationId:"XX",
      userName:"Demo",
      password:"password",
    }){
      addedUserEdge{
        cursor
        node{
          id
          userName
          password
          blocked
          registerAt
          createdAt
          updatedAt
          dueTodos {
            count
            edges {
              node {
                id
              }
            }
          }
          profile {
            id
          }
        }
      }
    }
  }
  `)
  expect(result.error).toBeUndefined()
  const userEdge = _.get(result.data, "addUser.addedUserEdge")
  expect(userEdge).toBeDefined()
  expect(userEdge.cursor).toBeDefined()

  const user = userEdge.node
  expect(user.id).toBeDefined()
  expect(user.userName).toEqual("Demo")
  expect(user.password).toEqual("password")
  expect(user.blocked).toEqual(false)
  expect(user.registerAt).toBeDefined()
  expect(user.createdAt).toBeDefined()
  expect(user.updatedAt).toBeDefined()
  expect(user.dueTodos).toBeDefined()
  expect(user.dueTodos.count).toEqual(0)
  expect(user.dueTodos.edges).toEqual([])
  expect(user.profile).toBeNull()

})
