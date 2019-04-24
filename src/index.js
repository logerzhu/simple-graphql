// @flow

import Schema from './definition/Schema'
import Service from './definition/Service'

import type { SchemaOptionConfig } from './Definition'
import build from './build'

export type {
  HookAction,
  Hook,
  Plugin,
  SGContext,
  ResolverContext,
  InterfaceContext,
  FieldTypeContext,
  FieldResolve,
  RootResolve,
  FieldType,
  InputFieldOptions,
  FieldOptions,
  LinkedFieldOptions,
  ColumnFieldOptions,
  QueryOptions,
  MutationOptions,
  SchemaOptionConfig,
  BuildOptions
} from './Definition'

const SimpleGraphQL = {

  Schema: Schema,

  Service: Service,

  /**
   * Define a Schema
   *
   * @param name
   * @param options
   */
  schema: (name: string, options: SchemaOptionConfig = {}): Schema => new Schema(name, options),

  service: (name: string): Service => new Service(name),

  /**
   * Build the GraphQL Schema
   */
  build: build
}

export default SimpleGraphQL
