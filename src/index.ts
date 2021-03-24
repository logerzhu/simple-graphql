import _Schema from './definition/Schema'
import _Service from './definition/Service'

import { SchemaOptionConfig } from './Definition'
import _build from './build'

import './plugin'

export {
  HookAction,
  HookOptions,
  PluginOptions,
  SGContext,
  ResolverContext,
  InterfaceContext,
  FieldTypeContext,
  FieldResolve,
  RootResolve,
  FieldType,
  InputFieldOptions,
  OutputFieldOptions,
  LinkedFieldOptions,
  ColumnFieldOptions,
  QueryOptions,
  MutationOptions,
  SchemaOptionConfig,
  BuildOptions
} from './Definition'

export type Schema = _Schema
export type Service = _Service

namespace SG {
  export const Schema = _Schema
  export const Service = _Service
  export const schema = (
    name: string,
    options: SchemaOptionConfig = {}
  ): _Schema => new _Schema(name, options)
  export const service = (name: string): _Service => new _Service(name)
  export const build = _build
}

export default SG
