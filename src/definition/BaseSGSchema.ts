import {
  BaseSGSchemaOptions,
  SGColumnFieldConfigMap,
  SGLinkedFieldConfigMap,
  SGMutationConfigMap,
  SGQueryConfigMap,
  SGSubscriptionConfigMap
} from '..'

export class BaseSGSchema {
  name: string

  config: {
    fields: SGColumnFieldConfigMap
    links: SGLinkedFieldConfigMap
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

  options: BaseSGSchemaOptions

  constructor(name: string, options: BaseSGSchemaOptions = {}) {
    this.name = name
    this.config = {
      fields: {},
      links: {},
      queries: {},
      subscriptions: {},
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
  fields<T extends BaseSGSchema>(this: T, fields: SGColumnFieldConfigMap): T {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  /**
   * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
   */
  links<T extends BaseSGSchema>(this: T, links: SGLinkedFieldConfigMap): T {
    this.config.links = Object.assign(this.config.links, links)
    return this
  }

  /**
   * Add the GraphQL query methods.
   */
  queries<T extends BaseSGSchema>(this: T, queries: SGQueryConfigMap): T {
    // TODO duplicate check
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL subscription methods.
   */
  subscriptions<T extends BaseSGSchema>(
    this: T,
    subscriptions: SGSubscriptionConfigMap
  ): T {
    // TODO duplicate check
    this.config.subscriptions = Object.assign(
      this.config.subscriptions,
      subscriptions
    )
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations<T extends BaseSGSchema>(
    this: T,
    mutations: SGMutationConfigMap
  ): T {
    // TODO duplicate check
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add instance method to current Schema.
   */
  methods<T extends BaseSGSchema>(this: T, methods: { [key: string]: any }): T {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  /**
   * Add statics method to current Schema.
   */
  statics<T extends BaseSGSchema>(this: T, statics: { [key: string]: any }): T {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  plugin<E>(plugin: (schema: BaseSGSchema, options: E) => void, options: E) {
    plugin(this, options)
  }
}
