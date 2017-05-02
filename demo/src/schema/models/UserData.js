//@flow
import GS from '../../../../src'

const UserType = GS.modelRef("User")

export default GS.model("UserData", {}).fields({
  owner: UserType,
  data: {
    $type: String
  }
})