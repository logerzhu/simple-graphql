declare class DataType {
}

declare class Sequelize {

  static Model:any;

  static DataType:typeof DataType;

  static STRING:DataType & {BINARY:DataType} & (number) => DataType;
  static TEXT:DataType & (string) => DataType;
  static INTEGER:DataType;
  static BIGINT:DataType & (number) => DataType;
  static FLOAT:DataType & (number) => DataType & (number,number) => DataType;
  static REAL:DataType & (number) => DataType & (number,number) => DataType;
  static DOUBLE:DataType & (number) => DataType & (number,number) => DataType;
  static DECIMAL:DataType & (number,number) => DataType;
  static DATE:DataType & (number) => DataType;
  static DATEONLY:DataType;
  static BOOLEAN:DataType;
  static ENUM:(...Array<string>) => DataType;
  static ARRAY:(DataType) => DataType;
  static JSON:DataType;
  static JSONB:DataType;
  static BLOB:DataType & (string) => DataType;
  static UUID:DataType;


  static useCLS:any;
  static col:any;
  static fn:any;
  static where:any;

  transaction:any;

  options:any;

  constructor:(string,?string,?string,?{
    dialect:'mysql' | 'postgres' | 'sqlite' | 'mssql',
    dialectModulePath?:string,
    dialectOptions?:Object,
    storage?:string,
    host?:string,
    port?:number,
    protocol?:string,
    define?:{
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
    },
    query?:Object,
    set?:Object,
    sync?:Object,
    timezone?:string,
    logging?:boolean |(...args: Array<any>) =>void,
    omitNull?:boolean,
    native?:boolean,
    replication?:boolean,
    pool?:{
      max?:number,
      min?:number,
      idle?:number,
      validateConnection?:any
    },
    quoteIdentifiers?:boolean,
    transactionType?:string,
    isolationLevel?:string,
    retry?:{
      match?:Array<any>,
      max?:number
    },
    typeValidation?:boolean,
    benchmark?:boolean
  }) => Sequelize;

  define:(string,Object,any) => Sequelize.Model;
  sync:({
    force?:boolean,
    match?:RegExp,
    logging?:boolean |(...args: Array<any>) =>void,
    schema?:string,
    searchPath?:string,
    hooks?:boolean,
  })=>Promise<any>;
  showAllSchemas:(any) => Promise<any>;
  models:{[string]:Sequelize.Model}
}

declare module 'sequelize' {
  declare module.exports: Class<Sequelize>;
}
