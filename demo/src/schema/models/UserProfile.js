import SG from '../../../../src/index'

// const UserType = SG.modelRef('User')
export default SG.schema('UserProfile', {
  description: 'dd'
}).fields({
  owner: {
    $type: 'User',
    required: true
  },
  realName: String,
  age: SG.ScalarFieldTypes.Int,
  gender: {
    $type: String,
    enumValues: ['Male', 'Female']
  }
})
