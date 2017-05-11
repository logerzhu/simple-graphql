// @flow
import SG from '../../../../src/index'

const UserType = SG.modelRef('User')
export default SG.model('UserProfile', {}).fields({
  owner: {
    $type: UserType,
    required: true
  },
  realName: String,
  age: SG.ScalarFieldTypes.Int,
  genderAS: {
    $type: String,
    enumValues: ['Male', 'Female']
  }
})
