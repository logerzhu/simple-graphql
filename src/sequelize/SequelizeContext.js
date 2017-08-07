// @flow
import Sequelize from 'sequelize'

import Schema from '../schema/Schema'

import toSequelizeModel from './toSequelizeModel.js'
import plugin from './plugin'

export default class SequelizeContext {
  sequelize:Sequelize

  constructor (sequelize:Sequelize) {
    this.sequelize = sequelize
  }

  define (schema:Schema):Sequelize.Model {
    return toSequelizeModel(this.sequelize, schema)
  }

  plugins ():Array<(Schema, any)=>void> {
    return [
      plugin.singularQueryPlugin,
      plugin.pluralQueryPlugin,

      plugin.addMutationPlugin,
      plugin.deleteMutationPlugin,
      plugin.updateMutationPlugin]
  }

  /**
   * Query the model with specify args and return the connection data
   */
}
