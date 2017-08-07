// @flow
import SG from '../../../../src/index'

const UserType = 'User'
export default SG.schema('UserProfile', {}).fields({
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
