// @flow
import _ from 'lodash'
import type { LinkedFieldConfig, QueryConfig, MutationConfig,
  FieldType, SchemaOptionConfig, HasOneConfig, BelongsToConfig, HasManyConfig,
  BelongsToManyConfig, AssociationConfig} from '../Definition'

export default class Schema<T> {
  name:string

  config:{
    fields:{[id:string]: FieldType},
    links:{[id:string]:LinkedFieldConfig},
    associations:AssociationConfig<T>,
    options:SchemaOptionConfig,
    queries:{[id:string]: QueryConfig<T>},
    mutations:{[id:string]: MutationConfig<T>},
    methods:{[id:string]: any},
    statics:{[id:string]: any}
  }

  constructor (name:string, options:SchemaOptionConfig = {}) {
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
  fields (fields:{[id:string]: FieldType}):Schema<T> {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  /**
   * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
   */
  links (links:{[id:string]: LinkedFieldConfig}):Schema<T> {
    this.config.links = Object.assign(this.config.links, links)
    return this
  }

  /**
   * Add the GraphQL query methods.
   */
  queries (queries:{[string]:QueryConfig<T>}):Schema<T> {
    // TODO duplicate check
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations (mutations:{[string]:MutationConfig<T>}):Schema<T> {
    // TODO duplicate check
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add instance method to current Schema.
   */
  methods (methods:{[string]:any}):Schema<T> {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  /**
   * Add statics method to current Schema.
   */
  statics (statics:{[string]:any}):Schema<T> {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#hasone|HasOne} relations to current Schema.
   */
  hasOne (config:HasOneConfig<T>):Schema<T> {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasOne[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto|BelongsTo} relations to current Schema.
   */
  belongsTo (config:BelongsToConfig):Schema<T> {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsTo[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations|HasMany} relations to current Schema.
   */
  hasMany (config:HasManyConfig<T>):Schema<T> {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasMany[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations|BelongsToMany} relations to current Schema.
   */
  belongsToMany (config:BelongsToManyConfig):Schema<T> {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsToMany[key] = value
    })
    return this
  }

  plugin<E> (plugin:(schema:Schema<any>, options:E)=>void, options:E) {
    plugin(this, options)
  }
}
