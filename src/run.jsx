/*

	Lilact
	Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>
	All rights reserved.

	BSD-2-Clause

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	* Redistributions of source code must retain the above copyright
		notice, this list of conditions and the following disclaimer.
	* Redistributions in binary form must reproduce the above copyright
		notice, this list of conditions and the following disclaimer in the
		documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
/*
Lilact
Copyright (C) 2024-2026 Arash Kazemi
BSD-2-Clause
*/

import Lilact from "./lilact.jsx";
import { isEmpty } from "./misc.jsx";
import { LAZY } from "./symbols.jsx";
import { injectGlobal } from "@emotion/css";

function joinPaths(basePath, relativePath) {
  const isAbsolute = relativePath.startsWith("/");
  const stack = [];

  const parts = (isAbsolute ? "" : basePath)
    .split("/")
    .filter(Boolean);

  for (const part of parts) {
    stack.push(part);
  }

  if (!basePath.endsWith("/")) {
    stack.pop();
  }

  for (const part of relativePath.split("/")) {
    if (part === "" || part === ".") continue;

    if (part === "..") {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }

  return `${isAbsolute ? "/" : ""}${stack.join("/")}`;
}

function asError(value, fallbackMessage = "Unknown error") {
  if (value instanceof Error) return value;

  if (value && typeof value === "object") {
    if (value.error instanceof Error) return value.error;

    const error = new Error(
      value.message == null ? fallbackMessage : String(value.message)
    );

    if (value.name) error.name = value.name;

    if (value.stack) {
      Object.defineProperty(error, "stack", {
        value: value.stack,
        configurable: true,
      });
    }

    for (const key of Object.keys(value)) {
      if (!(key in error)) error[key] = value[key];
    }

    return error;
  }

  return new Error(
    value == null ? fallbackMessage : String(value)
  );
}

function attachPath(error, path) {
  const result = asError(error);

  if (result.fileName == null) result.fileName = path;

  return result;
}

function reportRuntimeError(error, path) {
  const withPath = attachPath(error, path);

  /*
   * lilact.jsx may expose traceError on the public namespace. Avoid a
   * static import here because errors.jsx already imports run.jsx.
   */
  if (typeof Lilact.traceError === "function") {
    return Lilact.traceError(withPath, path);
  }

  Lilact.error = withPath;
  return withPath;
}

/** @ignore */
export const required_scripts = {};

/**
 * Transpiles and evaluates one JSX module.
 */
export function run(
  jsx,
  path = `InlineJSX-${++Lilact.eval_num}`,
  {
    isInline = true,
    isModule = true,
  } = {}
) {
  const mappings = [];

  const module = {
    mappings,
    isInline,
    isModule,
    path,
    code: String(jsx),
    exports: {},
  };

  /*
   * Register the module before transpiling. This makes the original source
   * available if transpilation or evaluation fails.
   */
  required_scripts[path] = module;

  let processed;

  try {
    processed = Lilact.transpileJSX(String(jsx), {
      path,
      mappings,
      factory: "createComponent",
      appendSourcemap: false,
      injectTraceLabels: true,
      produceCJS: true,
      blocks_info: Lilact.blocks_info,
    });
  } catch (error) {
    const parserError = attachPath(error, path);
    parserError.sourcePhase = "transpile";
    module.error = parserError;
    Lilact.error = parserError;
    throw parserError;
  }

  if (typeof DEBUG !== "undefined" && DEBUG) {
    module.processed = processed;
  }

  /*
   * The sourceURL must be the final source directive in the evaluated
   * program. Browsers use it differently, but this format works for the
   * common eval stack formats.
   */
  processed = `${processed}\n//# sourceURL=eval:/${path}`;

  /*
   * Register block labels using the exact processed source that will be
   * evaluated.
   */
  if (typeof Lilact.scanBlockLabels === "function") {
    Lilact.scanBlockLabels(processed, path);
  }

  try {
    globalThis.Lilact = Lilact;
    globalThis.createComponent = Lilact.createComponent;
    globalThis.Fragment = Lilact.Fragment;

    /*
     * This must remain a direct eval. Indirect eval changes the scope and
     * breaks the module runtime.
     */
    const result = eval(processed);

    if (!isEmpty(module.exports)) {
      return module.exports;
    }

    return result;
  } catch (error) {
    const runtimeError = reportRuntimeError(error, path);
    runtimeError.sourcePhase = "runtime";
    module.error = runtimeError;
    throw runtimeError;
  }
}

/**
 * Synchronously or asynchronously loads a JSX, JavaScript, or CSS resource.
 */
export function require(path) {
  let forceUpdate;
  let checkExport;
  let requirer;
  let isLazy;

  if (
    arguments.length === 2 &&
    arguments[1] &&
    typeof arguments[1] === "object"
  ) {
    forceUpdate = arguments[1].forceUpdate;
    checkExport = arguments[1].checkExport;
    requirer = arguments[1].requirer;
    isLazy = arguments[1].isLazy;
  }

  if (Lilact.importObjectPaths?.[path]) {
    return Lilact.importObjectPaths[path];
  }

  if (required_scripts[path] && !forceUpdate) {
    return required_scripts[path].exports;
  }

  if (path[0] === "#") {
    const element = document.getElementById(path.slice(1));

    if (!element) {
      const error = new Error(
        `Required element not found (${path})`
      );
      error.fileName = path;
      throw error;
    }

    return run(element.textContent || "", path);
  }

  if (requirer?.path) {
    path = joinPaths(requirer.path, path);
  }

  const loadAsync =
    Boolean(Lilact?.[LAZY]) || Boolean(isLazy);

  if (loadAsync) {
    Lilact[LAZY] = false;

    let request = Lilact.resolver?.(path);

    if (request === undefined || request === null) {
      request = fetch(path).then((response) => {
        if (!response.ok) {
          const error = new Error(
            `Unable to load ${path}: HTTP ${response.status}`
          );
          error.fileName = path;
          throw error;
        }

        return response.text();
      });
    } else {
      request = Promise.resolve(request);
    }

    return request
      .then((source) => {
        if (path.endsWith(".css")) {
          injectGlobal(String(source));
          return;
        }

        return run(String(source), path, {
          isInline: false,
          isModule: true,
        });
      })
      .then((result) => {
        if (path.endsWith(".css")) return result;
        return result?.default ?? result;
      })
      .catch((error) => {
        throw reportRuntimeError(error, path);
      });
  }

  const resolved = Lilact.resolver?.(path);

  if (resolved !== undefined && resolved !== null) {
    if (path.endsWith(".css")) {
      injectGlobal(String(resolved));
      return;
    }

    return run(String(resolved), path, {
      isInline: false,
      isModule: true,
    });
  }

  const request = new XMLHttpRequest();

  try {
    request.open("GET", path, false);
    request.send(null);
  } catch (error) {
    throw reportRuntimeError(error, path);
  }

  if (request.status >= 200 && request.status < 300) {
    if (path.endsWith(".css")) {
      injectGlobal(request.responseText);
      return;
    }

    return run(request.responseText, path, {
      isInline: false,
      isModule: true,
    });
  }

  const error = new Error(
    `Unable to load ${path}: HTTP ${request.status || 0}`
  );
  error.fileName = path;
  throw error;
}

/**
 * Enables async, code-split component loading.
 */
export function lazy(factory) {
  let status = "pending";
  let result;

  Lilact[LAZY] = true;

  try {
    result = factory();
  } catch (error) {
    status = "error";
    result = error;
  }

  if (Lilact.isThenable(result)) {
    result.then(
      (module) => {
        status = "success";
        result = module;
      },
      (error) => {
        status = "error";
        result = error;
      }
    );
  } else if (status !== "error") {
    status = "success";
  }

  function LazyComponent(props) {
    if (status === "pending") throw result;
    if (status === "error") throw result;

    const Component = result;
    return <Component {...props} />;
  }

  return LazyComponent;
}

function scanScriptTagsWithType() {
  return Array.from(
    document.querySelectorAll('script[type="text/jsx"]')
  ).map((element) => ({
    src: element.getAttribute("src"),
    content: element.textContent || "",
  }));
}

export function runScripts() {
  for (const script of scanScriptTagsWithType()) {
    if (script.src) require(script.src);
    if (script.content) run(script.content);
  }
}
