// @flow
import Sequelize from 'sequelize'
import path from 'path'
import fs from 'fs'
import GS from '../../'

export default function (sequelize:Sequelize) {
  function listSchemas (dir:string):Array<GS.Schema> {
    const models:Array<GS.Schema> = []
    const handleFile = (d) => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
      const stats = fs.statSync(path.resolve(__dirname, dir, file))
      const relativePath = [dir, file].join('/')
      if (file === '__tests__') {
        // ignore test folder
      } else if (stats.isDirectory()) {
        for (let model of listSchemas(relativePath)) {
          models.push(model)
        }
      } else if (stats.isFile()) {
        if (file.match(/\.js$/) !== null && file !== 'index.js') {
          const name = './' + relativePath.replace('.js', '')
          const modelOrFun = require(name).default
          if (modelOrFun instanceof GS.Schema) {
            models.push(modelOrFun)
          } else if ((typeof modelOrFun) === 'function') {
            const model = modelOrFun(sequelize)
            if (model instanceof GS.Schema) {
              models.push(model)
            } else {
              console.log('Incorrect model definition file: ' + name)
            }
          }
        }
      }
    })
    handleFile(dir)
    return models
  }

  const models = listSchemas('schema')

  return GS.build(sequelize, models, {
    hooks: [{
      description: 'Enable transaction on mutations',
      filter: ({type, config}) => type === 'mutation',
      hook: async function ({type, config}, {source, args, context, info, models}, next) {
        return sequelize.transaction(function (t) {
          return next()
        })
      }
    }, {
      description: '自定义hook',
      filter: ({type, config}) => type === 'mutation' && config.config && config.config.hook,
      hook: async function (action, invokeInfo, next) {
        return action.config.config.hook(action, invokeInfo, next)
      }
    }],
    mutation: {
      payloadFields: ['viewer']
    }
  })
}
