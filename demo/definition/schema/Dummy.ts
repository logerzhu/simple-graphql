import SG from '../../../src'

export default SG.schema('Dummy', {
  plugin: {
    pluralQuery: true,
    addMutation: true,
    updateMutation: true,
    deleteMutation: true
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
  string: {type: 'String'},
  enum: {
    enum: ['A', 'B', 'C']
  },
  enums: {
    elements: {
      enum: ['A', 'B', 'C']
    }
  },
  dummyA: {
    type: 'Dummy'
  },
  dummyB: {
    elements: {type: 'Dummy'}
  },
  dummyC: {
    properties: {
      at: {type: 'Date'},
      enum: {enum: ['A', 'B', 'C']},
      enums: {
        elements: {
          enum: ['A', 'B', 'C']
        }
      },
      dummyE: {
        type: 'Dummy'
      },
      dummyF: {
        elements: {type: 'Dummy'}
      }
    }
  }
})
