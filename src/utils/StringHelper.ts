import * as relay from 'graphql-relay'

export default {
  toInitialUpperCase: (str: string) => {
    return str.substring(0, 1).toUpperCase() + str.substring(1)
  },
  toInitialLowerCase: (str: string) => {
    return str.substring(0, 1).toLowerCase() + str.substring(1)
  },
  toUnderscoredName: (str: string) => {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/^_/, '')
      .toLocaleLowerCase()
  },
  fromGlobalId: (str: string) => {
    try {
      return relay.fromGlobalId(str)
    } catch (e) {
      return { type: '', id: '' }
    }
  }
}
