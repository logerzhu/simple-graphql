// @flow
import SG from '../../../../'

const UserType = 'User'
const TodoType = 'Todo'

export default SG.schema('Todo', {
  table: {
    underscored: true
  }
}).fields({
  owner: {
    $type: UserType,
    required: true
  },
  title: {
    $type: String,
    required: true
  },
  description: String,
  completed: {
    $type: Boolean,
    required: true
  },
  dueAt: Date
}).queries({
  dueTodos: {
    description: 'Find all due todos',
    $type: [TodoType],
    config: {
      acl: 'User'
    },
    args: {
      ownerId: {
        $type: UserType,
        required: true
      },
      dueBefore: {
        $type: Date,
        required: true
      }
    },
    resolve: async function ({ownerId, dueBefore}, context, info, {models: {Todo}}) {
      return Todo.find({
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
    inputFields: {
      todoId: {
        $type: TodoType,
        required: true
      }
    },
    outputFields: {
      changedTodo: TodoType
    },
    mutateAndGetPayload: async function ({todoId}, context, info, {models: {Todo}}) {
      const todo = await Todo.findOne({where: {id: todoId}})
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
