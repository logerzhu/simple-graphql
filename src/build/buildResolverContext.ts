import { HookConfig, ResolverContext, SGContext } from '../Definition'

export default (
  hooks: Array<HookConfig>,
  sgContext: SGContext
): ResolverContext => {
  const finalHooks = [...hooks].sort((p1, p2) => {
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

  const applyHooks = (action) => {
    let hookFunc = (action, invokeInfo, next) => next()

    ;[...finalHooks].reverse().forEach((hook) => {
      const func = hookFunc
      if (!hook.filter || hook.filter(action)) {
        hookFunc = (action, invokeInfo, next) =>
          hook.hook(
            action,
            invokeInfo,
            func.bind(null, action, invokeInfo, next)
          )
      }
    })
    return hookFunc
  }

  return {
    hookFieldResolve: (name, options) => {
      const action = { type: 'field', name: name, options: options }
      const hookFunc = applyHooks(action)

      return (source, args, context, info) =>
        hookFunc(
          action,
          {
            source: source,
            args: args,
            context: context,
            info: info,
            sgContext: sgContext
          },
          () => options.resolve(source, args, context, info, sgContext)
        )
    },
    hookQueryResolve: (name, options) => {
      const action = { type: 'query', name: name, options: options }
      const hookFunc = applyHooks(action)

      return (source, args, context, info) =>
        hookFunc(
          action,
          {
            source: source,
            args: args,
            context: context,
            info: info,
            sgContext: sgContext
          },
          () => options.resolve(args, context, info, sgContext)
        )
    },
    hookMutationResolve: (name, options) => {
      const action = { type: 'mutation', name: name, options: options }
      const hookFunc = applyHooks(action)

      return (source, args, context, info) =>
        hookFunc(
          action,
          {
            source: source,
            args: args,
            context: context,
            info: info,
            sgContext: sgContext
          },
          () => options.mutateAndGetPayload(args, context, info, sgContext)
        )
    }
  }
}
