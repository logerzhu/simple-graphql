import { PluginConfig, PluginOptions } from '../Definition'

declare module '../Definition' {
  export interface PluginOptionsMap {
    timestamp?: PluginOptions
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
} as PluginConfig
