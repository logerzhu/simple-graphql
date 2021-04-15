import _ from 'lodash'
import { SGColumnFieldConfig, SGModel, SGModelCtrl } from '../../index'

type Selection = {
  namedType?: string
  name: string
  selections?: Array<Selection>
}

export default function <M extends SGModel>(
  this: SGModelCtrl<M>,
  args: {
    attributes: Array<string>
    selections?: Array<Selection>
  }
): {
  attributes: Array<string>
  additionSelections: Array<Selection>
} {
  const dbModel = this
  const schema = dbModel.getSGContext().schemas[this.name]

  const getFieldName = (key: string, config: SGColumnFieldConfig) => {
    if (config.type && dbModel.getSGContext().schemas[config.type] != null) {
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
    if (index === -1) {
      return { name: field }
    } else {
      return {
        name: field.substr(0, index),
        selections: [fieldToSelection(field.substr(index + 1))]
      }
    }
  }

  const getDependentOptions = (
    option: { additionFields: Array<string>; attributes: Array<string> },
    fieldName
  ) => {
    const hasManyConfig = schema.config.associations.hasMany[fieldName]
    if (
      hasManyConfig &&
      hasManyConfig.outputStructure === 'Array' &&
      (hasManyConfig.conditionFields == null ||
        _.keys(hasManyConfig.conditionFields).length === 0)
    ) {
      const order = hasManyConfig.order || [['id', 'ASC']]
      if (Array.isArray(order)) {
        order.forEach((p) => {
          if (typeof p[0] === 'string') {
            push(option.additionFields, `${fieldName}.${p[0]}`)
          }
        })
      }
    }

    const linkConfig = schema.config.links[fieldName]
    if (linkConfig) {
      if (linkConfig.dependentFields) {
        linkConfig.dependentFields.forEach((field) => {
          const ss = field.split('.')
          if (push(option.additionFields, field)) {
            option = getDependentOptions(option, ss[0])
          }
        })
        if (schema.config.fields[fieldName]) {
          push(
            option.attributes,
            getFieldName(fieldName, schema.config.fields[fieldName])
          )
        }
      } else {
        // if no dependentFields, default depend all field
        _.forOwn(schema.config.fields, (value, key) => {
          push(option.attributes, getFieldName(key, value))
        })
      }
    } else {
      let fieldConfig = schema.config.fields[fieldName]
      if (!fieldConfig && fieldName.endsWith('Id')) {
        fieldName = fieldName.substr(0, fieldName.length - 2)
        fieldConfig = schema.config.fields[fieldName]
      }
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

  let option: { additionFields: Array<string>; attributes: Array<string> } = {
    additionFields: [],
    attributes: [...(args.attributes || []), 'id']
  }

  if (args.selections) {
    args.selections.forEach((selection) => {
      if (selection.namedType == null || selection.namedType === schema.name) {
        option = getDependentOptions(option, selection.name)
      }
    })
  }

  return {
    attributes: _.uniq(option.attributes),
    additionSelections: option.additionFields.map((field) =>
      fieldToSelection(field)
    )
  }
}
