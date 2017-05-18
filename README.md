# Simple-GraphQL

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

`Simple-GraphQL` generates [GraphQL](https://github.com/graphql/graphql-js) schemas and [Sequelize](http://docs.sequelizejs.com/en/v3/) models from your models definition(support [FlowType](https://flow.org/) static type check), that's how simple it is. The generated GraphQL schema is compatible with [Relay](https://facebook.github.io/relay/).

>[GraphQL](https://github.com/graphql/graphql-js) is a query language for your API, and a server-side runtime for executing queries by using a type system you define for your data. 

>[Sequelize](http://docs.sequelizejs.com/en/v3/) is a promise-based ORM for Node.js. It supports the dialects `PostgreSQL`, `MySQL`, `SQLite` and `MSSQL` and features solid transaction support, relations, read replication and more.

>[FlowType](https://flow.org/) is a static type checker for your JavaScript code. It does a lot of work to make you more productive. Making you code faster, smarter, more confidently, and to a bigger scale.

## Document

-   [API](https://github.com/logerzhu/simple-graphql/wiki/API)
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
## Roadmap
  - [ ] Detail usage document
  - [ ] Test
  - [ ] [ < place for your ideas > ](https://github.com/logerzhu/simple-graphql/issues/new)

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

## License

[MIT](https://github.com/logerzhu/simple-graphql/blob/master/LICENSE)
