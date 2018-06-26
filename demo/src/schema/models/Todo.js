import SG from '../../../../src/index'

// const UserType = SG.modelRef('User')
// const TodoType = SG.modelRef('Todo')

export default SG.schema('Todo',{
  pluralQuery: {
    conditionArgs: {
      owner: {
        userName: String,
        password: String
      }
    }
  }
}).fields({
  owner: 'User',
  title: {
    $type: SG.ScalarFieldTypes.Id,
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
    $type: ['Todo'],
    config: {
      acl: "User"
    },
    args: {
      ownerId: {
        $type: 'User',
        required: true
      },
      dueBefore: {
        $type: Date,
        required: true
      }
    },
    resolve: async function ({ownerId, dueBefore}, context, info, {models:{Todo}}) {
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
        $type: 'Todo',
        required: true
      }
    },
    outputFields: {
      changedTodo:'Todo'
    },
    mutateAndGetPayload: async function ({todoId}, context, info, {models:{Todo}}) {
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
