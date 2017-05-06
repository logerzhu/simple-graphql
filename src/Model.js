// @flow

import type { LinkedFieldConfig, QueryConfig, MutationConfig,
  FieldType, ModelOptionConfig, HasOneConfig, BelongsToConfig, HasManyConfig,
  BelongsToManyConfig, AssociationConfig} from './Definition'

/**
 * TODO
 * @example
 */
export default class Model {
  name:string

  config:{
    fields:{[id:string]: FieldType},
    links:{[id:string]:LinkedFieldConfig},
    associations:AssociationConfig,
    options:ModelOptionConfig,
    queries:{[id:string]: QueryConfig},
    mutations:{[id:string]: MutationConfig},
    methods:{[id:string]: any},
    statics:{[id:string]: any}
  }

  constructor (name:string, options:ModelOptionConfig = {}) {
    this.name = name
    this.config = {
      fields: {},
      links: {},
      associations: {
        hasOne: [],
        belongsTo: [],
        hasMany: [],
        belongsToMany: []
      },
      options: options,
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
  fields (fields:{[id:string]: FieldType}):Model {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  /**
   * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
   */
  links (links:{[id:string]: LinkedFieldConfig}):Model {
    this.config.links = Object.assign(this.config.links, links)
    return this
  }

  /**
   * Add the GraphQL query methods.
   */
  queries (queries:{[string]:QueryConfig}):Model {
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations (mutations:{[string]:MutationConfig}):Model {
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add instance method to current Model.
   */
  methods (methods:{[string]:any}):Model {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  /**
   * Add statics method to current Model.
   */
  statics (statics:{[string]:any}):Model {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#hasone|HasOne} relations to current Model.
   */
  hasOne (config:HasOneConfig):Model {
    this.config.associations.hasOne.push(config)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto|BelongsTo} relations to current Model.
   */
  belongsTo (config:BelongsToConfig):Model {
    this.config.associations.belongsTo.push(config)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations|HasMany} relations to current Model.
   */
  hasMany (config:HasManyConfig):Model {
    this.config.associations.hasMany.push(config)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations|BelongsToMany} relations to current Model.
   */
  belongsToMany (config:BelongsToManyConfig):Model {
    this.config.associations.belongsToMany.push(config)
    return this
  }
}
