import _Schema from './definition/Schema'
import _Service from './definition/Service'

import { SchemaOptions } from './Definition'
import _build from './build'

export {
  HookAction,
  HookConfig,
  PluginConfig,
  SGContext,
  ResolverContext,
  InterfaceContext,
  FieldTypeContext,
  FieldResolve,
  RootResolve,
  FieldTypeConfig,
  InputFieldConfig,
  OutputFieldConfig,
  LinkedFieldConfig,
  ColumnFieldConfig,
  QueryConfig,
  MutationConfig,
  SchemaOptions,
  BuildOptions
} from './Definition'

export type Schema = _Schema
export type Service = _Service

namespace SG {
  export const Schema = _Schema
  export const Service = _Service
  export const schema = (name: string, options: SchemaOptions = {}): _Schema =>
    new _Schema(name, options)
  export const service = (name: string): _Service => new _Service(name)
  export const build = _build
}

export default SG
