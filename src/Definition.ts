import {
  GraphQLFieldResolver,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLOutputType,
  GraphQLResolveInfo
} from 'graphql'
import {
  CountOptions,
  FindOptions,
  Model,
  ModelAttributeColumnOptions,
  ModelOptions,
  Sequelize
} from 'sequelize'
import Schema from './definition/Schema'
import resolveRelayConnection from './build/modelStaticsMethod/resolveRelayConnection'
import resolveQueryOption from './build/modelStaticsMethod/resolveQueryOption'
import parseSelections from './build/modelStaticsMethod/parseSelections'
import parseAttributes from './build/modelStaticsMethod/parseAttributes'
import hasSelection from './build/modelStaticsMethod/hasSelection'
import findOneForGraphQL from './build/modelStaticsMethod/findOneForGraphQL'
import findByPkForGraphQL from './build/modelStaticsMethod/findByPkForGraphQL'
import { DataType } from 'sequelize/types/lib/data-types'
import Service from './definition/Service'

export abstract class SGModel<
  TModelAttributes extends {} = any
> extends Model<TModelAttributes> {
  static resolveRelayConnection: typeof resolveRelayConnection
  static resolveQueryOption: typeof resolveQueryOption
  static parseSelections: typeof parseSelections
  static parseAttributes: typeof parseAttributes
  static hasSelection: typeof hasSelection
  static findOneForGraphQL: typeof findOneForGraphQL
  static findByPkForGraphQL: typeof findByPkForGraphQL

  static withCache: <T, M extends SGModel<T>>(
    this: { new (): M } & typeof Model
  ) => {
    findAll: (options?: FindOptions) => Promise<M[]>
    findOne: (options?: FindOptions) => Promise<M | null>
    count: (options?: CountOptions) => Promise<number>
  }

  static clearCache: () => Promise<void>
  static sgSchema: Schema

  static getSGContext: () => SGContext
}

export type SGModelCtrl<TModelAttributes extends {} = any> = typeof SGModel & {
  new (): SGModel<TModelAttributes>
}

export interface SGServiceMap {
  [key: string]: Service
}

export interface SGModelCtrlMap {
  [key: string]: SGModelCtrl
}

export type SGContext = {
  sequelize: Sequelize
  schemas: {
    [key: string]: Schema
  }
  models: SGModelCtrlMap
  services: SGServiceMap
} & TypeContext

export type ResolverContext = {
  hookFieldResolve: (
    path: string,
    config: LinkedFieldConfig
  ) => GraphQLFieldResolver<any, any>
  hookQueryResolve: (
    path: string,
    config: QueryConfig
  ) => GraphQLFieldResolver<any, any>
  hookMutationResolve: (
    path: string,
    config: MutationConfig
  ) => GraphQLFieldResolver<any, any>
}

export type InterfaceContext = {
  interface: (name: string) => GraphQLInterfaceType
  registerInterface: (name: string, interfaceType: GraphQLInterfaceType) => void
}

export type TypeContext = {
  typeConfig: (name: string) => TypeConfig | null | undefined
}

export type FieldResolve<T = any> = (
  source: T,
  args: {
    [key: string]: any
  },
  context: any,
  info: GraphQLResolveInfo,
  sgContext: SGContext
) => any

export type RootResolve = (
  args: {
    [key: string]: any
  },
  context: any,
  info: GraphQLResolveInfo,
  sgContext: SGContext
) => any

export type TypeConfig = {
  name: string
  description?: string
  inputType?: GraphQLInputType | null
  additionalInput?: InputFieldConfigMap
  outputType?: GraphQLOutputType | null
  outputResolve?: FieldResolve
  columnOptions?:
    | ModelAttributeColumnOptions
    | ((
        schema: Schema,
        fieldName: string,
        options: ColumnFieldTypeConfig
      ) => ModelAttributeColumnOptions | null)
}

export type FieldTypeMetadata = {
  description?: string
}

export type OutputFieldTypeMetadata = FieldTypeMetadata & {
  config?: { [key: string]: any }
  graphql?: {
    hidden?: boolean
    resolve?: FieldResolve
    dependentFields?: Array<string>
    input?: InputFieldConfigMap
  }
}

export type ConditionFieldMapper = (
  option: { where: any; attributes: Array<string> },
  argValue: any,
  context: SGContext
) => void

export type InputFieldTypeMetadata = FieldTypeMetadata & {
  graphql?: {
    hidden?: boolean
    defaultValue?: any
    mapper?: ConditionFieldMapper
  }
}

