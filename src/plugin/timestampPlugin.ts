import { SGSchema, SGPluginConfig, SGPluginOptions } from '../index'

declare module '../index' {
  export interface SGPluginOptionsMap {
    timestamp?: SGPluginOptions
  }
}

export default {
  name: 'timestamp',
  defaultOptions: {
    enable: true
  },
  priority: 100,
  description: 'Add createdAt/updatedAt field to Schema',
  applyToSchema: (schema, options, schemas) => {
    if (schema instanceof SGSchema) {
      schema.fields({
        createdAt: {
          type: 'Date',
          nullable: true,
          metadata: {
            graphql: {
              initializable: false,
              updatable: false
            }
          }
        },
        updatedAt: {
          type: 'Date',
          nullable: true,
          metadata: {
            graphql: {
              initializable: false,
              updatable: false
            }
          }
        }
      })

      if (schema.options?.tableOptions?.paranoid) {
        schema.fields({
          deletedAt: {
            type: 'Date',
            nullable: true,
            metadata: {
              graphql: {
                initializable: false,
                updatable: false
              }
            }
          }
        })
      }
    }
  }
} as SGPluginConfig
