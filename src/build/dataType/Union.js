// @flow
import type { DataTypeOptions } from '../../Definition'
import Sequelize from 'sequelize'

export default ({
  name: 'Union',
  $type: {
    type: 'String',
    value: 'JSON'
  },
  description: 'Union type',
  columnOptions: { type: Sequelize.JSON }
}: DataTypeOptions)
