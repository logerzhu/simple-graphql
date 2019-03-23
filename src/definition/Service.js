// @flow
import type { QueryConfig, MutationConfig } from '../Definition'

export default class Service<T> {
  name:string

  config:{
    queries:{[id:string]: QueryConfig<T>},
    mutations:{[id:string]: MutationConfig<T>},
    statics:{[id:string]: any}
  }

  constructor (name:string) {
    this.name = name
    this.config = {
      queries: {},
      mutations: {},
      statics: {}
    }
  }

  /**
   * Add the GraphQL query methods.
   */
  queries (queries:{[string]:QueryConfig<T>}):Service<T> {
    // TODO duplicate check
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations (mutations:{[string]:MutationConfig<T>}):Service<T> {
    // TODO duplicate check
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add statics method to current Service.
   */
  statics (statics:{[string]:any}):Service<T> {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }
}
