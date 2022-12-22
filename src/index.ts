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
import { SGSchema } from './definition/SGSchema'
import { DataType } from 'sequelize/types/lib/data-types'

import resolveRelayConnection from './build/modelStaticsMethod/resolveRelayConnection'
import resolveQueryOption from './build/modelStaticsMethod/resolveQueryOption'
import parseSelections from './build/modelStaticsMethod/parseSelections'
import parseAttributes from './build/modelStaticsMethod/parseAttributes'
import hasSelection from './build/modelStaticsMethod/hasSelection'
import findOneForGraphQL from './build/modelStaticsMethod/findOneForGraphQL'
import findByPkForGraphQL from './build/modelStaticsMethod/findByPkForGraphQL'
import DataLoader from 'dataloader'
import { BaseSGSchema } from './definition/BaseSGSchema'

export abstract class SGModel<
  TModelAttributes extends {} = any
> extends Model<TModelAttributes> {
  id: number
}

export interface SGModelStatic {
  resolveRelayConnection: typeof resolveRelayConnection
  resolveQueryOption: typeof resolveQueryOption
  parseSelections: typeof parseSelections
  parseAttributes: typeof parseAttributes
  hasSelection: typeof hasSelection
  findOneForGraphQL: typeof findOneForGraphQL
  findByPkForGraphQL: typeof findByPkForGraphQL

  withCache: <T extends {}, M extends SGModel<T>>(
    this: { new (): M } & typeof Model
  ) => {
    findAll: (options?: FindOptions) => Promise<M[]>
    findOne: (options?: FindOptions) => Promise<M | null>
    count: (options?: CountOptions) => Promise<number>
  }

  clearCache: () => Promise<void>
  sgSchema: SGSchema

  getSGContext: () => SGContext
}

export type SGModelCtrl<T extends SGModel = SGModel> = typeof SGModel & {
  new (): T
} & SGModelStatic

export class SGService {
  getSGContext: () => SGContext
}

export interface SGServiceMap {
  [key: string]: SGService
}

export interface SGModelCtrlMap {
  [key: string]: SGModelCtrl
}

export type SGContext = {
  sequelize: Sequelize
  schemas: {
    [key: string]: BaseSGSchema
  }
  models: SGModelCtrlMap
  services: SGServiceMap
} & SGTypeContext
export type SGResolverContext = {
  hookFieldResolve: (
    path: string,
    config: SGLinkedFieldConfig
  ) => GraphQLFieldResolver<any, any>
  hookQueryResolve: (
    path: string,
    config: SGQueryConfig
  ) => GraphQLFieldResolver<any, any>
  hookSubscriptionResolve: (
    path: string,
    config: SGSubscriptionConfig
  ) => GraphQLFieldResolver<any, any>
  hookMutationResolve: (
    path: string,
    config: SGMutationConfig
  ) => GraphQLFieldResolver<any, any>
}
export type SGInterfaceContext = {
  interface: (name: string) => GraphQLInterfaceType
  registerInterface: (name: string, interfaceType: GraphQLInterfaceType) => void
}
export type SGTypeContext = {
  typeConfig: (name: string) => SGTypeConfig | null
}

export interface SGResolveContext {
  dataloaderMap?: { [key: string]: DataLoader<any, any> }
}

export type SGFieldResolve<S = any, R = any> = (
  source: S,
  args: {
    [key: string]: any
  },
  context: SGResolveContext,
  info: GraphQLResolveInfo,
  sgContext: SGContext
) => Promise<R>
export type SGRootResolve<T = any> = (
  args: {
    [key: string]: any
  },
  context: SGResolveContext,
  info: GraphQLResolveInfo,
  sgContext: SGContext
) => Promise<T>
export type SGTypeConfig = {
  name: string
  description?: string
  inputType?: GraphQLInputType | null
  additionalInput?: SGInputFieldConfigMap
  outputType?: GraphQLOutputType | null
  outputResolve?: SGFieldResolve
  columnOptions?:
    | ModelAttributeColumnOptions
    | ((
        schema: SGSchema,
        fieldName: string,
        options: SGColumnFieldConfig
      ) => ModelAttributeColumnOptions | null)
}
export type SGFieldTypeMetadata = {
  description?: string
}
export type SGOutputFieldTypeMetadata<
  S = any,
  T = any
> = SGFieldTypeMetadata & {
  hookOptions?: SGHookOptionsMap
  graphql?: {
    hidden?: boolean
    resolve?: SGFieldResolve<S, T>
    dependentFields?: Array<string>
    input?: SGInputFieldConfigMap
  }
}
export type SGConditionFieldMapper = (
  option: { where: any; attributes: Array<string> },
  argValue: any,
  context: SGContext
) => void
export type SGInputFieldTypeMetadata = SGFieldTypeMetadata & {
  graphql?: {
    hidden?: boolean
    defaultValue?: any
    mapper?: SGConditionFieldMapper
  }
}
// 基于 https://jsontypedef.com/ 扩展 sequelize / graphql 配置
export type SGFieldTypeDefinition<
  S1 extends SGFieldTypeMetadata = SGFieldTypeMetadata,
  S2 extends SGFieldTypeMetadata = S1
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
      elements: SGFieldTypeDefinition<S2>
      type?: undefined
      enum?: undefined
      properties?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      properties: { [key: string]: SGFieldTypeDefinition<S2> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      values: SGFieldTypeDefinition<S2>
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      discriminator: string
      mapping: { [key: string]: SGFieldTypeDefinition<S2> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      values?: undefined
    }
) & {
  definitions?: { [key: string]: SGFieldTypeDefinition<S2> }
  nullable?: boolean
  metadata?: S1
}
export type SGInputFieldConfig = SGFieldTypeDefinition<SGInputFieldTypeMetadata>
export type SGInputFieldConfigMap = { [key: string]: SGInputFieldConfig }
export type SGOutputFieldConfig<
  S1 = any,
  S2 = any,
  S3 = any,
  S4 = any
