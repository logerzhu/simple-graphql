import SG from "../../../src";

export default SG.schema('Dummy', {
    plugin: {
        pluralQuery: true,
        addMutation: true,
        updateMutation: true,
        deleteMutation: true
    }
}).fields({
    message: 'Message',
    number: 'Number',
    numbers: ['Number'],
    boolean: {
        $type: 'Boolean',
        required: false
    },
    booleans: {
        $type: ['Boolean'],
        required: false
    },
    date: 'Date',
    integer: 'Integer',
    string: 'String',
    enum: new Set(['A', 'B', 'C']),
    enums: [new Set(['A', 'B', 'C'])],
    dummyA: 'Dummy',
    dummyB: ['Dummy'],
    dummyC: {
        at: 'Date',
        enum: new Set(['A', 'B', 'C']),
        enums: [new Set(['A', 'B', 'C'])],
        dummyE: 'Dummy',
        dummyF: ['Dummy']
    }
});