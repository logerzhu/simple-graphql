// @flow
import _ from 'lodash'

type Selection = { name: string, selections?: Array<Selection> }

export default function (args: { attributes: Array<string>, selections: Array<any> }): {
  attributes: Array<string>,
  additionSelections: Array<Selection>
} {
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

  const fieldToSelection = (field: string): Selection => {
    const index = field.indexOf('.')
    if (index === -1) { return { name: field } } else {
      return {
        name: field.substr(0, index),
        selections: [fieldToSelection(field.substr(index + 1))]
      }
    }
  }

  const getDependentOptions = (option: { additionFields: Array<string>, attributes: Array<string> }, fieldName) => {
    const hasManyConfig = schema.config.associations.hasMany[fieldName]
    if (hasManyConfig && hasManyConfig.outputStructure === 'Array' &&
      (hasManyConfig.conditionFields == null || hasManyConfig.conditionFields.length === 0)) {
      (hasManyConfig.order || [['id', 'ASC']]).forEach(p => {
        if (typeof p[0] === 'string') {
          push(option.additionFields, `${fieldName}.${p[0]}`)
        }
      })
    }

    const linkConfig = schema.config.links[fieldName]
    if (linkConfig) {
      if (linkConfig.dependentFields) {
        linkConfig.dependentFields.forEach(field => {
          const ss = field.split('.')
          if (push(option.additionFields, field)) {
            option = getDependentOptions(option, ss[0])
          }
        })
        if (schema.config.fields[fieldName]) {
          push(option.attributes, getFieldName(fieldName, schema.config.fields[fieldName]))
        }
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
      } else if (fieldName === '*') {
        _.forOwn(schema.config.fields, (value, key) => {
          push(option.attributes, getFieldName(key, value))
        })
      }
    }
    return option
  }

  let option: { additionFields: Array<string>, attributes: Array<string> } = {
    additionFields: [],
    attributes: [...(args.attributes || []), 'id']
  }

  if (args.selections) {
    args.selections.forEach(selection => {
      option = getDependentOptions(option, selection.name)
    })
  }

  return {
    attributes: _.uniq(option.attributes),
    additionSelections: option.additionFields.map((field) => fieldToSelection(field))
  }
}
