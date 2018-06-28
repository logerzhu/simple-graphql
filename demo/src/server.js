import express from 'express'
import bodyParser from 'body-parser'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import cors from 'cors'
import { isString } from 'lodash'
import { createServer } from 'http'
import { execute, subscribe } from 'graphql'

import {isEmpty} from './utils'
import { buildSequelize, buildSchema } from './schema'
import pubSub from './pubsub'
// import schema from './schema'
import {mergeSchema} from './schema'
const app = express()
const server = createServer(app)
const graphqlEndpoint = '/graphql'
const graphiqlEndpoint = '/graphiql'
const subscriptionEndpoint = '/subscriptions'

// function parseCookies (request) {
//   const list = {}
//   const rc = request.headers.cookie
//
//   if (rc) {
//     rc.split(';').forEach((cookie) => {
//       const parts = cookie.split('=')
//       list[parts.shift().trim()] = decodeURI(parts.join('='))
//     })
//   }
//   return list
// }

export async function run ({PORT,ONLY_LOCAL_SCHEMA}) {
 if (isEmpty(PORT)) { throw Error(`请在命令行或者env文件提供port:${PORT}`) }

  let port = 3301
  if (isString(PORT)) {
    port = parseInt(PORT, 10)
  }

  // let models = await buildSequelize()
  // if (isEmpty(models)) {
  //   console.log('Could not connect to database')
  //   return
  // }
  const schema = await mergeSchema(ONLY_LOCAL_SCHEMA)

  app.use(cors('*'))

  app.use(
    graphqlEndpoint,
    bodyParser.json(),
    graphqlExpress({
      schema
    })
  )

  app.use(
    graphiqlEndpoint,
    graphiqlExpress({
      endpointURL: graphqlEndpoint,
      subscriptionsEndpoint: `ws://localhost:${port}${subscriptionEndpoint}`
    })
  )


  server.listen(PORT, () => {
    console.log(PORT,'is running' )
  })
}
