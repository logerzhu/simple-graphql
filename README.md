# Simple-GraphQL

### 核心功能: 
* 避免重复代码, 基于统一的实体定义 (类似 [JSON Typedef](https://jsontypedef.com/) 的扩展) 生成 GraphQL Schema 和 Sequelize Model
  

* 可扩展的`字段类型`配置
  * (内置) 类型 ```String Number Integer Date JSON Boolean```
    

* 可扩展的`插件`配置, 用于动态修改相关配置
  * (内置) 生成可配置的GraphQL接口, 如 GraphQL CRUD 接口


* 可扩展的`拦截器`配置, 用于在运行时对GraphQL接口调用的拦截.
  * GraphQL Mutation接口的 transaction 支持
  * 用户权限验证功能  
    

* 可扩展的单实例`服务`接口支持. 


## 安装
```
 npm install simple-graphql graphql graphql-relay -save

```
### 用法
TODO

## License

[MIT](https://github.com/logerzhu/simple-graphql/blob/master/LICENSE)
