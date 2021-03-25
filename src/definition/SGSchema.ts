import _ from 'lodash'
import {
  ColumnFieldConfigMap,
  InputFieldConfigMap,
  LinkedFieldConfigMap,
  MutationConfigMap,
  QueryConfigMap,
  SchemaOptions
} from '../Definition'
import Sequelize, {
  BelongsToManyOptions,
  BelongsToOptions,
  HasManyOptions,
  HasOneOptions
} from 'sequelize'

/**
 * @public
 */
export type HasOneConfig = {
  [key: string]: {
    config?: Object
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
    config?: { [key: string]: any }
    target: string
    description?: string
    foreignField?: string
    hidden?: boolean
    conditionFields?: InputFieldConfigMap
    order?: Array<Array<any>>
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

export class SGSchema {
  name: string

  sequelize: Sequelize.Sequelize

  config: {
    fields: ColumnFieldConfigMap
    links: LinkedFieldConfigMap
    associations: AssociationConfig
    queries: QueryConfigMap
    mutations: MutationConfigMap
    methods: {
      [id: string]: any
    }
    statics: {
      [id: string]: any
    }
  }

  options: SchemaOptions

  constructor(name: string, options: SchemaOptions = {}) {
    this.name = name
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
      mutations: {},
      methods: {},
      statics: {}
    }
    this.options = options
  }

  /**
   * Add the model base fields, and each field has a corresponding database column.
   * In default, each field generate a GraphQL field, unless it config with "hidden:true".
   */
  fields(fields: ColumnFieldConfigMap): SGSchema {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  /**
   * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
   */
  links(links: LinkedFieldConfigMap): SGSchema {
    this.config.links = Object.assign(this.config.links, links)
    return this
  }

  /**
   * Add the GraphQL query methods.
   */
  queries(queries: QueryConfigMap): SGSchema {
    // TODO duplicate check
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations(mutations: MutationConfigMap): SGSchema {
    // TODO duplicate check
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add instance method to current Schema.
   */
  methods(methods: { [key: string]: any }): SGSchema {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  /**
   * Add statics method to current Schema.
   */
  statics(statics: { [key: string]: any }): SGSchema {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
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
