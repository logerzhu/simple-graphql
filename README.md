# Simple-GraphQL

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

`Simple-GraphQL` 是 [GraphQL](https://github.com/graphql/graphql-js) 的后端开发框架，目的是根据声明式的配置：
* 自动生成`Sequelize`数据模型定义
* 自动生成`GraphQL`接口的定义和实现
* 自动生成数据模型对应的添加、删除、修改和查询接口


## 安装
```
 npm install simple-graphql graphql graphql-relay -save

```

## 例子
```
const SG = require('simple-graphql').default
const Sequelize = require('sequelize')
const express = require('express')
const graphqlHTTP = require('express-graphql')

async function startServer () {
  //只用sqlite数据库
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'demo.sqlite' })

  //根据声明生成GraphQL Schema
  const { graphQLSchema } = SG.build(sequelize, {
    schemas: [SG.schema('User', {
      plugin: {
        pluralQuery: true,   //内置插件，用于生成 user(id: UserId): User 接口
        singularQuery: true, //内置插件，用于生成 users(...): UserConnection 接口
        addMutation: true,   //内置插件，用于生成 addUser(...) 接口
        updateMutation: true,//内置插件，用于生成 updateUser(...) 接口
        deleteMutation: true //内置插件，用于生成 deleteUser(...) 接口
      }
    }).fields({
      name: 'String',
      age: 'Number',
      sex: new Set('Male', 'Female'),
      tags: {
        $type: ['String'],
        require: false,
        description: '标签'
      },
      registeredAt: 'Date'
    })]
  }, {})

  // 自动创建数据表
  await sequelize.sync({
    force: false,
    logging: console.log
  })

  const app = express()
  app.use('/graphql', graphqlHTTP({
    schema: graphQLSchema,
    graphiql: true
  }))

  console.log('GraphQL Server is now running on http://localhost:4000')
  app.listen(4000)
}

startServer().then(() => null, (err) => console.log('Init GraphQL Server Fail', err))

```
> 例子需要安装额外的依赖
> ```npm install express express-graphql sqlite3 -save```

## 数据类型
##### 1. 基本类型

| 类型名 | 描述 | GraphQL类型 | 数据库类型 |
| --- | --- | --- | --- |
| Boolean | 布尔 | GraphQLBoolean | Sequelize.BOOLEAN |
| Date | 日期 | 自定义Date | Sequelize.DATE(6) |
| Id | Id | GraphQLID | Sequelize.INTEGER |
| Integer | 整数 | GraphQLInt | Sequelize.INTEGER |
| JSON | JSON | 自定义JSON | Sequelize.JSON |
| Number | 数字 | GraphQLFloat | Sequelize.DOUBLE |
| String | 字符串 | GraphQLString | Sequelize.STRING |

##### 2. 枚举类型
| 定义 | GraphQL类型 | 数据库类型 |
| --- | --- | --- | 
| new Set('value1','value2',...) | GraphQLEnumType | Sequelize.STRING |

##### 3. 数组类型
| 定义 | GraphQL类型 | 数据库类型 |
| --- | --- | --- | 
| [$类型名] | GraphQLList($类型名对应的GraphQL type) | Sequelize.JSON |

##### 4. Relay类型支持
* ${NodeType}Connection, 对应Relay中的Connection类型
* ${NodeType}Edge, 对应Relay中的Edge类型

##### 5. 自定义类型
例子：自定义短文本（ShortText）类型
```
import { GraphQLString } from 'graphql'
import Sequelize from 'sequelize'

export default {
  name: 'ShortText',
  inputType: GraphQLString,
  outputType: GraphQLString,
  columnOptions: { type: Sequelize.STRING }
}
```

## License

[MIT](https://github.com/logerzhu/simple-graphql/blob/master/LICENSE)
