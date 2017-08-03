// flow-typed signature: 2e335a00f94019d205048111107c60e8
// flow-typed version: 01f71def02/continuation-local-storage_v3.x.x/flow_>=v0.25.x

declare type Context = Object;

declare class Namespace {
  active(): Context;
  set<T>(key: string, value: T): T;
  get(key: string): any;
  run(callback: Function): Context;
  runAndReturn<T>(callback: (...arguments: Array<any>) => T): T;
  bind(callback: Function): Function;
  bindEmitter(emitter: events$EventEmitter): void;
  createContext(): Context
}

declare class ContinuationLocalStorage {
  createNamespace(name: string): Namespace;
  getNamespace(name: string): Namespace;
  destroyNamespace(name: string): void;
  reset(): void;
}

declare module "continuation-local-storage" {
  declare module.exports: ContinuationLocalStorage;
}
