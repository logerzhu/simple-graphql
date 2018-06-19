// @flow
import _ from 'lodash'
import Sequelize from 'sequelize'

import Schema from '../definition/Schema'

import toSequelizeModel from './toSequelizeModel.js'
import plugin from './plugin'

export default class SequelizeContext {
  sequelize:Sequelize

  plugins:{[string]:(Schema<any>, any)=>void}

  constructor (sequelize:Sequelize) {
    this.sequelize = sequelize
    this.plugins = {
      singularQuery: plugin.singularQueryPlugin,
      pluralQuery: plugin.pluralQueryPlugin,

      addMutation: plugin.addMutationPlugin,
      deleteMutation: plugin.deleteMutationPlugin,
      updateMutation: plugin.updateMutationPlugin,

      hasManyLinkedField: plugin.hasManyLinkedFieldPlugin,
      hasOneLinkedField: plugin.hasOneLinkedFieldPlugin
    }
  }

  define (schema:Schema<any>):Sequelize.Model {
    return toSequelizeModel(this.sequelize, schema)
  }

  applyPlugin (schema:Schema<any>):void {
    const defaultPluginConfig = {
      hasManyLinkedField: {},
      hasOneLinkedField: {}
    }
    // console.log(schema)
    _.forOwn({...defaultPluginConfig, ...schema.config.options.plugin}, (value, key) => {
      if (this.plugins[key] && value) {
        this.plugins[key](schema, value)
      }
    })
  }

  /**
   * Query the model with specify args and return the connection data
   */
}
