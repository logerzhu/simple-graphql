import SG from '../../../../'

const UserType = 'User'
export default SG.schema('UserProfile', {
  plugin: {
    singularQuery: true
  }
}).fields({
  owner: {
    $type: UserType,
    required: true
  },
  realName: String,
  age: SG.ScalarFieldTypes.Int,
  gender: {
    $type: String,
    enumValues: ['Male', 'Female']
  }
})
