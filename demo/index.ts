import express from 'express'
import {graphqlHTTP} from 'express-graphql'

import schema from './schema'
import sequelize from './sequelize'
import initData from './data'

import { WebSocketServer } from 'ws'; // yarn add ws
import { useServer } from 'graphql-ws/lib/use/ws';

async function startServer() {
  await sequelize.sync({
    force: true,
    logging: console.log
  })
  await initData(sequelize)

  const app = express()
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
    customFormatErrorFn: (error) => {
      console.error(error)
      return error
    }
  }))

  console.log('GraphQL Server is now running on http://localhost:4000/graphql')
  app.listen(4000)

  const wsServer = new WebSocketServer({
    port: 4001,
    path: '/graphql-ws',
  });

  useServer({ schema }, wsServer);

  console.log('GraphQL Ws Server is now running on ws://localhost:4001/graphql-ws')
}

startServer().then(() => null, err => console.log('Init GraphQL Server Fail', err))
