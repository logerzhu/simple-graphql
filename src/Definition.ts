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
  argFieldMap?: {
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

export type InputFieldOptionsType = {
  $type: InputFieldOptions
  description?: string
  required: boolean
  default?: any
  mapper?: (
    option: { where: { [key: string]: any }; attributes: Array<string> },
    arg1: any
  ) => void
}

export type InputFieldOptions =
  | string
  | Set<string>
  | Array<InputFieldOptions>
  | InputFieldOptionsType
  | {
      [key: string]: InputFieldOptions
    }

export type FieldOptionsType = {
  config?: { [key: string]: any }
  $type: FieldOptions
  description?: string
  required: boolean
  default?: any
  args?: {
    [key: string]: InputFieldOptions
  }
  dependentFields?: Array<string>
  resolve?: FieldResolve
}

export type FieldOptions =
  | string
  | Set<string>
  | Array<FieldOptions>
  | FieldOptionsType
  | {
      [key: string]: FieldOptions
    }

export type LinkedFieldOptions = {
  config?: { [key: string]: any }
  $type: FieldOptions
  description?: string
  required?: boolean
  dependentFields?: Array<string>
  args?: {
    [key: string]: InputFieldOptions
  }
  resolve: FieldResolve
}

export type ColumnFieldOptionsType = {
  config?: any
  $type: FieldOptions
  description?: string
  required: boolean
  default?: any
  hidden?: boolean
  columnOptions?: ModelAttributeColumnOptions & { constraints?: boolean }
  resolve?: FieldResolve
}

export type ColumnFieldOptions =
  | string
  | Set<string>
  | Array<FieldOptions>
  | ColumnFieldOptionsType
  | {
      [key: string]: FieldOptions
    }

export type BaseDataTypeOptions = {
  name: string
  $type: FieldOptions
  description?: string
  columnOptions?: ModelAttributeColumnOptions
}

export type UnionDataTypeOptions = {
  name: string
  $unionTypes: {
    [key: string]: string
  }
  description?: string
  columnOptions?: ModelAttributeColumnOptions
}

export type DataTypeOptions = BaseDataTypeOptions | UnionDataTypeOptions

export type QueryOptions = {
  $type: FieldOptions
  description?: string
  config?: { [key: string]: any }
  args?: {
    [key: string]: InputFieldOptions
  }
  resolve: RootResolve
}

export type MutationOptions = {
  description?: string
  config?: { [key: string]: any }
  inputFields: {
    [key: string]: InputFieldOptions
  }
  outputFields: {
    [key: string]: FieldOptions
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
