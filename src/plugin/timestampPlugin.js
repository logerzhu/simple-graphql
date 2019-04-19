// @flow
import type { Plugin } from '../Definition'

export default ({
  key: 'timestamp',
  defaultOptions: true,
  priority: 100,
  description: 'Add createdAt/updatedAt field to Schema',
  apply: (schema, options) => {
    schema.fields({
      createdAt: {
        $type: 'Date',
        config: {
          initializable: false,
          mutable: false
        }
      },
      updatedAt: {
        $type: 'Date',
        config: {
          initializable: false,
          mutable: false
        }
      }
    })

    if (schema.config.options && schema.config.options.table && schema.config.options.table.paranoid) {
      schema.fields({
        deletedAt: {
          $type: 'Date',
          config: {
            initializable: false
          }
        }
      })
    }
  }
}: Plugin)