// 基于 https://jsontypedef.com/ 扩展 sequelize / graphql 配置
export type FieldTypeDefinition<
  T extends FieldTypeMetadata = FieldTypeMetadata
> = (
  | {
      type:
        | 'String'
        | 'Number'
        | 'Integer'
        | 'Date'
        | 'JSON'
        | 'Boolean'
        | string
      enum?: undefined
      elements?: undefined
      properties?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      enum: string[]
      type?: undefined
      elements?: undefined
      properties?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      elements: FieldTypeDefinition<T>
      type?: undefined
      enum?: undefined
      properties?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      properties: { [key: string]: FieldTypeDefinition<T> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      values: FieldTypeDefinition<T>
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      discriminator: string
      mapping: { [key: string]: FieldTypeDefinition<T> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      values?: undefined
    }
) & {
  definitions?: { [key: string]: FieldTypeDefinition<T> }
  nullable?: boolean
  metadata?: T
}

export type InputFieldConfig = FieldTypeDefinition<InputFieldTypeMetadata>
export type InputFieldConfigMap = { [key: string]: InputFieldConfig }

export type OutputFieldConfig = FieldTypeDefinition<OutputFieldTypeMetadata>
export type OutputFieldConfigMap = { [key: string]: OutputFieldConfig }

export type LinkedFieldConfig = {
  description?: string
  config?: { [key: string]: any }
  input?: InputFieldConfigMap
  dependentFields?: Array<string>
  output: OutputFieldConfig
  resolve: FieldResolve
}
export type LinkedFieldConfigMap = { [key: string]: LinkedFieldConfig }

export type ColumnFieldTypeConfig = FieldTypeDefinition<
  OutputFieldTypeMetadata & InputFieldTypeMetadata
> & {
  metadata?: {
    graphql?: {
      initializable?: boolean
      updatable?: boolean
      searchable?: boolean
    }
    column?: Omit<ModelAttributeColumnOptions, 'type'> & {
      type?: DataType
      constraints?: boolean
    }
  }
}

export type ColumnFieldConfigMap = { [key: string]: ColumnFieldTypeConfig }

export type DataTypeConfig = {
  name: string
  description?: string
  definition: FieldTypeDefinition<
    OutputFieldTypeMetadata & InputFieldTypeMetadata
  >
  columnOptions?: ModelAttributeColumnOptions
}

export type QueryConfig = {
  description?: string
  config?: { [key: string]: any }
  input?: InputFieldConfigMap
  output: OutputFieldConfig
  resolve: RootResolve
}
export type QueryConfigMap = { [key: string]: QueryConfig }

export type MutationConfig = {
  description?: string
  config?: { [key: string]: any }
  input: InputFieldConfigMap
  output: OutputFieldConfigMap
  mutateAndGetPayload: RootResolve
}
export type MutationConfigMap = { [key: string]: MutationConfig }

export interface PluginOptions {
  enable: boolean
}

export interface PluginOptionsMap {}

export type SchemaOptions = {
  description?: string
  plugin?: PluginOptionsMap
  tableOptions?: ModelOptions<any>
}

export type HookAction = {
  type: 'field' | 'query' | 'mutation'
  name: string
  options: LinkedFieldConfig | QueryConfig | MutationConfig
}

export type HookConfig = {
  description?: string
  priority?: number
  filter: (action: HookAction) => boolean
  hook: (
    action: HookAction,
    invokeInfo: {
      source: any
      args:
        | {
            [key: string]: any
          }
        | null
        | undefined
      context: any
      info: GraphQLResolveInfo
      sgContext: SGContext
    },
    next: () => any
  ) => any
}

export type PluginConfig<T = PluginOptions> = {
  name: string
  description?: string
  priority?: number
  defaultOptions?: T
  applyToSchema?: (schema: Schema, options: T, schemas: Array<Schema>) => void
  applyToModel?: (
    model: SGModelCtrl,
    options: T,
    models: Array<SGModelCtrl>
  ) => void
}

export type BuildOptions = {
  plugin?: PluginOptionsMap
}

export interface CacheManager {
  get: (key: string) => Promise<any>

  set: (key: string, value: any, expire?: number) => Promise<void>

  /*
  Supported glob-style patterns

  h?llo matches hello, hallo and hxllo
  h*llo matches hllo and heeeello
  h[ae]llo matches hello and hallo, but not hillo
  h[^e]llo matches hallo, hbllo, ... but not hello
  h[a-b]llo matches hallo and hbllo
 */
  del: (pattern: string) => Promise<number>
}
