// @flow
import _ from 'lodash'
export default function (args:{attributes:Array<string>, selections:Array<any>}) {
  const dbModel = this
  const schema = dbModel.getSGContext().schemas[this.name]

  const result = [...(args.attributes || [])]
  result.push('id')

  const getFieldName = (key, config) => {
    let fType = config
    if (config && config['$type']) {
      fType = config['$type']
    }
    if (typeof fType === 'string') {
      return key + 'Id'
    } else {
      return key
    }
  }

  for (let selection of args.selections) {
    const linkConfig = schema.config.links[selection.name]
    if (linkConfig) {
      if (linkConfig.dependentFields) {
        linkConfig.dependentFields.forEach(field => result.push(field))
      } else {
        // if no dependentFields, default depend all field
        _.forOwn(schema.config.fields, (value, key) => {
          result.push(getFieldName(key, value))
        })
        break
      }
    } else {
      const fieldConfig = schema.config.fields[selection.name]
      if (fieldConfig) {
        result.push(getFieldName(selection.name, fieldConfig))
      }
    }
  }
  return _.uniq(result)
}
