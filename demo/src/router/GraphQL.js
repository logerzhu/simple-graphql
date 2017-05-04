// @flow
import express from 'express'
import bodyParser from 'body-parser'
import graphQLHTTP from 'express-graphql'

import Schema from '../schema'

const router = express.Router()

router.use(bodyParser.json())
router.use('/', graphQLHTTP({
  schema: Schema,
  graphiql: true
}))

export default router
