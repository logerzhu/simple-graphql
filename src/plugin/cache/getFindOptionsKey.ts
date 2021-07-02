import { CountOptions, FindOptions } from 'sequelize'
import crypto from 'crypto'

function md5(source: string) {
  return crypto.createHash('md5').update(source).digest('hex')
}

export default (dbModel, options: FindOptions | CountOptions) => {
  options = options || {}
  const formatInclude = (include) => {
    if (include) {
      const { parent, association, ...other } = include
      if (other.include && Array.isArray(other.include)) {
        other.include = other.include.map((i) => formatInclude(i))
      }
      return { as: other.as, attributes: other.attributes }
    }
    return include
  }
  const getInclude = () => {
    if (Array.isArray(options.include)) {
      return options.include
    } else if (options.include != null) {
      return [options.include]
    } else {
      return []
    }
  }
  const include = getInclude().map((i) => formatInclude(i))

  return md5(
    JSON.stringify({
      ...options,
      include: include,
      where: dbModel.queryGenerator.whereQuery(options.where)
    })
  )
}
