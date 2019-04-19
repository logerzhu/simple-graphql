// @flow
import Sequelize from 'sequelize'
import path from 'path'
import fs from 'fs'
import GS from '../../'
import DemoService from './definition/service/DemoService'

export default function (sequelize: Sequelize) {
  function listSchemas (dir: string): Array<GS.Schema> {
    const schemas: Array<GS.Schema> = []
    const handleFile = (d) => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
      const stats = fs.statSync(path.resolve(__dirname, dir, file))
      const relativePath = [dir, file].join('/')
      if (file === '__tests__') {
        // ignore test folder
      } else if (stats.isDirectory()) {
        for (let schema of listSchemas(relativePath)) {
          schemas.push(schema)
        }
      } else if (stats.isFile()) {
        if (file.match(/\.js$/) !== null && file !== 'index.js') {
          const name = './' + relativePath.replace('.js', '')
          const schemaOrFun = require(name).default
          if (schemaOrFun instanceof GS.Schema) {
            schemas.push(schemaOrFun)
          } else if ((typeof schemaOrFun) === 'function') {
            const schema = schemaOrFun(sequelize)
            if (schema instanceof GS.Schema) {
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

  return GS.build(
    sequelize,
    {
      schemas: schemas,
      services: [DemoService],
      hooks: [{
        description: 'Enable transaction on mutations',
        priority: 100,
        filter: ({ type, name, options }) => type === 'mutation',
        hook: async function (action, invokeInfo, next) {
          return sequelize.transaction(function (t) {
            return next()
          })
        }
      }, {
        description: '自定义hook',
        priority: 99,
        filter: ({ type, name, options }) => type === 'mutation' && options.config && options.config.hook,
        hook: async function (action, invokeInfo, next) {
          return action.config.config.hook(action, invokeInfo, next)
        }
      }]
    },
    {}
  )
}
