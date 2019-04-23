import SG from '../../../src'

export default SG.schema('Dummy', {
  plugin: {
    addMutation: true,
    updateMutation: true,
    deleteMutation: true
  }
}).dataTypes({
  DummyData1: {
    name: 'String',
    data: 'DummyData2'
  },
  DummyData2: [{
    length: 'Number'
  }]
}).fields({
  name: 'String',
  data: 'DummyData1'
})
