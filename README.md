# Simple-GraphQL

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

`Simple-GraphQL` generates [GraphQL](https://github.com/graphql/graphql-js) schemas and [Sequelize](http://docs.sequelizejs.com/en/v3/) models from your models definition(support [FlowType](https://flow.org/) static type check), that's how simple it is. The generated GraphQL schema is compatible with [Relay](https://facebook.github.io/relay/).

>[GraphQL](https://github.com/graphql/graphql-js) is a query language for your API, and a server-side runtime for executing queries by using a type system you define for your data. 

>[Sequelize](http://docs.sequelizejs.com/en/v3/) is a promise-based ORM for Node.js. It supports the dialects `PostgreSQL`, `MySQL`, `SQLite` and `MSSQL` and features solid transaction support, relations, read replication and more.

>[FlowType](https://flow.org/) is a static type checker for your JavaScript code. It does a lot of work to make you more productive. Making you code faster, smarter, more confidently, and to a bigger scale.

## Document

-   [API](docs/API.md)
-   [Transaction](docs/Transaction.md)

## Install

```shell
npm install graphql graphql-relay simple-graphql --save
```

## Demo

Check out the project code (<https://github.com/logerzhu/simple-graphql>).

```shell
cd simple-graphql
npm install # install dependencies in the main folder
npm run start # run the demo and open your browser: http://localhost:9413/graphql
```

## Usage

### Define the model

Todo.js

```javascript
// @flow
import SG from 'simple-graphql'

const TodoType = SG.modelRef('Todo') // Reference to Todo model type

export default SG.model('Todo').fields({
  title: {
    $type: String,
    required: true
  },
  description: String,
  completed: {
    $type: Boolean,
    required: true
  },
  dueAt: Date
}).queries({
  dueTodos: {
    description: "Find all due todos",
    $type: [TodoType],
    args: {
      dueBefore: {
        $type: Date,
        required: true
      }
    },
    resolve: async function ({ dueBefore}, context, info, {Todo}) {
      return Todo.find({
        where: {
          completed: false,
          dueAt: {
            $lt: dueBefore
          }
        }
      })
    }
  }
}).mutations({
  cpmpletedTodo: {
    description: "Mark the todo task completed.",
    inputFields: {
      todoId: {
        $type: TodoType,
        required: true
      }
    },
    outputFields: {
      changedTodo: TodoType
    },
    mutateAndGetPayload: async function ({todoId}, context, info, {Todo}) {
      const todo = await Todo.findOne({where: {id: todoId}})
      if (!todo) {
        throw new Error("Todo entity not found.")
      }
      if (!todo.completed) {
        todo.completed = true
        await todo.save()
      }
      return {changedTodo: todo}
    }
  }
})
```

### Generate the GraphQL Schema and start the server

```javascript
import Sequelize from 'sequelize'
import SG from 'simple-graphql'
import express from 'express'
import graphqlHTTP from 'express-graphql'

import Todo from './Todo'

// Config the Sequelize database connection.
const sequelize = new Sequelize('test1', 'postgres', 'Password', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
})


// Generate the GraphQL Schema
const schema = GS.build(sequelize, [Todo], {}) 

// After GS.bulid completed, all sequelize models have defined, and call sequelize.sync will automatic create the schema in database.
sequelize.sync({
  force: false, // if true, it will drop all existing table and recreate all.
  logging: console.log
}).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))


// Start the GraphQL server
const app = express()

app.use('/graphql', graphqlHTTP({
 schema: schema,
 graphiql: true
}))
app.listen(4000)

```
## Model Definition
```
Const model = SimpleGraphQL
  .model(#name: string, #option: ModelOptionConfig)                   // Define a Model
  .fields(#fields: {[string]:FieldType | FieldTypeConfig})            // Add fields to current model
  .links(#links: {[string]:LinkFieldType | LinkFieldTypeConfig})      // Add link fields to current model
  .queries(#queries: {[string]: QueryConfig})                         // Add GraphQL queries to current model
  .mutations(#queries: {[string]: MutationConfig})                    // Add GraphQL mutations to current model
  .methods(#methods: {[string]:any}                                   // Add instance method to current Model
  .statics(#methods: {[string]:any}                                   // Add statics method to current Model
  .hasOne(#config: HasOneConfig)                                    
  .belongsTo(#config: BelongsToConfig)
  .hasMany(#config: HasManyConfig)
  .belongsToMany(#config: BelongsToManyConfig)
```


## Configutation
- [ModelOptionConfig](modeloptionconfig)
- [ModelTableOptionConfig](modeltableoptionconfig)

### ModelOptionConfig
Attribute|Description
------------ | -------------
description?:string | Model description, using on GraphQL Type description. 
singularQuery?:string | if false, the sigular GraphQL query will not be genereated. 
pluralQuery?:boolean\|Object | if false, the plural GraphQL query will not be genereated.
addMutation?:boolean\|Object | if false, the add GraphQL mutation will not be genereated.
deleteMutation?:boolean\|Object | if false, the delete GraphQL mutation will not be genereated.
updateMutation?:boolean\|Object | if false, the update GraphQL mutation will not be genereated.
table?:[ModelTableOptionConfig](modeltableoptionconfig) | Reference to [Options](http://docs.sequelizejs.com/en/v3/api/sequelize/#definemodelname-attributes-options-model) of model define [sequelize.define]

### ModelTableOptionConfig
```
type ModelTableOptionConfig = {

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
```

## License

[MIT](https://github.com/logerzhu/simple-graphql/blob/master/LICENSE)
