/**
 * Created by yuyanq on 2018/6/3.
 */
import _ from 'lodash'
import dotEnv from 'dotenv'

// 读取.env的环境变量
const result = dotEnv.config()
if (result.error) {
  throw result.error
}

const env = _.get(process, 'env', {})
export default env
