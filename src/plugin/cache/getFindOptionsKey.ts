import {FindOptions} from "sequelize";

export default ((dbModel, options: FindOptions<any>) => {
    options = options || {};
    return JSON.stringify({
        ...options,
        where: dbModel.QueryGenerator.whereQuery(options.where)
    });
});