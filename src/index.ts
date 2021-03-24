import _Schema from './definition/Schema'
import _Service from './definition/Service'

import { SchemaOptions } from './Definition'
import _build from './build'

export * from './Definition'

export type Schema = _Schema

namespace SG {
  export const Schema = _Schema
  export const Service = _Service
  export const schema = (name: string, options: SchemaOptions = {}): _Schema =>
    new _Schema(name, options)
  export const build = _build
}

export default SG
