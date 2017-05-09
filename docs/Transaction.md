# Transaction

Simple-GraphQL generate [Sequelize](http://docs.sequelizejs.com/en/v3/) models to connect Database. 
To know more about Sequelize trasaction usage, refer to http://docs.sequelizejs.com/en/v3/docs/transactions/ .

## Automatically pass transactions to all mutations

- [Enable CLS on Sequelize](http://docs.sequelizejs.com/en/v3/docs/transactions/#automatically-pass-transactions-to-all-queries)
> To automatically pass the transaction to all queries you must install the [continuation local storage](https://github.com/othiym23/node-continuation-local-storage) (CLS) module and instantiate a namespace in your own code:
>
> ```
> var cls = require('continuation-local-storage'),
>    namespace = cls.createNamespace('my-very-own-namespace');
> ```
> To enable CLS you must tell sequelize which namespace to use by setting it as a property on the sequelize constructor:
> ```
> var Sequelize = require('sequelize');
> Sequelize.cls = namespace;
> 
> new Sequelize(....);
> ```

- Use hooks config to enable transaction for all mutations
```
const schema = SimpleGraphQL.build(sequelize, models, {
  hooks: [{
    description: 'Enable transaction on mutations',
    filter: ({type, config}) => type === 'mutation',
    hook: async function ({type, config}, {source, args, context, info, models}, next) {
      return sequelize.transaction(function (t) {
        return next()
      })
    }
  }]
})
```
