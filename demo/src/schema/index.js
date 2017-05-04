// @flow
import Sequelize from 'sequelize'
import path from 'path'
import fs from 'fs'
import GS from '../../../src'

import {dbCfg} from '../config'

const sequelize = new Sequelize(dbCfg.schema, dbCfg.user, dbCfg.password, dbCfg.options)

function listModels (dir:string):Array<GS.Model> {
  const models:Array<GS.Model> = []
  const handleFile = (d) => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
    const stats = fs.statSync(path.resolve(__dirname, dir, file))
    const relativePath = [dir, file].join('/')
    if (stats.isDirectory()) {
      return handleFile(relativePath)
    } else if (stats.isFile()) {
      if (file.match(/\.js$/) !== null && file !== 'index.js') {
        const name = './' + relativePath.replace('.js', '')
        const model = require(name).default
        if (model instanceof GS.Model) {
          models.push(model)
        }
      }
    }
  })
  handleFile(dir)
  return models
}

const models = listModels('models')

const schema = GS.build(sequelize, models, {})

sequelize.sync({
  force: false,
  logging: console.log
}).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))

sequelize.showAllSchemas()
export default schema
