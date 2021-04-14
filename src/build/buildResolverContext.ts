import {
  HookConfig,
  HookFunc,
  HookTarget,
  ResolverContext,
  SGContext
} from '../Definition'

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

  const applyHooks = (target: HookTarget) => {
    let hookFunc: HookFunc = (target, invokeInfo, next) => next()

    ;[...finalHooks].reverse().forEach((hook) => {
      const func = hookFunc
      const hookTarget = {
        ...target,
        options: target.targetConfig.hookOptions?.[hook.key]
      }
      if (hook.filter == null || hook.filter(hookTarget)) {
        hookFunc = (target, invokeInfo, next) =>
          hook.hook(
            hookTarget,
            invokeInfo,
            func.bind(null, target, invokeInfo, next)
          )
      }
    })
    return hookFunc
  }

  return {
    hookFieldResolve: (name, options) => {
      const target: HookTarget = {
        type: 'field',
        name: name,
        targetConfig: options
      }
      const hookFunc = applyHooks(target)

      return (source, args, context, info) =>
        hookFunc(
          target,
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
      const target: HookTarget = {
        type: 'query',
        name: name,
        targetConfig: options
      }
      const hookFunc = applyHooks(target)

      return (source, args, context, info) =>
        hookFunc(
          target,
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
      const target: HookTarget = {
        type: 'mutation',
        name: name,
        targetConfig: options
      }
      const hookFunc = applyHooks(target)

      return (source, args, context, info) =>
        hookFunc(
          target,
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
