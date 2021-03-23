import { PluginOptions } from '../Definition'

export default {
  name: 'timestamp',
  defaultOptions: true,
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

    if (
      schema.config.options &&
      schema.config.options.tableOptions &&
      schema.config.options.tableOptions.paranoid
    ) {
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
} as PluginOptions
