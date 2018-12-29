// @flow
import _ from 'lodash'
export default function (args:{attributes:Array<string>, selections:Array<any>}) {
  const dbModel = this
  const schema = dbModel.getSGContext().schemas[this.name]

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

  const push = (array, element) => {
    if (_.indexOf(array, element) === -1) {
      array.push(element)
      return true
    } else {
      return false
    }
  }

  const fieldToSelection = (field) => {
    const index = field.indexOf('.')
    if (index === -1) { return {name: field} } else {
      return {
        name: field.substr(0, index),
        selections: [fieldToSelection(field.substr(index + 1))]
      }
    }
  }

  const getDependentOptions = (option:{additionFields:Array<string>, attributes:Array<string>}, fieldName) => {
    const linkConfig = schema.config.links[fieldName]
    if (linkConfig) {
      if (linkConfig.dependentFields) {
        linkConfig.dependentFields.forEach(field => {
          const ss = field.split('.')
          if (schema.config.fields[fieldName]) {
            push(option.attributes, schema.config.fields[fieldName])
          }
          if (push(option.additionFields, field)) {
            option = getDependentOptions(option, ss[0])
          }
        })
      } else {
        // if no dependentFields, default depend all field
        _.forOwn(schema.config.fields, (value, key) => {
          push(option.attributes, getFieldName(key, value))
        })
      }
    } else {
      const fieldConfig = schema.config.fields[fieldName]
      if (fieldConfig) {
        push(option.attributes, getFieldName(fieldName, fieldConfig))
      }
    }
    return option
  }

  let option = {additionFields: [], attributes: [...(args.attributes || []), 'id']}

  if (args.selections) {
    args.selections.forEach(selection => {
      option = getDependentOptions(option, selection.name)
    })
  }

  return {
    attributes: _.uniq(option.attributes),
    additionSelections: option.additionFields.map(field => fieldToSelection(field))
  }
}
