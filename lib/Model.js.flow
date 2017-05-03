//@flow
import Sequelize from 'sequelize'
import * as graphql from 'graphql'

import Type from './type'
import Connection from "./Connection"
import ModelRef from './ModelRef'

type QueryConfig ={
  $type: any,
  args?: any,
  resolve: (args:{[argName: string]: any},
            info:graphql.GraphQLResolveInfo,
            models:any) => any
}

type ValidateConfig = {
  is?: [string,string] | RegExp,
  not?: [string,string],
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
  len?: [number,number],
  isUUID?: number,
  isDate?: boolean,
  isAfter?: string,
  isBefore?: string,
  max?: number,
  min?: number,
  isCreditCard?: boolean,
  [id:string]: (string) => void
}

type ColumnConfig = {
  type:Sequelize.DataType | {BINARY:Sequelize.DataType} |  (number) =>Sequelize.DataType |  (number, number) => Sequelize.DataType,
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

type BaseFieldType = typeof String | typeof Number | typeof Boolean | typeof Date | typeof JSON | ModelRef | Type.ScalarFieldType | Connection.ConnectionType | Connection.EdgeType


type FieldType = BaseFieldType | {
  $type:BaseFieldType,
  enumValues?:Array<string>,
  defaultValue?:any,
  required?:boolean,
  hidden?: boolean,                     // hidden为true, 对应的field将不会出现在graphql schema中
  searchable?: boolean,                 // 是否可以在plural的Query中出现
  advancedSearchable?:boolean,          // 是否可以在plural的Query中支持高级搜索
  initializable?:boolean,               // 是否可以在add的Mutation中出现
  mutable?:boolean,                      // 是否可以在update的Mutation中出现
  validate?: ValidateConfig,
  column?:ColumnConfig
}

type ModelOption = {
  description?:string,
  singularQuery?:boolean|Object,
  pluralQuery?:boolean|Object,
  addMutation?:boolean|Object,
  deleteMutation?:boolean|Object,
  updateMutation?:boolean|Object,
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
    getterMethods?:{[id:string]:() => any},
    setterMethods?:{[id:string]:(any) => void},
    instanceMethods?:{[id:string]:any},
    classMethods?:{[id:string]:any},
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

type HasOneConfig ={
  target: string,
  options?: {
    hooks?: boolean,
    as?:string|Object,
    foreignKey?:string|Object,
    onDelete?: 'SET NULL' | 'CASCADE',
    onUpdate?: 'CASCADE',
    constraints?:boolean
  }
}

type BelongsToConfig = {
  target: string,
  options?: {
    hooks?: boolean,
    as?:string|Object,
    foreignKey?:string|Object,
    onDelete?: 'SET NULL' | 'CASCADE',
    onUpdate?: 'CASCADE',
    constraints?:boolean
  }
}

type HasManyConfig = {
  target: string,
  options?: {
    hooks?: boolean,
    as?:string|Object,
    foreignKey?:string|Object,
    scope?:Object,
    onDelete?: 'SET NULL' | 'CASCADE',
    onUpdate?: 'CASCADE',
    constraints?:boolean
  }
}

type BelongsToManyConfig ={
  target: string,
  options?: {
    hooks?: boolean,
    through?:string  | {
      model:string,
      scope?:Object,
      unique?:boolean
    },
    as?:string,
    foreignKey?:string|Object,
    otherKey?:string|Object,
    scope?:Object,
    timestamps?:boolean,
    onDelete?: 'SET NULL' | 'CASCADE',
    onUpdate?: 'CASCADE',
    constraints?:boolean
  }
}

type AssociationConfig ={
  hasOne:Array<HasOneConfig>,
  belongsTo:Array<BelongsToConfig>,
  hasMany:Array<HasManyConfig>,
  belongsToMany:Array<BelongsToManyConfig>,
}

export default class Model {
  name:string

  config:{
    fields:{[id:string]: FieldType},
    associations:AssociationConfig,
    options:ModelOption,
    queries:{[id:string]: QueryConfig},
    mutations:{[id:string]: any},
    methods:{[id:string]: any},
    statics:{[id:string]: any}
  }


  constructor(name:string, options:ModelOption = {}) {
    this.name = name
    this.config = {
      fields: {},
      associations: {
        hasOne: [],
        belongsTo: [],
        hasMany: [],
        belongsToMany: []
      },
      options: options,
      queries: {},
      mutations: {},
      methods: {},
      statics: {}
    }
  }


  fields(fields:{[id:string]: FieldType}):Model {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  queries(queries:{[id:string]:QueryConfig}):Model {
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  mutations(mutations:{[id:string]:any}):Model {
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  methods(methods:{[id:string]:any}):Model {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  statics(statics:{[id:string]:any}):Model {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  hasOne(config:HasOneConfig):Model {
    this.config.associations.hasOne.push(config)
    return this
  }

  belongsTo(config:BelongsToConfig):Model {
    this.config.associations.belongsTo.push(config)
    return this
  }

  hasMany(config:HasManyConfig):Model {
    this.config.associations.hasMany.push(config)
    return this
  }

  belongsToMany(config:BelongsToManyConfig):Model {
    this.config.associations.belongsToMany.push(config)
    return this
  }
}