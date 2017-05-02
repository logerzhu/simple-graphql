//@flow
import express from 'express'

import compression from 'compression'
import GraphQLRouter from './router/GraphQL'

const app = express()

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      // don't compress responses with this request header
      return false
    }
    // fallback to standard filter function
    return compression.filter(req, res)
  }
}))

app.use('/graphql', GraphQLRouter)

const SERVER_PORT = 9413

app.listen(SERVER_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${SERVER_PORT}`
))
