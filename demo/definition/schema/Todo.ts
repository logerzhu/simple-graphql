import {SequelizeSGSchema} from '../../../src'

export default new SequelizeSGSchema('Todo', {
  tableOptions: {
    underscored: true
  },
  plugin: {
    addMutation: {
      enable:true
    },
    bulkAddMutation: {
      enable:true
    },
    singularQuery: {
      enable:true
    },
    pluralQuery: {
      enable:true
    }
  }
}).fields({
  owner: {
    type: 'User',
    nullable: false
  },
  title: {
    type: 'String',
    nullable: false
  },
  description: {type: 'String'},
  completed: {
    type: 'Boolean',
    nullable: false
  },
  tags: {elements:{type:'String'}},
  dueAt: {type: 'Date'}
}).queries({
  dueTodos: {
    description: 'Find all due todos',
    output: {
      elements: {type: 'Todo'}
    },
    input: {
      ownerId: {
        type: 'UserId',
        nullable: false
      },
      dueBefore: {
        type: 'Date',
        nullable: false
      }
    },
    resolve: async function ({
                               ownerId,
                               dueBefore
                             }, context, info, {
                               models: {
                                 Todo
                               }
                             }) {
      return Todo.findAll({
        where: {
          completed: false,
          ownerId: ownerId,
          dueAt: {
            $lt: dueBefore
          }
        }
      })
    }
  }
}).mutations({
  completedTodo: {
    description: 'Mark the todo task completed.',
    input: {
      todoId: {
        type: 'Todo',
        nullable: false
      }
    },
    output: {
      changedTodo: {type: 'Todo'}
    },
    mutateAndGetPayload: async function ({
                                           todoId
                                         }, context, info, {
                                           models: {
                                             Todo
                                           }
                                         }) {
      const todo: any = await Todo.findOne({where: {id: todoId}})
      if (!todo) {
        throw new Error('Todo entity not found.')
      }
      if (!todo.completed) {
        todo.completed = true
        await todo.save()
      }
      return {changedTodo: todo}
    }
  }
})
