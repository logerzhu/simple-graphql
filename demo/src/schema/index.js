// @flow
import {mergeSchemas} from 'graphql-tools'
import type {IResolversParameter}  from 'graphql-tools'
import _ from 'lodash'
import Sequelize from 'sequelize'
import cls from 'continuation-local-storage'
import path from 'path'
import fs from 'fs'

import SG from '../../../src/index'
import {dbCfg} from '../config'
import {remoteSchema} from './remote/remote'
import {cfg, endPoint} from './remote/endPoints'


const namespace = cls.createNamespace('my-db-namespace')
Sequelize.useCLS(namespace)

const sequelize = new Sequelize(dbCfg.schema, dbCfg.user, dbCfg.password, dbCfg.options)
sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.');
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

function listModels(dir: string): {
  models:   Array<SG.Schema>,
  services: Array<SG.Service>,
  linkInfos:Array<{[id:string]: any}>
} {
  const models: Array<SG.Schema> = []
  const services: Array<SG.Service> = []
  const linkInfos: Array<{[id:string]: any}> = []
  const handleFile = (d) => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
    const stats = fs.statSync(path.resolve(__dirname, dir, file))
    const relativePath = [dir, file].join('/')
    if (stats.isDirectory()) {
      return handleFile(relativePath)
    } else if (stats.isFile()) {
      if (file.match(/\.js$/) !== null && file !== 'index.js') {
        const name = './' + relativePath.replace('.js', '')
        const model = require(name).default
        if (model instanceof SG.Schema) {
          models.push(model)

          if (model.linkInfo) {
            console.log('linkinfo', model.linkInfo)
            linkInfos.push(model.linkInfo)
          }

        } else if (model instanceof SG.Service) {
          services.push(model)
        } else {
          console.log(`${relativePath} is not valid schema or service`)
          console.log(model)
        }

      }
    }
  })
  handleFile(dir)
  return {
    models,
    services,
    linkInfos
  }
}

function buildLocalSchemas(models: Array<SG.Schema>, services: Array<SG.Service>) {

  const schema = SG.build({
    sequelize: sequelize, schemas: models, services: services, options: {
      hooks: [{
        description: 'Enable transaction on mutations',
        filter: ({type, config}) => type === 'mutation',
        hook: async function ({type, config}, {source, args, context, info, models}, next) {
          return sequelize.transaction(function (t) {
            return next()
          })
        }
      }, {
        description: 'ACL hook example',
        filter: ({type, config}) => type === 'query' || type === 'mutation',
        hook: async function ({type, config}, {source, args, context, info, models}, next) {
          if (config.config && config.config.acl) {
            console.log("ACL config for " + config.name + ":" + config.config.acl)
          }
          return next()
        }
      }],
      mutation: {
        payloadFields: ['viewer']
      }
    },

  }).graphQLSchema

  sequelize.sync({
    force: true,
    //logging: console.log
  }).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))

  sequelize.showAllSchemas()

  return schema
}

function buildLinkInfos(linkInfos: Array<{[id:string]: any}>): {
  defs:?Array<string>,
  resolvers:?IResolversParameter
} {
  if (_.isEmpty(linkInfos))
    return {defs: [], resolvers: {}}

  let queryDefs: string = ''
  let mutationDefs: string = ''
  let resolvers: IResolversParameter = {
    Query: {},
    Mutation: {}
  }

  linkInfos.forEach(info => {
    //Query
    _.forOwn(info.Query, (value, key) => {
      queryDefs += `${key}${value.def}\n`
      resolvers.Query[key] = async(root, args, context, info) => {
        return value.resolve(args, context, info, SG.getSGContext())
      }
    })

    //Mutation
    _.forOwn(info.Mutation, (value, key) => {
      mutationDefs += `${key}${value.def}\n`
      resolvers.Mutation[key] = async(root, args, context, info) => {
        return value.resolve(args, context, info, SG.getSGContext())
      }
    })
  })

  let defs: Array<string> = []
  if (queryDefs && queryDefs.length) {
    defs.push(`extend type Query {
      ${queryDefs}}`
    )
  }

  if (mutationDefs && mutationDefs.length) {
    defs.push(`extend type Mutation {
      ${mutationDefs}}`
    )
  }

  console.log('defs:', defs)
  console.log('resolver', resolvers)

  return {
    defs,
    resolvers
  }
}

async function mergeSchema(ONLY_LOCAL_SCHEMA: string) {
  console.log(typeof ONLY_LOCAL_SCHEMA)
  console.log(ONLY_LOCAL_SCHEMA)

  // if(ONLY_LOCAL_SCHEMA)
  //   return localSchemas

  const commonSchemas = await remoteSchema(endPoint(cfg.common))
  const {models, services, linkInfos} = listModels('models')
  console.log('ret', linkInfos)
  const localSchemas = buildLocalSchemas(models, services)
  // console.log(localSchemas)
  const {defs, resolvers} = buildLinkInfos(linkInfos)
  let schemas = [localSchemas, commonSchemas]
  if (defs) {
    let gql = defs.join('/n')
    if (!_.isEmpty(gql)) {
      schemas.push(gql)
    }
  }


  console.log('defs:', defs)
  const schema = mergeSchemas({
    schemas,
    resolvers
  })

  return schema
}

module.exports = {
  mergeSchema,
  sequelize
}
