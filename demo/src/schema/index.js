// @flow
import { mergeSchemas} from 'graphql-tools'
import localSchemas from './buildLocalSchemas'
import {remoteSchema} from './remote/remote'
import {cfg, endPoint} from './remote/endPoints'

async function mergeSchema (ONLY_LOCAL_SCHEMA) {
  if(ONLY_LOCAL_SCHEMA)
    return localSchemas

  const commonSchemas = await remoteSchema(endPoint(cfg.common))

  console.log(commonSchemas)
  // let t = typeFromAST(schema,'')

  const linkTypeDefs = `
      extend type Doctor {
        city:     City
        province: Province 
      }
      extend type Nurse {
        city:     City
        province: Province 
      }
      extend type Drug {
        city:     City
        province: Province 
      }
      extend type Patient {
        city:     City
        province: Province 
      }
      extend type Supplier {
        city:     City
        province: Province 
      }
      extend type User {
        city:     City
      }
      
      
    `

  //const localSchemas = buildSchema(sequelize)

  const schema = mergeSchemas({
    schemas: [
      localSchemas,
      commonSchemas,
      linkTypeDefs
    ],
    resolvers: {
      Doctor: {
        city (obj, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: commonSchemas,
            operation: 'query',
            fieldName: 'city',
            args: {
              id: obj.cityId
            },
            context,
            info
          })
        },
        province (obj, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: commonSchemas,
            operation: 'query',
            fieldName: 'province',
            args: {
              id: obj.proviceId
            },
            context,
            info
          })
        }
      },
      Nurse: {
        city (obj, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: commonSchemas,
            operation: 'query',
            fieldName: 'city',
            args: {
              id: obj.cityId
            },
            context,
            info
          })
        },
        province (obj, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: commonSchemas,
            operation: 'query',
            fieldName: 'province',
            args: {
              id: obj.proviceId
            },
            context,
            info
          })
        }
      },
      Drug: {
        city (obj, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: commonSchemas,
            operation: 'query',
            fieldName: 'city',
            args: {
              id: obj.cityId
            },
            context,
            info
          })
        },
        province (obj, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: commonSchemas,
            operation: 'query',
            fieldName: 'province',
            args: {
              id: obj.proviceId
            },
            context,
            info
          })
        }
      }

    }
  })

  return schema
}

module.exports = {
  mergeSchema
}
