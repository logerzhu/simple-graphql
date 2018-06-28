import { Binding } from 'graphql-binding'
import {remoteSchema} from './remote'
import {toGlobalId, fromGlobalId} from 'graphql-relay'
import {cfg, endPoint} from './endPoints'

const CommonEndpoit = endPoint(cfg.common)

class MyBinding extends Binding {
  constructor (schema) {
    super({
      schema: schema
    })
  }
}

let binding = {
  toGId: (type, id) => toGlobalId(type, id),
  toDbId: (type, id) => {
    const gid = fromGlobalId(id)
    if (gid.type !== type) { throw new Error(`错误的globale id,type:${type},gid:${id} `) }

    return gid.id
  }
}

remoteSchema(CommonEndpoit).then((schema) => {
  binding.commonBinding = new MyBinding(schema)
})

module.exports = binding
