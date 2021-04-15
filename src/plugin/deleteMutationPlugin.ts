import StringHelper from '../utils/StringHelper'
import { SGHookOptionsMap, SGPluginConfig, SGPluginOptions } from '..'

type DeleteMutationOptions = SGPluginOptions & {
  name?: string
  hookOptions?: SGHookOptionsMap
}

declare module '..' {
  export interface SGPluginOptionsMap {
    deleteMutation?: DeleteMutationOptions
  }
}

export default {
  name: 'deleteMutation',
  defaultOptions: {
    enable: false
  },
  priority: 0,
  description: 'Gen `delete mutation` for Schema',
  applyToSchema: function (schema, options, schemas): void {
    const name = 'delete' + StringHelper.toInitialUpperCase(schema.name)
    const { enable, ...config } = options
    schema.mutations({
      [config.name || name]: {
        hookOptions: config.hookOptions,
        input: {
          id: {
            type: schema.name + 'Id',
            nullable: false
          }
        },
        output: {
          ['deleted' + schema.name]: { type: schema.name }
        },
        mutateAndGetPayload: async function ({ id }, context, info, sgContext) {
          const entity = await sgContext.models[schema.name].findOne({
            where: { id: id }
          })
          if (entity) {
            await entity.destroy()
            return {
              ['deleted' + schema.name]: entity
            }
          }
          throw new Error(schema.name + '[' + id + '] not exist.')
        }
      }
    })
  }
} as SGPluginConfig<DeleteMutationOptions>
