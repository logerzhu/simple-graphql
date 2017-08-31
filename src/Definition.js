// @flow
import Sequelize from 'sequelize'

import type {GraphQLOutputType, GraphQLResolveInfo} from 'graphql'

import Type from './type'

/* global Class */

/**
 * @public
 */
export type LinkedFieldType = Class<String> | Class<Number> | Class<Boolean> | Class<Date> | Class<JSON> | GraphQLOutputType |
  Type.ScalarFieldType | string | Array<LinkedFieldType> | {
  [string]:LinkedFieldType,
  $type?:LinkedFieldType,
  required?:boolean,
  default?:any,
  enumValues?:Array<string>,
  description?:string,
  args?:{[string]:LinkedFieldType},
  resolve?: (source:any, args:{[string]: any},
             context:any,
             info:GraphQLResolveInfo,
             models:{[string]:Sequelize.Model}) => any
}

/**
 * @public
 */
export type ArgsType = {[string]:LinkedFieldType}

/**
 * @public
 */
export type LinkedFieldConfig = {
  $type:LinkedFieldType,
  description?:string,
  args?:ArgsType,
  resolve: (source:any, args:{[string]: any},
            context:any,
            info:GraphQLResolveInfo,
            models:{[string]:Sequelize.Model}) => any
}

/**
 * @public
 */
export type QueryConfig<T> ={
  $type:LinkedFieldType,
  description?:string,
  config?:T,
  args?:ArgsType,
  resolve: (args:{[string]: any},
            context:any,
            info:GraphQLResolveInfo,
            models:{[string]:Sequelize.Model}) => any
}

/**
 * @public
 */
