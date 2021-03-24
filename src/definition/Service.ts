import { MutationConfigMap, QueryConfigMap } from '../Definition'

export default class Service {
  name: string

  config: {
    queries: QueryConfigMap
    mutations: MutationConfigMap
    statics: {
      [id: string]: any
    }
  }
  Ø
  constructor(name: string) {
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
  queries(queries: QueryConfigMap): Service {
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations(mutations: MutationConfigMap): Service {
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add statics method to current Service.
   */
  statics(statics: { [key: string]: any }): Service {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }
}
