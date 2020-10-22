import {CountOptions, FindOptions} from "sequelize";
import md5 from 'md5'

export default ((dbModel, options: FindOptions | CountOptions) => {
  options = options || {};
  return md5(JSON.stringify({
    ...options,
    where: dbModel.QueryGenerator.whereQuery(options.where)
  }));
});