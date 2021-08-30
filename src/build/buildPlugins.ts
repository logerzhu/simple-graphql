import innerPlugins from '../plugin'
import { SGPluginConfig } from '..'

export default (plugins: Array<SGPluginConfig>): Array<SGPluginConfig> => {
  return [
    ...innerPlugins.map((plugin) => {
      return { ...plugin }
    }),
    ...plugins
  ].sort((p1, p2) => {
    const p1n = p1.priority || 0
    const p2n = p2.priority || 0
    if (p1n < p2n) {
      return 1
    } else if (p1n > p2n) {
      return -1
    } else {
      return 0
    }
  })
}
