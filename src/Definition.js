// @flow
import type {
  GraphQLFieldResolver,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLOutputType,
  GraphQLResolveInfo
} from 'graphql'
import type { ModelAttributeColumnOptions, ModelOptions } from 'sequelize'
import type {Sequelize, Model} from 'sequelize'
import Schema from './definition/Schema'

export type ModelDefine = Model

export type SGContext = {
  sequelize: Sequelize,
  schemas: { [string]: Schema },
  models: { [string]: ModelDefine },
  services: { [string]: Object },
  fieldType: (string) => ?FieldType
}

export type ResolverContext = {
  hookFieldResolve: (string, LinkedFieldOptions) => GraphQLFieldResolver<any, any>,
  hookQueryResolve: (string, QueryOptions) => GraphQLFieldResolver<any, any>,
  hookMutationResolve: (string, MutationOptions) => GraphQLFieldResolver<any, any>
}

export type InterfaceContext = {
  interface: (string) => GraphQLInterfaceType,
  registerInterface: (string, GraphQLInterfaceType) => void
}

export type FieldTypeContext = { fieldType: (string) => ?FieldType }

export type FieldResolve = (source: any, args: { [string]: any },
                            context: any,
                            info: GraphQLResolveInfo,
                            sgContext: SGContext) => any

export type RootResolve = (args: { [string]: any },
                           context: any,
                           info: GraphQLResolveInfo,
                           sgContext: SGContext) => any

export type FieldType = {|
  name: string,
  description?: string,
  inputType?: ?GraphQLInputType,
  argFieldMap?: { [string]: InputFieldOptions },
  outputType?: ?GraphQLOutputType,
  outputResolve?: FieldResolve,
  columnOptions?: ModelAttributeColumnOptions | (schema: Schema, fieldName: string, options: ColumnFieldOptions) => ?ModelAttributeColumnOptions
|}

export type InputFieldOptions = string | Set<string> | Array<InputFieldOptions> | {
  $type: InputFieldOptions,
  description?: string,
  required: boolean,
  default?: any,
  mapper?: (option: { where: Object, attributes: Array<string> }, any)=> void
} | { [string]: InputFieldOptions }

export type FieldOptions = string | Set<string> | Array<FieldOptions> | {|
  config?: Object,
  $type: FieldOptions,
  description?: string,
  required: boolean,
  default?: any,
  args?: { [string]: InputFieldOptions },
  dependentFields?: Array<string>,
  resolve?: FieldResolve
|} | { [string]: FieldOptions }

export type LinkedFieldOptions = {|
  config?: Object,
  $type: FieldOptions,
  description?: string,
  required?: boolean,
  dependentFields?: Array<string>,
  args?: { [string]: InputFieldOptions },
  resolve: FieldResolve
|}

export type ColumnFieldOptions = string | Set<string> | Array<FieldOptions> | {|
  config?: Object,
  $type: FieldOptions,
  description?: string,
  required: boolean,
  default?: any,
  hidden?: boolean,
  columnOptions?: ModelAttributeColumnOptions,
  resolve?: FieldResolve
|} | { [string]: FieldOptions }

export type DataTypeOptions = {|
  name: string,
  $type: FieldOptions,
  description?: string,
  columnOptions?: ModelAttributeColumnOptions
|} | {|
  name: string,
  $unionTypes: { [string]: string },
  description?: string,
  columnOptions?: ModelAttributeColumnOptions
|}

export type QueryOptions = {|
  $type: FieldOptions,
  description?: string,
  config?: Object,
  args?: { [string]: InputFieldOptions },
  resolve: RootResolve
|}

export type MutationOptions = {|
  description?: string,
  config?: Object,
  inputFields: { [string]: InputFieldOptions },
  outputFields: { [string]: FieldOptions },
  mutateAndGetPayload: RootResolve
|}

export type SchemaOptionConfig = {
  description?: string,
  plugin?: Object,
  tableOptions?: ModelOptions<any>
}

export type HookAction = { type: 'field' | 'query' | 'mutation', name: string, options: LinkedFieldOptions | QueryOptions | MutationOptions }

export type HookOptions = {
  description?: string,
  priority?: number,
  filter: (action: HookAction)=>boolean,
  hook: (action: HookAction,
         invokeInfo: { source: any, args: ?{ [string]: any }, context: any, info: GraphQLResolveInfo, sgContext: SGContext },
         next: ()=>any)=>any
}

export type PluginOptions = {|
  name: string,
  description?: string,
  priority?: number,
  defaultOptions: ?(boolean | Object),
  applyToSchema?: (schema: Schema, options: (boolean | Object), schemas: Array<Schema>) => void,
  applyToModel?: (model: ModelDefine, options: (boolean | Object), models: Array<ModelDefine>) => void
|}

export type BuildOptions = {
  plugin?: { [id: string]: boolean | Object }
}
