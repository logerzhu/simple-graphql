import _ from 'lodash'
import Sequelize, {
  BelongsToManyOptions,
  BelongsToOptions,
  HasManyOptions,
  HasOneOptions,
  OrderItem
} from 'sequelize'
import {
  SGSchemaOptions,
  SGColumnFieldConfigMap,
  SGHookOptionsMap,
  SGInputFieldConfigMap,
  SGLinkedFieldConfigMap,
  SGMutationConfigMap,
  SGQueryConfigMap,
  SGSubscriptionConfigMap
} from '../index'
import { BaseSGSchema } from './BaseSGSchema'

/**
 * @public
 */
export type HasOneConfig = {
  [key: string]: {
    hookOptions?: SGHookOptionsMap
    hidden?: boolean
    target: string
    description?: string
    foreignField?: string
  } & HasOneOptions
}

/**
 * @public
 */
export type BelongsToConfig = {
  [key: string]: {
    hidden?: boolean
    target: string
    description?: string
    foreignField?: string
  } & BelongsToOptions
}

type HasManyConfig = {
  [key: string]: {
    hookOptions?: SGHookOptionsMap
    target: string
    description?: string
    foreignField?: string
    hidden?: boolean
    conditionFields?: SGInputFieldConfigMap
    order?: OrderItem[]
    outputStructure?: 'Connection' | 'Array'
  } & HasManyOptions
}

/**
 * @public
 */
type BelongsToManyConfig = {
  [key: string]: {
    hidden?: boolean
    description?: string
    target: string
    foreignField?: string
  } & BelongsToManyOptions
}

/**
 * @public
 */
type AssociationConfig = {
  hasOne: HasOneConfig
  belongsTo: BelongsToConfig
  hasMany: HasManyConfig
  belongsToMany: BelongsToManyConfig
}

export class SGSchema extends BaseSGSchema {
  sequelize: Sequelize.Sequelize

  config: {
    fields: SGColumnFieldConfigMap
    links: SGLinkedFieldConfigMap
    associations: AssociationConfig
    queries: SGQueryConfigMap
    subscriptions: SGSubscriptionConfigMap
    mutations: SGMutationConfigMap
    methods: {
      [id: string]: any
    }
    statics: {
      [id: string]: any
    }
  }

  options: SGSchemaOptions

  constructor(name: string, options: SGSchemaOptions = {}) {
    super(name, options)
    this.config = {
      fields: {},
      links: {},
      associations: {
        hasOne: {},
        belongsTo: {},
        hasMany: {},
        belongsToMany: {}
      },
      queries: {},
      subscriptions: {},
      mutations: {},
      methods: {},
      statics: {}
    }
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#hasone|HasOne} relations to current Schema.
   */
  hasOne(config: HasOneConfig): SGSchema {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasOne[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto|BelongsTo} relations to current Schema.
   */
  belongsTo(config: BelongsToConfig): SGSchema {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsTo[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations|HasMany} relations to current Schema.
   */
  hasMany(config: HasManyConfig): SGSchema {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasMany[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations|BelongsToMany} relations to current Schema.
   */
  belongsToMany(config: BelongsToManyConfig): SGSchema {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsToMany[key] = value
    })
    return this
  }

  plugin<E>(plugin: (schema: SGSchema, options: E) => void, options: E) {
    plugin(this, options)
  }
}
