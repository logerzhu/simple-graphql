import SG from "../../../src";

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
    $type: new Set(['Male', 'Female'])
  }
});