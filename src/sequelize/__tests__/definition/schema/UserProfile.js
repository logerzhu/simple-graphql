import SG from '../../../../'

export default SG.schema('UserProfile', {
  plugin: {
    singularQuery: true
  }
}).fields({
  owner: {
    $type: 'User',
    required: true
  },
  realName: 'String',
  age: 'Integer',
  gender: {
    $type: ['Male', 'Female']
  }
})
