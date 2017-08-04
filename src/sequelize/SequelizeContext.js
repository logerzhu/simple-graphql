// @flow
import Sequelize from 'sequelize'

import Model from  '../Model'

import toSequelizeModel from './toSequelizeModel.js'

export default class SequelizeContext {
  sequelize:Sequelize

  constructor (sequelize:Sequelize) {
    this.sequelize = sequelize
  }

  define (model:Model):Sequelize.Model {
    return toSequelizeModel(this.sequelize, model)
  }
}