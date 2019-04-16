// @flow
import type { GraphQLInputType, GraphQLOutputType, GraphQLResolveInfo } from 'graphql'
import type { ColumnOptions } from 'sequelize'
import Sequelize from 'sequelize'

export type ModelDefine = any// Class<SGModel>

export type SGContext = {
  sequelize: Sequelize,
  models: { [string]: ModelDefine },
  services: { [string]: Object }
}

export type FieldType = {
  name: string,
  desc?: string,
  inputType?: GraphQLInputType,
  outputType?: GraphQLOutputType,
  columnOptions?: ColumnOptions
}

export type FieldResolve = (source: any, args: { [string]: any },
                            context: any,
                            info: GraphQLResolveInfo,
                            sgContext: SGContext) => any

export type RootResolve = (args: { [string]: any },
                           context: any,
                           info: GraphQLResolveInfo,
                           sgContext: SGContext) => any

export type InputFieldOptions = string | Array<InputFieldOptions> | {
  $type: InputFieldOptions,
  desc?: string,
  required?: boolean,
  default?: any
}

export type FieldOptions = string | Array<FieldOptions> | {
  config?: Object,
  $type: FieldOptions,
  desc?: string,
  required?: boolean,
  default?: any,
  args?: { [string]: InputFieldOptions },
  resolve?: FieldResolve
}

export type LinkedFieldOptions = string | Array<FieldOptions> | {
  config?: Object,
  $type: FieldOptions,
  desc?: string,
  required?: boolean,
  default?: any,
  args?: { [string]: InputFieldOptions },
  resolve: FieldResolve
}

export type ColumnFieldOptions = string | Array<FieldOptions> | {
  config?: Object,
  $type: FieldOptions,
  desc?: string,
  required?: boolean,
  default?: any,
  hidden?: boolean
}

export type QueryOptions = {
  $type: LinkedFieldOptions,
  description?: string,
  config?: Object,
  args?: { [string]: InputFieldOptions },
  resolve: RootResolve
}

export type MutationOptions = {
  description?: string,
  config?: Object,
  inputFields: { [string]: InputFieldOptions },
  outputFields: { [string]: LinkedFieldOptions },
  mutateAndGetPayload: RootResolve
}
