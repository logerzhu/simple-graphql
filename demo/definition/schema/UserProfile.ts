import {SGSchema} from '../../../src'

export default new SGSchema('UserProfile', {
  plugin: {
    singularQuery: {
      enable: true
    }
  }
}).fields({
  owner: {
    type: 'User',
    nullable: false
  },
  realName: {type: 'String'},
  age: {type: 'Integer'},
  gender: {
    enum: ['Male', 'Female']
  }
}).subscriptions({
  greetings: {
    description: 'Find all due todos',
    output: {
      type: 'String'
    },
    input: {
      name: {
        type: 'String',
        nullable: true
      }
    },
    resolve: async (root) => {
      console.log("--", root)
      return root.greetings
    },
    subscribe: async function* ({name}) {
      for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
        yield  hi + " " + name
      }
    }
  }
})
