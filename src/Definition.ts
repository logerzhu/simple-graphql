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

export type ModelDefine = { new (): SGModel } & typeof SGModel

export type SGContext<
  T = {
    [key: string]: ModelDefine
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
  fieldType: (arg0: string) => FieldType | null | undefined
}

export type ResolverContext = {
  hookFieldResolve: (
    arg0: string,
    arg1: LinkedFieldOptions
  ) => GraphQLFieldResolver<any, any>
  hookQueryResolve: (
    arg0: string,
    arg1: QueryOptions
  ) => GraphQLFieldResolver<any, any>
  hookMutationResolve: (
    arg0: string,
    arg1: MutationOptions
  ) => GraphQLFieldResolver<any, any>
}

export type InterfaceContext = {
  interface: (arg0: string) => GraphQLInterfaceType
  registerInterface: (arg0: string, arg1: GraphQLInterfaceType) => void
}

export type FieldTypeContext = {
  fieldType: (arg0: string) => FieldType | null | undefined
}

export type FieldResolve = (
  source: any,
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

export type FieldType = {
  name: string
  description?: string
  inputType?: GraphQLInputType | null | undefined
  additionalInput?: {
    [key: string]: InputFieldOptions
  }
  outputType?: GraphQLOutputType | null | undefined
  outputResolve?: FieldResolve
  columnOptions?:
    | ModelAttributeColumnOptions
    | ((
        schema: Schema,
        fieldName: string,
        options: ColumnFieldOptions
      ) => ModelAttributeColumnOptions | null | undefined)
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
    input?: {
      [key: string]: InputFieldOptions
    }
  }
}

export type InputTypeMetadata = TypeMetadata & {
  graphql?: {
    hidden?: boolean
    defaultValue?: any
    mapper?: (
      option: { where: any; attributes: Array<string> },
      argValue: any,
      context: SGContext
    ) => void
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

export type InputFieldOptions = TypeDefinition<InputTypeMetadata>

export type OutputFieldOptions = TypeDefinition<OutputTypeMetadata>

export type LinkedFieldOptions = {
  description?: string
  config?: { [key: string]: any }
  input?: {
    [key: string]: InputFieldOptions
  }
  dependentFields?: Array<string>
  output: OutputFieldOptions
  resolve: FieldResolve
}

export type ColumnFieldOptions = TypeDefinition<
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

export type DataTypeOptions = {
  name: string
  description?: string
  definition: TypeDefinition<OutputTypeMetadata & InputTypeMetadata>
  columnOptions?: ModelAttributeColumnOptions
}

export type QueryOptions = {
  description?: string
  config?: { [key: string]: any }
  input?: {
    [key: string]: InputFieldOptions
  }
  output: OutputFieldOptions
  resolve: RootResolve
}

export type MutationOptions = {
  description?: string
  config?: { [key: string]: any }
  input: {
    [key: string]: InputFieldOptions
  }
  output: {
    [key: string]: OutputFieldOptions
  }
  mutateAndGetPayload: RootResolve
}

export type SchemaOptionConfig = {
  description?: string
  plugin?: { [key: string]: any }
  tableOptions?: ModelOptions<any>
}

export type HookAction = {
  type: 'field' | 'query' | 'mutation'
  name: string
  options: LinkedFieldOptions | QueryOptions | MutationOptions
}

export type HookOptions = {
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

export type PluginOptions = {
  name: string
  description?: string
  priority?: number
  defaultOptions: (boolean | { [key: string]: any }) | null | undefined
  applyToSchema?: (
    schema: Schema,
    options: boolean | { [key: string]: any },
    schemas: Array<Schema>
  ) => void
  applyToModel?: (
    model: ModelDefine,
    options: boolean | { [key: string]: any },
    models: Array<ModelDefine>
  ) => void
}

export type BuildOptions = {
  plugin?: {
    [id: string]: boolean | { [key: string]: any }
  }
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
