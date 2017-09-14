# Simple-GraphQL

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

`Simple-GraphQL` generates [GraphQL](https://github.com/graphql/graphql-js) schemas and [Sequelize](http://docs.sequelizejs.com/en/v3/) models from your models definition(support [FlowType](https://flow.org/) static type check). The generated GraphQL schema is compatible with [Relay](https://facebook.github.io/relay/).

>[GraphQL](https://github.com/graphql/graphql-js) is a query language for your API, and a server-side runtime for executing queries by using a type system you define for your data. 

>[Sequelize](http://docs.sequelizejs.com/en/v3/) is a promise-based ORM for Node.js. It supports the dialects `PostgreSQL`, `MySQL`, `SQLite` and `MSSQL` and features solid transaction support, relations, read replication and more.

>[FlowType](https://flow.org/) is a static type checker for your JavaScript code. It does a lot of work to make you more productive. Making you code faster, smarter, more confidently, and to a bigger scale.

## Document

-   [Transaction](https://github.com/logerzhu/simple-graphql/wiki/Transaction)

## Install

```shell
npm install graphql graphql-relay simple-graphql --save
```

## Roadmap
  - [ ] Query cache with [dataloader](https://github.com/facebook/dataloader)
  - [ ] Test
  - [ ] [ < place for your ideas > ](https://github.com/logerzhu/simple-graphql/issues/new)

## Demo & Usage
```
// @flow
import Sequelize from 'sequelize'
import express from 'express'
import graphqlHTTP from 'express-graphql'
import SG from 'simple-graphql'

// 定义Schema
const TodoSchema = SG.schema('Todo').fields({
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
    description: 'Find all due todos',
    $type: ['Todo'],
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
  completedTodo: {
    description: 'Mark the todo task completed.',
    inputFields: {
      todoId: {
        $type: 'Todo',
        required: true
      }
    },
    outputFields: {
      changedTodo: 'Todo'
    },
    mutateAndGetPayload: async function ({todoId}, context, info, {Todo}) {
      const todo = await Todo.findOne({where: {id: todoId}})
      if (!todo) {
        throw new Error('Todo entity not found.')
      }
      if (!todo.completed) {
        todo.completed = true
        await todo.save()
      }
      return {changedTodo: todo}
    }
  }
})

// 定义Sequelize 链接
const sequelize = new Sequelize('test1', 'postgres', 'Password', {
  host: 'localhost',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  // SQLite only
  storage: ':memory:'
})

// 生成GraphQL的schema
const schema = SG.build(sequelize, [TodoSchema], {})

// 自动建立数据库表
sequelize.sync({
  force: false, // if true, it will drop all existing table and recreate all.
  logging: console.log
}).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))

// 启动http服务器
const app = express()

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}))
app.listen(4000)

```

## License

[MIT](https://github.com/logerzhu/simple-graphql/blob/master/LICENSE)
