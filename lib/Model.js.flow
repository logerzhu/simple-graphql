// @flow

import type { LinkFieldTypeConfig, QueryConfig, MutationConfig,
  FieldType, ModelOption, HasOneConfig, BelongsToConfig, HasManyConfig,
  BelongsToManyConfig, AssociationConfig} from './Definition'

/**
 * dd
 */
export default class Model {
  name:string

  config:{
    fields:{[id:string]: FieldType},
    links:{[id:string]:LinkFieldTypeConfig},
    associations:AssociationConfig,
    options:ModelOption,
    queries:{[id:string]: QueryConfig},
    mutations:{[id:string]: MutationConfig},
    methods:{[id:string]: any},
    statics:{[id:string]: any}
  }

  constructor (name:string, options:ModelOption = {}) {
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
   *
   * @param fields
   * @returns {Model}
   */
  fields (fields:{[id:string]: FieldType}):Model {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  links (links:{[id:string]: LinkFieldTypeConfig}):Model {
    this.config.links = Object.assign(this.config.links, links)
    return this
  }

  queries (queries:{[id:string]:QueryConfig}):Model {
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  mutations (mutations:{[id:string]:MutationConfig}):Model {
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  methods (methods:{[id:string]:any}):Model {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  statics (statics:{[id:string]:any}):Model {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  hasOne (config:HasOneConfig):Model {
    this.config.associations.hasOne.push(config)
    return this
  }

  belongsTo (config:BelongsToConfig):Model {
    this.config.associations.belongsTo.push(config)
    return this
  }

  hasMany (config:HasManyConfig):Model {
    this.config.associations.hasMany.push(config)
    return this
  }

  belongsToMany (config:BelongsToManyConfig):Model {
    this.config.associations.belongsToMany.push(config)
    return this
  }
}
