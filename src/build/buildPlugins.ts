import innerPlugins from '../plugin'
import { PluginConfig } from '../index'

export default (plugins: Array<PluginConfig>): Array<PluginConfig> => {
  return [...innerPlugins, ...plugins]
    .sort((p1, p2) => {
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
    .map((plugin) => {
      return { ...plugin }
    })
}
