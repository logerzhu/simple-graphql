import express from "express";
import graphqlHTTP from "express-graphql";

import schema from "./schema";
import sequelize from "./sequelize";
import initData from "./data";

async function startServer() {
    await sequelize.sync({
        force: true,
        logging: console.log
    });
    await initData(sequelize);

    const app = express();
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        graphiql: true
    }));

    console.log('GraphQL Server is now running on http://localhost:4000');
    app.listen(4000);
}

startServer().then(() => null, err => console.log('Init GraphQL Server Fail', err));