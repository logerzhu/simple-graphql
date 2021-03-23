import Sequelize from 'sequelize'
import path from 'path'
import fs from 'fs'
import SG, {Schema} from '../src'
import DemoService from './definition/service/DemoService'

export default function (sequelize: Sequelize.Sequelize) {
  function listSchemas(dir: string): Array<Schema> {
    const schemas: Array<Schema> = []
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
          if (schemaOrFun instanceof SG.Schema) {
            schemas.push(schemaOrFun)
          } else if (typeof schemaOrFun === 'function') {
            const schema = schemaOrFun(sequelize)
            if (schema instanceof SG.Schema) {
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

  return SG.build(sequelize, {
    schemas: schemas,
    services: [DemoService],
    dataTypes: [{
      name: 'Message',
      definition:{
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
                 options
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
                 options
               }) => type === 'mutation' && options.config != null && options.config.hook != null,
      hook: async function (action, invokeInfo, next) {
        const config = action.options.config
        if (config && config.hook) {
          return config.hook(action, invokeInfo, next)
        }
      }
    }]
  }, {})
}
