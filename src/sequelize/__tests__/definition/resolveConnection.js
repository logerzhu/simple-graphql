// @flow
import Sequelize from 'sequelize'
import _ from 'lodash'

export default async function resolveConnection (sequelize:Sequelize, modelName:string, args:{
  after?: string,
  first?: number,
  before?: string,
  last?: number,
  conditionSql:string,
  orderBySql:string,
  replacements?:Object
}):Promise<{
  pageInfo: {
    startCursor:string|number,
    endCursor:string|number,
    hasPreviousPage: boolean,
    hasNextPage: boolean
  },
  edges:Array<{
    node:any,
    cursor:string|number
  }>,
  count: number
}> {
  let {after, first, before, last, conditionSql, orderBySql, replacements} = args

  first = (first == null ? 100 : first)

  const count = (await sequelize.query('select count(*) as count ' + conditionSql, {replacements: replacements}))[0][0].count

  if (last || before) {
    throw new Error('Argument last or before is not supported!')
  }

  const offset = Math.max(after != null ? parseInt(after) : 0, 0)

  const tableName = sequelize.models[modelName].options.tableName || sequelize.models[modelName].options.name.plural

  const columnMappings = []
  _.forOwn(sequelize.models[modelName].tableAttributes, (field, key) => {
    if (field && field.field && field.fieldName) {
      if (field.field === field.fieldName) {
        columnMappings.push(`${tableName}.${field.field}`)
      } else {
        columnMappings.push(`${tableName}.${field.field} as ${field.fieldName}`)
      }
    }
  })

  const result = await sequelize.query(`select ${columnMappings.join(', ')} ${conditionSql} ${orderBySql} LIMIT ${first} OFFSET ${offset}`
    , {
      replacements: replacements,
      model: sequelize.models[modelName],
      mapToModel: true
    }
  )

  let index = 0
  let startCursor = offset + 1
  let endCursor = offset + result.length
  return {
    pageInfo: {
      startCursor: startCursor,
      endCursor: endCursor,
      hasPreviousPage: offset > 0,
      hasNextPage: offset + result.length < count
    },
    edges: result.map(node => {
      return {
        node: node,
        cursor: offset + (++index)
      }
    }),
    count: count
  }
}
