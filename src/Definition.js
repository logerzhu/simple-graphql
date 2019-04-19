// @flow
import type {
  GraphQLFieldResolver,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLOutputType,
  GraphQLResolveInfo
} from 'graphql'
import type { DefineAttributeColumnOptions, DefineOptions } from 'sequelize'
import Sequelize from 'sequelize'
import Schema from './definition/Schema'

export type ModelDefine = any// Class<SGModel>

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
  inputType?: GraphQLInputType,
  argFieldMap?: { [string]: InputFieldOptions },
  outputType?: GraphQLOutputType,
  outputResolve?: FieldResolve,
  columnOptions?: DefineAttributeColumnOptions | (schema: any, fieldName: string, options: ColumnFieldOptions) => ?DefineAttributeColumnOptions
|} | (typeContext: FieldTypeContext) => {|
  name: string,
  description?: string,
  inputType?: GraphQLInputType,
  argFieldMap?: { [string]: InputFieldOptions },
  outputType?: GraphQLOutputType,
  outputResolve?: FieldResolve,
  columnOptions?: DefineAttributeColumnOptions | (schema: any, fieldName: string, options: ColumnFieldOptions) => ?DefineAttributeColumnOptions
|}

export type InputFieldOptions = string | Array<InputFieldOptions> | {
  $type: InputFieldOptions,
  description?: string,
  required?: boolean,
  default?: any
} | { [string]: InputFieldOptions }

export type FieldOptions = string | Array<FieldOptions> | {
  config?: Object,
  $type: FieldOptions,
  description?: string,
  required?: boolean,
  default?: any,
  args?: { [string]: InputFieldOptions },
  resolve?: FieldResolve
} | { [string]: FieldOptions }

export type LinkedFieldOptions = {
  config?: Object,
  $type: FieldOptions,
  description?: string,
  required?: boolean,
  default?: any,
  args?: { [string]: InputFieldOptions },
  resolve: FieldResolve
}

export type ColumnFieldOptions = string | Array<FieldOptions> | {
  config?: Object,
  $type: FieldOptions,
  description?: string,
  required?: boolean,
  default?: any,
  hidden?: boolean,
  column?: DefineAttributeColumnOptions
}

export type QueryOptions = {
  $type: FieldOptions,
  description?: string,
  config?: Object,
  args?: { [string]: InputFieldOptions },
  resolve: RootResolve
}

export type MutationOptions = {
  description?: string,
  config?: Object,
  inputFields: { [string]: InputFieldOptions },
  outputFields: { [string]: FieldOptions },
  mutateAndGetPayload: RootResolve
}

export type SchemaOptionConfig = {
  description?: string,
  plugin?: Object,
  table?: DefineOptions<any>
}

export type HookAction = { type: 'field' | 'query' | 'mutation', name: string, options: LinkedFieldOptions | QueryOptions | MutationOptions }

export type Hook = {
  description?: string,
  priority?: number,
  filter: (action: HookAction)=>boolean,
  hook: (action: HookAction,
         invokeInfo: { source?: any, args?: ?{ [string]: any }, context?: any, info?: GraphQLResolveInfo, sgContext?: SGContext },
         next: ()=>any)=>any
}

export type Plugin = {
  key: string,
  description?: string,
  priority?: number,
  defaultOptions: ?(boolean | Object),
  apply: (schema: Schema, options: ?(boolean | Object)) => void
}

export type BuildOptionConfig = {
  plugin?: { [id: string]: boolean | Object },
  query?: {
    viewer?: 'AllQuery' | 'FromModelQuery' | QueryOptions,
  },
  mutation?: {
    payloadFields?: Array<string | {
      name: string,
      $type: LinkedFieldOptions,
      description?: string,
      args?: { [string]: InputFieldOptions },
      resolve: (args: { [argName: string]: any },
                context: any,
                info: GraphQLResolveInfo,
                sgContext: SGContext) => any
    }>
  }
}
