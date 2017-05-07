# simple-graphql

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

The simple way to build GraphQL style API with DataBase support.

## Install

```shell
npm install graphql graphql-relay simple-graphql --save
```

## Demo

Check out the project code (<https://github.com/logerzhu/simple-graphql>).

```shell
cd simple-graphql
npm install # install dependencies in the main folder
npm run demo # run the demo and open your browser: http://localhost:9413/graphql
```

## Usage

This library support [FlowType](https://flow.org/) (a static typechecker for JavaScript), which can help to check you model defintion.

**Examples**

### Define the model
```javascript
// @flow
import SG from 'simple-graphql'

const TodoType = SG.modelRef('Todo')

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

### Config the Sequelize database connection.
```javascript
import Sequelize from 'sequelize'
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
export default sequelize
```

### Generate the GraphQL Schema

```javascript
import SG from 'simple-graphql'

//import Todo model and sequlize config ...

const schema = GS.build(sequelize, [Todo], {})

//After bulid, all sequelize models have defined, then call sequelize.sync will automatic create the schema in database.
sequelize.sync({
  force: false,
  logging: console.log
}).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))

export default
```

### Start the GraphQL server
```javascript
const express = require('express');
const graphqlHTTP = require('express-graphql');

const app = express();

app.use('/graphql', graphqlHTTP({
 schema: MyGraphQLSchema,
 graphiql: true
}));
app.listen(4000);
```

## Document

-   [API](docs/API.md)

## License

[MIT](https://github.com/logerzhu/simple-graphql/blob/master/LICENSE)
