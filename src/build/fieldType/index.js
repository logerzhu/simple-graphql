// @flow
import type { FieldType } from '../../Definition'

import Id from './Id'
import Integer from './Integer'
import Boolean from './Boolean'
import Date from './Date'
import JSON from './JSON'
import Number from './Number'
import StringField from './String'

export default ({
  Id: Id,
  Integer: Integer,
  Boolean: Boolean,
  Date: Date,
  JSON: JSON,
  Number: Number,
  'String': StringField
}: { [id: string]: FieldType })
