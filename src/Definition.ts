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

export abstract class SGModel extends Model {
  static resolveRelayConnection: typeof resolveRelayConnection
  static resolveQueryOption: typeof resolveQueryOption
  static parseSelections: typeof parseSelections
  static parseAttributes: typeof parseAttributes
  static hasSelection: typeof hasSelection
  static findOneForGraphQL: typeof findOneForGraphQL
  static findByPkForGraphQL: typeof findByPkForGraphQL

  static withCache: <M extends SGModel>(
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

export type SGModelCtrl = typeof SGModel & { new (): SGModel }

export type SGContext<
  T = {
    [key: string]: SGModelCtrl
  },
  S = {
    [key: string]: any
  }
> = {
  sequelize: Sequelize
  schemas: {
    [key: string]: Schema
  }
  models: T
  services: S
  fieldType: (arg0: string) => FieldTypeConfig | null | undefined
}

export type ResolverContext = {
  hookFieldResolve: (
    arg0: string,
    arg1: LinkedFieldConfig
  ) => GraphQLFieldResolver<any, any>
  hookQueryResolve: (
    arg0: string,
    arg1: QueryConfig
  ) => GraphQLFieldResolver<any, any>
  hookMutationResolve: (
    arg0: string,
    arg1: MutationConfig
  ) => GraphQLFieldResolver<any, any>
}

export type InterfaceContext = {
  interface: (arg0: string) => GraphQLInterfaceType
  registerInterface: (arg0: string, arg1: GraphQLInterfaceType) => void
}

export type FieldTypeContext = {
  fieldType: (arg0: string) => FieldTypeConfig | null | undefined
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

export type FieldTypeConfig = {
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
        options: ColumnFieldConfig
      ) => ModelAttributeColumnOptions | null)
}

export type TypeMetadata = {
  description?: string
}

export type OutputTypeMetadata = TypeMetadata & {
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

export type InputTypeMetadata = TypeMetadata & {
  graphql?: {
    hidden?: boolean
    defaultValue?: any
    mapper?: ConditionFieldMapper
  }
}

// 基于 https://jsontypedef.com/ 扩展 sequelize / graphql 配置
export type TypeDefinition<T extends TypeMetadata = TypeMetadata> = (
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
      elements: TypeDefinition<T>
      type?: undefined
      enum?: undefined
      properties?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      properties: { [key: string]: TypeDefinition<T> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      values: TypeDefinition<T>
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      discriminator: string
      mapping: { [key: string]: TypeDefinition<T> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      values?: undefined
    }
) & {
  definitions?: { [key: string]: TypeDefinition<T> }
  nullable?: boolean
  metadata?: T
}

export type InputFieldConfig = TypeDefinition<InputTypeMetadata>
export type InputFieldConfigMap = { [key: string]: InputFieldConfig }

export type OutputFieldConfig = TypeDefinition<OutputTypeMetadata>
export type OutputFieldConfigMap = { [key: string]: OutputFieldConfig }

export type LinkedFieldConfig = {
  description?: string
  config?: { [key: string]: any }
  input?: InputFieldConfigMap
  dependentFields?: Array<string>
  output: OutputFieldConfig
  resolve: FieldResolve
}

export type ColumnFieldConfig = TypeDefinition<
  OutputTypeMetadata & InputTypeMetadata
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

export type DataTypeConfig = {
  name: string
  description?: string
  definition: TypeDefinition<OutputTypeMetadata & InputTypeMetadata>
  columnOptions?: ModelAttributeColumnOptions
}

export type QueryConfig = {
  description?: string
  config?: { [key: string]: any }
  input?: InputFieldConfigMap
  output: OutputFieldConfig
  resolve: RootResolve
}

export type MutationConfig = {
  description?: string
  config?: { [key: string]: any }
  input: InputFieldConfigMap
  output: OutputFieldConfigMap
  mutateAndGetPayload: RootResolve
}

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
