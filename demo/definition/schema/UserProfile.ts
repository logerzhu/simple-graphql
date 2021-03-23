import SG from '../../../src'

export default SG.schema('UserProfile', {
  plugin: {
    singularQuery: true
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
