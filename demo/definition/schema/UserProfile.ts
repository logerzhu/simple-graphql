import {SequelizeSGSchema} from '../../../src'

export default new SequelizeSGSchema('UserProfile', {
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
})
