// flow
/* eslint-env jest */
import GraphQLExecutor from './GraphQLExecutor'

const graphQL = new GraphQLExecutor()

test('ClinicUser with username:root exist', async () => {
  const queryUserResult = await graphQL.exec(`
  query{
  clinicUsers(condition:{username:"root"}) {
      edges {
        node {
          id
          username
        }
      }
    }
  }
  `)
  expect(queryUserResult.data.clinicUsers.edges.length).toBe(1)
})
