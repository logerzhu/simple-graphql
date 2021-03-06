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

  withCache: <T, M extends SGModel<T>>(
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

export abstract class SGService {
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
    [key: string]: SGSchema
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

export type SGFieldResolve<T = any> = (
  source: T,
  args: {
    [key: string]: any
  },
  context: SGResolveContext,
  info: GraphQLResolveInfo,
  sgContext: SGContext
) => any
export type SGRootResolve = (
  args: {
    [key: string]: any
  },
  context: SGResolveContext,
  info: GraphQLResolveInfo,
  sgContext: SGContext
) => any
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
export type SGOutputFieldTypeMetadata = SGFieldTypeMetadata & {
  hookOptions?: SGHookOptionsMap
  graphql?: {
    hidden?: boolean
    resolve?: SGFieldResolve
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
  T extends SGFieldTypeMetadata = SGFieldTypeMetadata
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
      elements: SGFieldTypeDefinition<T>
      type?: undefined
      enum?: undefined
      properties?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      properties: { [key: string]: SGFieldTypeDefinition<T> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      values?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      values: SGFieldTypeDefinition<T>
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      discriminator?: undefined
      mapping?: undefined
    }
  | {
      discriminator: string
      mapping: { [key: string]: SGFieldTypeDefinition<T> }
      type?: undefined
      enum?: undefined
      elements?: undefined
      properties?: undefined
      values?: undefined
    }
) & {
  definitions?: { [key: string]: SGFieldTypeDefinition<T> }
  nullable?: boolean
  metadata?: T
}
export type SGInputFieldConfig = SGFieldTypeDefinition<SGInputFieldTypeMetadata>
export type SGInputFieldConfigMap = { [key: string]: SGInputFieldConfig }
export type SGOutputFieldConfig = SGFieldTypeDefinition<SGOutputFieldTypeMetadata>
export type SGOutputFieldConfigMap = { [key: string]: SGOutputFieldConfig }
export type SGLinkedFieldConfig = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input?: SGInputFieldConfigMap
  dependentFields?: Array<string>
  output: SGOutputFieldConfig
  resolve: SGFieldResolve
}
export type SGLinkedFieldConfigMap = { [key: string]: SGLinkedFieldConfig }
export type SGColumnFieldConfig = SGFieldTypeDefinition<
  SGOutputFieldTypeMetadata & SGInputFieldTypeMetadata
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
export type SGColumnFieldConfigMap = { [key: string]: SGColumnFieldConfig }
export type SGDataTypeConfig = {
  name: string
  description?: string
  definition: SGFieldTypeDefinition<
    SGOutputFieldTypeMetadata & SGInputFieldTypeMetadata
  >
  columnOptions?: ModelAttributeColumnOptions
}
export type SGQueryConfig = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input?: SGInputFieldConfigMap
  output: SGOutputFieldConfig
  resolve: SGRootResolve
}
export type SGQueryConfigMap = { [key: string]: SGQueryConfig }
export type SGMutationConfig = {
  description?: string
  hookOptions?: SGHookOptionsMap
  input: SGInputFieldConfigMap
  output: SGOutputFieldConfigMap
  mutateAndGetPayload: SGRootResolve
}
export type SGMutationConfigMap = { [key: string]: SGMutationConfig }

export interface SGPluginOptions {
  enable: boolean
}

export interface SGPluginOptionsMap<E extends SGModel = SGModel> {}

export type SGSchemaOptions = {
  description?: string
  plugin?: SGPluginOptionsMap
  tableOptions?: ModelOptions<any>
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
  defaultOptions?: T
  applyToSchema?: (
    schema: SGSchema,
    options: T,
    schemas: Array<SGSchema>
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
  schemas?: Array<SGSchema>
  services?: Array<typeof SGService & { new (): SGService }>
  hooks?: Array<SGHookConfig>
  plugins?: Array<SGPluginConfig>
  queries?: SGQueryConfigMap
  mutations?: SGMutationConfigMap
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

export * from './definition/SGSchema'

export * from './build'

export * from './plugin'
