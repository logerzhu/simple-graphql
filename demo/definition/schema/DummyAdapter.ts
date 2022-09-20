import {BaseSGSchema} from "../../../dist";

export default new BaseSGSchema('DummyAdapter', {
  plugin: {
    pluralQuery: {
      enable: true
    },
    addMutation: {
      enable: true
    },
    updateMutation: {
      enable: true
    },
    deleteMutation: {
      enable: true
    }
  }
}).fields({
  message: {type: 'Message'},
  number: {type: 'Number'},
  numbers: {
    elements: {type: 'Number'}
  },
  boolean: {
    type: 'Boolean',
    nullable: true
  },
  booleans: {
    elements: {
      type: 'Boolean'
    },
    nullable: true
  },
  date: {type: 'Date'},
  integer: {type: 'Integer'},
  string: {type: 'String'}
})