export type MutationConfig<T> ={
  description?:string,
  config?:T,
  inputFields:ArgsType,
  outputFields:{[string]:LinkedFieldType},
  mutateAndGetPayload:(args:{[string]: any},
                       context:any,
                       info:GraphQLResolveInfo,
                       models:{[string]:Sequelize.Model}) => any
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
  equals?: string | boolean |number,
  contains?: string,
  notIn?: [Array<string | boolean |number>],
  isIn?: [Array<string | boolean |number>],
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
type ColumnConfig = {
  type?:Sequelize.DataType | {BINARY:Sequelize.DataType} | (number) =>Sequelize.DataType | (number, number) => Sequelize.DataType,
  allowNull?:boolean,
  defaultValue?:any,
  unique?:boolean,
  primaryKey?:boolean,
  field?:string,
  autoIncrement?:boolean,
  comment?:string,
  references?:{
    model:string,
    key?:string,
    deferrable?:string
  },
  validate?: ValidateConfig,
  onUpdate?:'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'SET NULL' | 'NO ACTION',
  onDelete?:'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'SET NULL' | 'NO ACTION',
  get?:()=>any,
  set?:(any) =>void
}

/**
 * @public
 */
type BaseFieldType = Class<String> | Class<Number> | Class<Boolean> | Class<Date> | Class<JSON> |GraphQLOutputType |
  Type.ScalarFieldType | string

/**
 * @public
 */
export type FieldType = BaseFieldType | {
  $type:BaseFieldType,
  description?:string,
  enumValues?:Array<string>,
  default?:any,
  required?:boolean,
  hidden?: boolean,                     // hidden为true, 对应的field将不会出现在graphql schema中
  searchable?: boolean,                 // 是否可以在plural的Query中出现
  advancedSearchable?:boolean,          // 是否可以在plural的Query中支持高级搜索
  initializable?:boolean,               // 是否可以在add的Mutation中出现
  mutable?:boolean,                      // 是否可以在update的Mutation中出现
  validate?: ValidateConfig,
  column?:ColumnConfig
}

/**
 * @public
 */
export type SchemaOptionConfig = {
  description?:string,
  plugin?:Object,
  table?:{
    defaultScope?:Object,
    scopes?:Object,
    omitNull?:boolean,
    timestamps?:boolean,
    createdAt?:string|boolean,
    updatedAt?:string|boolean,
    paranoid?:boolean,
    deletedAt?:string|boolean,
    underscored?:boolean,
    underscoredAll?:boolean,
    freezeTableName?:boolean,
    name?:{
      singular?:string,
      plural?:string,
    },
    indexes?:Array<{
      name?:string,
      type?:'UNIQUE' | 'FULLTEXT' | 'SPATIAL',
      method?:'USING' | 'USING' | 'HASH' | 'GIST' | 'GIN',
      unique?:boolean,
      concurrently?:boolean,
      fields?:Array<string | {
        attribute?:string,
        length?:number,
        order?:'ASC' | 'DESC',
        collate?:string
      }>
    }>,
    tableName?:string,
    getterMethods?:{[string]:() => any},
    setterMethods?:{[string]:(any) => void},
    instanceMethods?:{[string]:any},
    classMethods?:{[string]:any},
    schema?:string,
    engine?:string,
    charset?:string,
    comment?:string,
    collate?:string,
    rowFormat?:string,
    initialAutoIncrement?:string,
    validate?: ValidateConfig,
    hooks?:{
      beforeBulkCreate?:(Object, Object) => void | Array<(Object, Object) => void>,
      beforeBulkDestroy?:(Object) => void | Array<(Object) => void>,
      beforeBulkUpdate?:(Object) => void | Array<(Object) => void>,
      beforeValidate?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterValidate?:(Object, Object) => void | Array<(Object, Object) => void>,
      validationFailed?:(Object, Object, Object) => void | Array<(Object, Object, Object) => void>,
      beforeCreate?:(Object, Object) => void | Array<(Object, Object) => void>,
      beforeDestroy?:(Object, Object) => void | Array<(Object, Object) => void>,
      beforeUpdate?:(Object, Object) => void | Array<(Object, Object) => void>,
      beforeSave?:(Object, Object) => void | Array<(Object, Object) => void>,
      beforeUpsert?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterCreate?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterDestroy?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterUpdate?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterSave?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterUpsert?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterBulkCreate?:(Object, Object) => void | Array<(Object, Object) => void>,
      afterBulkDestroy?:(Object) => void | Array<(Object) => void>,
      afterBulkUpdate?:(Object) => void | Array<(Object) => void>,
    }
  }
}

/**
 * @public
 */
export type HasOneConfig ={
  [string]:{
    hidden?: boolean,
    target: string,
    foreignField:string,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?:boolean
  }
}

/**
 * @public
 */
export type BelongsToConfig = {
  [string]:{
    hidden?: boolean,
    target: string,
    foreignField:string,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?:boolean
  }
}

export type HasManyConfig = {
  [string]:{
    hidden?: boolean,
    conditionFields?:ArgsType,
    target: string,
    foreignField:string,
    scope?:Object,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?:boolean,
    sort?:Array<{field:string, order:'ASC'|'DESC'}>
  }
}

/**
 * @public
 */
export type BelongsToManyConfig ={
  [string]:{
    hidden?: boolean,
    target: string,
    through?:string | {
      model:string,
      scope?:Object,
      unique?:boolean
    },
    foreignField?:string|Object,
    otherKey?:string|Object,
    scope?:Object,
    timestamps?:boolean,
    onDelete?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    onUpdate?: 'SET NULL' | 'CASCADE' | 'RESTRICT' | 'SET DEFAULT' | 'NO ACTION',
    constraints?:boolean
  }
}

/**
 * @public
 */
export type AssociationConfig ={
  hasOne:HasOneConfig,
  belongsTo:BelongsToConfig,
  hasMany:HasManyConfig,
  belongsToMany:BelongsToManyConfig,
}

export type BuildOptionConfig = {
  hooks?:Array<{
    description?: string,
    filter: (action:{type:'field'|'query'|'mutation', config:any})=>boolean,
    hook: (action:{type:'field'|'query'|'mutation', config:any},
           invokeInfo:{source?:any, args:any, context:any, info:GraphQLResolveInfo, models:{[string]:Sequelize.Model}},
           next:()=>any)=>any
  }>,
  query?:{
    viewer?:'AllQuery' | 'FromModelQuery' | QueryConfig<any>,
  },
  mutation?:{
    payloadFields?:Array<string|{
      name:string,
      $type:LinkedFieldType,
      description?:string,
      args?:ArgsType,
      resolve: (args:{[argName: string]: any},
                context:any,
                info:GraphQLResolveInfo,
                models:{[id:string]:Sequelize.Model}) => any}>
  }
}
