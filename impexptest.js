// Imports
import foo from "foo";
import { a, b } from "foo";
import {a as alpha, b as beta} from "foo";
import * as utils from "foo";
import foo, { a, b as c, d } from "foo";
import "foo";

// Re-exports from other modules
export * from "foo";
export { a, b } from "foo";
export { default as Foo } from "foo";

export * from "./some-module.js";
export { exportedThing } from "./another-module.js";
export { default as depDefault } from "./yet-another-module.js";
export { default as depDefault, a, b, c as depC } from "./...";

// Default export forms
const defaultValue = { ok: true };
export default defaultValue;

export default function defaultFn() {
  return "defaultFn";
}

export default class DefaultClass {
  constructor() {}
}


export {localA as a, localB as b, localC as c};


export { localFn as renamedFn };

// Additional named exports (declared bindings)
export const namedConst = 1;
export let namedLet = 2;
export var namedVar = 3;

export function namedFn() {
  return "namedFn";
}


export class NamedClass {}

// Re-exporting local bindings is OK (examples)
export defaultValue;
export { defaultValue };
