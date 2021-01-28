import { CountOptions, FindOptions } from 'sequelize'
import md5 from 'md5'

export default (dbModel, options: FindOptions | CountOptions) => {
  options = options || {}
  const formatInclude = (include) => {
    if (include) {
      const { parent, association, ...other } = include
      if (other.include && Array.isArray(other.include)) {
        other.include = other.include.map((i) => formatInclude(i))
      }
      return other
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
