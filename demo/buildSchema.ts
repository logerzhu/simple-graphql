import Sequelize from 'sequelize'
import path from 'path'
import fs from 'fs'
import {SGSchema, buildGraphQLContext} from '../src'
import DemoService from './definition/service/DemoService'

export default function (sequelize: Sequelize.Sequelize) {
  function listSchemas(dir: string): Array<SGSchema> {
    const schemas: Array<SGSchema> = []
    const handleFile = d => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
      const stats = fs.statSync(path.resolve(__dirname, dir, file))
      const relativePath = [dir, file].join('/')
      if (file === '__tests__') { // ignore test folder
      } else if (stats.isDirectory()) {
        for (const schema of listSchemas(relativePath)) {
          schemas.push(schema)
        }
      } else if (stats.isFile()) {
        if (file.match(/\.ts$/) !== null && file !== 'index.ts') {
          const name = './' + relativePath.replace('.ts', '')
          const schemaOrFun = require(name).default
          if (schemaOrFun instanceof SGSchema) {
            schemas.push(schemaOrFun)
          } else if (typeof schemaOrFun === 'function') {
            const schema = schemaOrFun(sequelize)
            if (schema instanceof SGSchema) {
              schemas.push(schema)
            } else {
              console.log('Incorrect schema definition file: ' + name)
            }
          }
        }
      }
    })
    handleFile(dir)
    return schemas
  }

  const schemas = listSchemas('definition/schema')

  return buildGraphQLContext(sequelize, {
    schemas: schemas,
    services: [DemoService],
    dataTypes: [{
      name: 'Message',
      definition: {
        discriminator: 'variant',
        mapping: {
          文本: {type: 'String'},
          Dummy: {type: 'Dummy'}
        }
      }
    }],
    hooks: [{
      description: 'Enable transaction on mutations',
      priority: 100,
      filter: ({
                 type,
                 name,
                 targetConfig
               }) => type === 'mutation',
      hook: async function (action, invokeInfo, next) {
        return (sequelize as any).transaction(t => {
          return next()
        })
      }
    }, {
      description: '自定义hook',
      priority: 99,
      filter: ({
                 type,
                 name,
                 targetConfig
               }) => type === 'mutation' && targetConfig.config != null && targetConfig.config.hook != null,
      hook: async function (action, invokeInfo, next) {
        const config = action.targetConfig.config
        if (config && config.hook) {
          return config.hook(action, invokeInfo, next)
        }
      }
    }],
    queries: {
      weather: {
        output: {type: 'String'},
        resolve: async function (args, context, info, sgContext) {
          return sgContext.services.DemoService.gWeather
        }
      }
    },
    mutations: {
      setWeather: {
        input: {
          weather: {
            type: 'String',
            nullable: false
          }
        },
        output: {
          weather: {
            type: 'String',
            nullable: false
          }
        },
        mutateAndGetPayload: async function ({
                                               weather
                                             }, context, info, sgContext) {
          sgContext.services.DemoService.gWeather = weather
          return {
            weather: weather
          }
        }
      }
    }
  }, {})
}
