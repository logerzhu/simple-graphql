import { PluginOptions } from '../Definition'

export default {
  name: 'timestamp',
  defaultOptions: true,
  priority: 100,
  description: 'Add createdAt/updatedAt field to Schema',
  applyToSchema: (schema, options, schemas) => {
    schema.fields({
      createdAt: {
        $type: 'Date',
        required: false,
        config: {
          initializable: false,
          mutable: false
        }
      },
      updatedAt: {
        $type: 'Date',
        required: false,
        config: {
          initializable: false,
          mutable: false
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
          $type: 'Date',
          required: false,
          config: {
            initializable: false
          }
        }
      })
    }
  }
} as PluginOptions
