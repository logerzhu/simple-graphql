// @flow
/* global Class */

import type { GraphQLInputType, GraphQLOutputType, GraphQLResolveInfo } from 'graphql'

import type { DefineAttributeColumnOptions, DefineOptions } from 'sequelize'
import Sequelize from 'sequelize'

import Type from './type'

// class SGModel extends Sequelize.Model<{ id: any }> {
//   static resolveQueryOption: any
// }

export type ModelDefine = any// Class<SGModel>

export type SGContext = {
  sequelize: Sequelize,
  models: { [string]: ModelDefine },
  services: { [string]: Object }
}

/**
 * @public
 */
export type LinkedFieldType =
  Class<String>
  | Class<Number>
  | Class<Boolean>
  | Class<Date>
  | Class<JSON>
  | GraphQLOutputType
  |
  Type.ScalarFieldType
  | string
  | Array<LinkedFieldType>
  | {
  [string]: LinkedFieldType,
  $type?: LinkedFieldType,
  required?: boolean,
  default?: any,
  enumValues?: Array<string>,
  // description?:string,
  args?: { [string]: LinkedFieldType },
  resolve?: (source: any, args: { [string]: any },
             context: any,
             info: GraphQLResolveInfo,
             sgContext: SGContext) => any
}

type InputFieldType = Class<String> | Class<Number> | Class<Boolean> | Class<Date> | Class<JSON> | GraphQLInputType |
  Type.ScalarFieldType | string | Array<InputFieldType> | {
  [string]: InputFieldType,
  $type?: InputFieldType,
  required?: boolean,
  default?: any,
  enumValues?: Array<string>,
  mapper?: (option: { where: Object, bind: Array<any>, attributes: Array<string> }, argValue: any, sgContext: SGContext) => void
  // description?:string
}

/**
 * @public
 */
export type ArgsType = { [string]: InputFieldType }

/**
 * @public
 */
export type LinkedFieldConfig = {
  $type: LinkedFieldType,
  description?: string,
  dependentFields?: Array<string>,
  args?: ArgsType,
  resolve: (source: any, args: { [string]: any },
            context: any,
            info: GraphQLResolveInfo,
            sgContext: SGContext) => any
}

/**
 * @public
 */
export type QueryConfig<T> = {
  $type: LinkedFieldType,
  description?: string,
  config?: T,
  args?: ArgsType,
  resolve: (args: { [string]: any },
            context: any,
            info: GraphQLResolveInfo,
            sgContext: SGContext) => any
}

/**
 * @public
 */
export type MutationConfig<T> = {
  description?: string,
  config?: T,
  inputFields: ArgsType,
  outputFields: { [string]: LinkedFieldType },
  mutateAndGetPayload: (args: { [string]: any },
                        context: any,
                        info: GraphQLResolveInfo,
                        sgContext: SGContext) => any
}

/**
 * ValidateConfig, for {@link https://github.com/chriso/validator.js|validator.js}
 */
type ValidateConfig = {
  is?: [string, string] | RegExp,
  not?: [string, string],
  isEmail?: boolean,
  isUrl?: boolean,
  isIP?: boolean,
  isIPv4?: boolean,
  isIPv6?: boolean,
  isAlpha?: boolean,
  isAlphanumeric?: boolean,
  isNumeric?: boolean,
  isInt?: boolean,
  isFloat?: boolean,
  isDecimal?: boolean,
  isLowercase?: boolean,
  isUppercase?: boolean,
  notNull?: boolean,
  isNull?: boolean,
  notEmpty?: boolean,
  equals?: string | boolean | number,
  contains?: string,
  notIn?: [Array<string | boolean | number>],
  isIn?: [Array<string | boolean | number>],
  notContains?: string,
  len?: [number, number],
  isUUID?: number,
  isDate?: boolean,
  isAfter?: string,
  isBefore?: string,
  max?: number,
  min?: number,
  isCreditCard?: boolean,
  [string]: (string) => void
}

/** DB Column config */
type ColumnConfig = DefineAttributeColumnOptions

/**
 * @public
 */
type BaseFieldType =
  Class<String>
  | Class<Number>
  | Class<Boolean>
  | Class<Date>
  | Class<JSON>
  | GraphQLOutputType
  | Type.ScalarFieldType
  | string

/**
 * @public
 */
export type FieldType = BaseFieldType | Array<LinkedFieldType> | {
  $type: LinkedFieldType,
  description?: string,
  enumValues?: Array<string>,
  default?: any,
  required?: boolean,
  hidden?: boolean, // hidden为true, 对应的field将不会出现在graphql schema中
  validate?: ValidateConfig,
  column?: ColumnConfig
}

/**
 * @public
 */
export type SchemaOptionConfig = {
  description?: string,
  plugin?: Object,
  table?: DefineOptions<any>
}

/**
 * @public
 */
export type HasOneConfig<T> = {
  [string]: {
    config?: T,
    hidden?: boolean,
    target: string,
    foreignField?: string,
    foreignKey?: string,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean
  }
}

/**
 * @public
 */
export type BelongsToConfig = {
  [string]: {
    hidden?: boolean,
    target: string,
    foreignField?: string,
    foreignKey?: string | { name: string, allowNull?: boolean },
    targetKey?: string,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean
  }
}

export type HasManyConfig<T> = {
  [string]: {
    config?: T,
    hidden?: boolean,
    conditionFields?: ArgsType,
    target: string,
    through?: string | {
      model: string,
      scope?: Object,
      unique?: boolean
    },
    foreignField?: string,
    foreignKey?: string,
    sourceKey?: string,
    scope?: Object,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean,
    order?: Array<Array<any>>,
    outputStructure?: 'Connection' | 'Array'
  }
}

/**
 * @public
 */
export type BelongsToManyConfig = {
  [string]: {
    hidden?: boolean,
    target: string,
    through?: string | {
      model: string,
      scope?: Object,
      unique?: boolean
    },
    foreignField?: string | Object,
    otherKey?: string | Object,
    scope?: Object,
    timestamps?: boolean,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?: boolean
  }
}

/**
 * @public
 */
export type AssociationConfig<T> = {
  hasOne: HasOneConfig<T>,
  belongsTo: BelongsToConfig,
  hasMany: HasManyConfig<T>,
  belongsToMany: BelongsToManyConfig,
}

export type BuildOptionConfig = {
  hooks?: Array<{
    description?: string,
    filter: (action: { type: 'field' | 'query' | 'mutation', config: any })=>boolean,
    hook: (action: { type: 'field' | 'query' | 'mutation', config: any },
           invokeInfo: { source?: any, args: any, context: any, info: GraphQLResolveInfo, sgContext: SGContext },
           next: ()=>any)=>any
  }>,
  query?: {
    viewer?: 'AllQuery' | 'FromModelQuery' | QueryConfig<any>,
  },
  mutation?: {
    payloadFields?: Array<string | {
      name: string,
      $type: LinkedFieldType,
      description?: string,
      args?: ArgsType,
      resolve: (args: { [argName: string]: any },
                context: any,
                info: GraphQLResolveInfo,
                sgContext: SGContext) => any
    }>
  }
}