> = SGFieldTypeDefinition<
  SGOutputFieldTypeMetadata<S1, S2>,
  SGOutputFieldTypeMetadata<S3, S4>
>
export type SGOutputFieldConfigMap<T = any> = {
  [key: string]: SGOutputFieldConfig<T>
}
export type SGLinkedFieldConfig<S = any, T = any> = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input?: SGInputFieldConfigMap
  dependentFields?: Array<string>
  output: SGOutputFieldConfig<T>
  resolve: SGFieldResolve<S, T>
}
export type SGLinkedFieldConfigMap = { [key: string]: SGLinkedFieldConfig }
export type SGColumnFieldConfig<S = any, T = any> = SGFieldTypeDefinition<
  SGOutputFieldTypeMetadata<S, T> & SGInputFieldTypeMetadata
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
      targetKey?: string
    }
  }
}
export type SGColumnFieldConfigMap = { [key: string]: SGColumnFieldConfig }
export type SGDataTypeConfig = {
  name: string
  description?: string
  definition: SGFieldTypeDefinition<
    SGOutputFieldTypeMetadata & SGInputFieldTypeMetadata
  >
  columnOptions?: ModelAttributeColumnOptions
}
export type SGQueryConfig<T = any> = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input?: SGInputFieldConfigMap
  output: SGOutputFieldConfig<T>
  resolve: SGRootResolve<T>
}
export type SGQueryConfigMap = { [key: string]: SGQueryConfig }

export type SGSubscriptionConfig<T = any, S = any> = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input?: SGInputFieldConfigMap
  output: SGOutputFieldConfig<T>
  resolve?: SGFieldResolve<T>
  subscribe: (
    args: {
      [key: string]: any
    },
    context: SGResolveContext,
    info: GraphQLResolveInfo,
    sgContext: SGContext
  ) => AsyncIterator<S>
}
export type SGSubscriptionConfigMap = { [key: string]: SGSubscriptionConfig }

export type SGMutationConfig<T = any> = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input: SGInputFieldConfigMap
  output: SGOutputFieldConfigMap<T>
  mutateAndGetPayload: SGRootResolve<T>
}
export type SGMutationConfigMap = { [key: string]: SGMutationConfig }

export interface SGPluginOptions {
  enable: boolean
}

export interface SGPluginOptionsMap<E extends SGModel = SGModel> {}

export type BaseSGSchemaOptions = {
  description?: string
  plugin?: SGPluginOptionsMap
}

export type SGSchemaOptions = BaseSGSchemaOptions & {
  tableOptions?: ModelOptions<any> & {
    primaryKey?: {
      field: string
      type: DataType
      autoIncrement?: boolean
    }
  }
}

export interface SGHookOptionsMap {}

export type SGHookTarget<T = any> = {
  name: string
  options?: T
} & (
  | {
      type: 'field'
      targetConfig: SGLinkedFieldConfig
    }
  | {
      type: 'query'
      targetConfig: SGQueryConfig
    }
  | {
      type: 'subscription'
      targetConfig: SGSubscriptionConfig
    }
  | {
      type: 'mutation'
      targetConfig: SGMutationConfig
    }
)
export type SGHookFunc<T = any> = (
  target: SGHookTarget<T>,
  invokeInfo: {
    source?: any
    args: {
      [key: string]: any
    }
    context: SGResolveContext
    info: GraphQLResolveInfo
    sgContext: SGContext
  },
  next: () => Promise<any>
) => Promise<any>
export type SGHookConfig<T = any> = {
  name: string
  description?: string
  priority?: number
  filter?: (target: SGHookTarget<T>) => boolean
  hook: SGHookFunc<T>
}
export type SGPluginConfig<T = SGPluginOptions> = {
  name: string
  description?: string
  priority?: number
  defaultOptions?: T | ((schema: BaseSGSchema) => T)
  applyToSchema?: (
    schema: BaseSGSchema,
    options: T,
    schemas: { [name: string]: BaseSGSchema },
    config: SGBuildConfig
  ) => void
  applyToModel?: (
    model: SGModelCtrl,
    options: T,
    models: Array<SGModelCtrl>
  ) => void
}
export type SGBuildOptions = {
  defaultPlugin?: SGPluginOptionsMap
  nodeQueryConfig?: { hookOptions?: SGHookOptionsMap }
}

export type SGBuildConfig = {
  dataTypes?: Array<SGDataTypeConfig>
  types?: Array<SGTypeConfig>
  schemas?: Array<BaseSGSchema>
  services?: Array<typeof SGService & { new (): SGService }>
  hooks?: Array<SGHookConfig>
  plugins?: Array<SGPluginConfig>
  queries?: SGQueryConfigMap
  mutations?: SGMutationConfigMap
  subscriptions?: SGSubscriptionConfigMap
}

export interface SGCacheManager {
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

export * from './definition'

export * from './build'

export * from './plugin'
