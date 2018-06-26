// @flow
import {HttpLink} from 'apollo-link-http'
import {introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools'
import fetch from 'node-fetch'

async function remoteSchema (endPoint:String) {
// 关联其他服务器的schema
  const link = new HttpLink({uri: endPoint, fetch})
  let rSchema = await introspectSchema(link)
  const schema = makeRemoteExecutableSchema({
    schema: rSchema,
    link: link
  })
  return schema
}

module.exports = {
  remoteSchema
}
