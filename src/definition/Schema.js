// @flow
import _ from 'lodash'
import type {
  ColumnFieldOptions,
  InputFieldOptions,
  LinkedFieldOptions,
  MutationOptions,
  QueryOptions,
  SchemaOptionConfig
} from '../Definition'
import Sequelize from 'sequelize'
/**
 * @public
 */
export type HasOneConfig = {
  [string]: {
    config?: Object,
    hidden?: boolean,
    target: string,
    description?: string,
    foreignField?: string,
    foreignKey?: string,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean,
    scope?: Object
  }
}

/**
 * @public
 */
export type BelongsToConfig = {
  [string]: {
    hidden?: boolean,
    target: string,
    description?: string,
    foreignField?: string,
    foreignKey?: string | { name: string, allowNull?: boolean },
    targetKey?: string,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean
  }
}

type HasManyConfig = {
  [string]: {
    config?: Object,
    hidden?: boolean,
    conditionFields?: { [string]: InputFieldOptions },
    target: string,
    description?: string,
    through?: string | {
      model: string,
      scope?: Object,
      unique?: boolean
    },
    foreignField?: string,
    foreignKey?: string,
    sourceKey?: string,
    scope?: Object,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean,
    order?: Array<Array<any>>,
    outputStructure?: 'Connection' | 'Array'
  }
}

/**
 * @public
 */
type BelongsToManyConfig = {
  [string]: {
    hidden?: boolean,
    target: string,
    description?: string,
    through?: string | {
      model: string,
      scope?: Object,
      unique?: boolean
    },
    foreignField?: string | Object,
    otherKey?: string | Object,
    scope?: Object,
    timestamps?: boolean,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean
  }
}

/**
 * @public
 */
type AssociationConfig = {
  hasOne: HasOneConfig,
  belongsTo: BelongsToConfig,
  hasMany: HasManyConfig,
  belongsToMany: BelongsToManyConfig,
}

export default class Schema {
  name: string

  sequelize: Sequelize.Sequelize

  config: {
    fields: { [id: string]: ColumnFieldOptions },
    links: { [id: string]: LinkedFieldOptions },
    associations: AssociationConfig,
    options: SchemaOptionConfig,
    queries: { [id: string]: QueryOptions },
    mutations: { [id: string]: MutationOptions },
    methods: { [id: string]: any },
    statics: { [id: string]: any }
  }

  constructor (name: string, options: SchemaOptionConfig = {}) {
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
      options: options,
      dataTypes: {},
      queries: {},
      mutations: {},
      methods: {},
      statics: {}
    }
  }

  /**
   * Add the model base fields, and each field has a corresponding database column.
   * In default, each field generate a GraphQL field, unless it config with "hidden:true".
   */
  fields (fields: { [id: string]: ColumnFieldOptions }): Schema {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  /**
   * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
   */
  links (links: { [id: string]: LinkedFieldOptions }): Schema {
    this.config.links = Object.assign(this.config.links, links)
    return this
  }

  /**
   * Add the GraphQL query methods.
   */
  queries (queries: { [string]: QueryOptions }): Schema {
    // TODO duplicate check
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations (mutations: { [string]: MutationOptions }): Schema {
    // TODO duplicate check
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add instance method to current Schema.
   */
  methods (methods: { [string]: any }): Schema {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  /**
   * Add statics method to current Schema.
   */
  statics (statics: { [string]: any }): Schema {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#hasone|HasOne} relations to current Schema.
   */
  hasOne (config: HasOneConfig): Schema {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasOne[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto|BelongsTo} relations to current Schema.
   */
  belongsTo (config: BelongsToConfig): Schema {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsTo[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations|HasMany} relations to current Schema.
   */
  hasMany (config: HasManyConfig): Schema {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasMany[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations|BelongsToMany} relations to current Schema.
   */
  belongsToMany (config: BelongsToManyConfig): Schema {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsToMany[key] = value
    })
    return this
  }

  plugin<E> (plugin: (schema: Schema, options: E)=>void, options: E) {
    plugin(this, options)
  }
}
