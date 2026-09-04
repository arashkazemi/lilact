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
import Lilact from "./lilact.jsx";
import { isEmpty } from "./misc.jsx";
import { LAZY } from "./symbols.jsx";
import { injectGlobal } from "@emotion/css";

function joinPaths(basePath, relativePath) {
  const absolute = relativePath.startsWith("/");
  const parts = (absolute ? "" : basePath)
    .split("/")
    .filter(Boolean);

  if (!absolute && !basePath.endsWith("/")) parts.pop();

  for (const part of relativePath.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }

  return `${absolute ? "/" : ""}${parts.join("/")}`;
}

function asError(value, fallback = "Unknown error") {
  if (value instanceof Error) return value;
  if (value?.error instanceof Error) return value.error;

  const error = new Error(
    value?.message == null ? fallback : String(value.message)
  );

  if (value && typeof value === "object") {
    if (value.name) error.name = value.name;
    if (value.stack) error.stack = value.stack;

    for (const key of Object.keys(value)) {
      if (!(key in error)) error[key] = value[key];
    }
  }

  return error;
}

function markSource(value, path) {
  const error = asError(value);

  if (!error.lilact_source) {
    error.lilact_source = { path };
  }

  return error;
}
function report(error, path) {
  const marked = markSource(error, path);

  if (marked.isTraced) return marked;

  if (typeof Lilact.traceError === "function") {
    return Lilact.traceError(marked, path);
  }

  Lilact.error = marked;
  return marked;
}

export const required_scripts = {};

export function run(
  jsx,
  path = `InlineJSX-${++Lilact.eval_num}`,
  {
    isInline = true,
    isModule = true,
  } = {}
) {
  const module = {
    mappings: [],
    isInline,
    isModule,
    path,
    code: String(jsx),
    exports: {},
  };

  required_scripts[path] = module;

  let processed;

  try {
    processed = Lilact.transpileJSX(String(jsx), {
      path,
      mappings: module.mappings,
      factory: "createComponent",
      appendSourcemap: false,
      injectTraceLabels: true,
      produceCJS: true,
      blocks_info: Lilact.blocks_info,
    });
  } catch (error) {
    const parser = asError(error);
    parser.fileName ??= path;
    parser.sourcePhase = "transpile";
    module.error = parser;
    Lilact.error = parser;
    throw parser;
  }

  processed += `\n//# sourceURL=eval:/${path}`;

  if (typeof Lilact.scanBlockLabels === "function") {
    Lilact.scanBlockLabels(processed, path);
  }

  try {
    globalThis.Lilact = Lilact;
    globalThis.createComponent = Lilact.createComponent;
    globalThis.Fragment = Lilact.Fragment;

    const result = eval(processed);

    return isEmpty(module.exports)
      ? result
      : module.exports;
  } catch (error) {
    const runtime = report(error, path);
    runtime.sourcePhase = "runtime";
    module.error = runtime;
    throw runtime;
  }
}

export function require(path) {
  let options = {};

  if (
    arguments.length === 2 &&
    arguments[1] &&
    typeof arguments[1] === "object"
  ) {
    options = arguments[1];
  }

  if (Lilact.importObjectPaths?.[path]) {
    return Lilact.importObjectPaths[path];
  }

  if (required_scripts[path] && !options.forceUpdate) {
    return required_scripts[path].exports;
  }

  if (path[0] === "#") {
    const element = document.getElementById(path.slice(1));

    if (!element) {
      const error = new Error(
        `Required element not found (${path})`
      );
      throw report(error, path);
    }

    return run(element.textContent || "", path);
  }

  if (options.requirer?.path) {
    path = joinPaths(options.requirer.path, path);
  }

  const loadAsync =
    Boolean(Lilact?.[LAZY]) ||
    Boolean(options.isLazy);

  if (loadAsync) {
    Lilact[LAZY] = false;

    let request = Lilact.resolver?.(path);

    if (request == null) {
      request = fetch(path).then(response => {
        if (!response.ok) {
          throw report(
            new Error(
              `Unable to load ${path}: HTTP ${response.status}`
            ),
            path
          );
        }

        return response.text();
      });
    } else {
      request = Promise.resolve(request);
    }

    return request
      .then(source => {
        if (path.endsWith(".css")) {
          injectGlobal(String(source));
          return;
        }

        return run(String(source), path, {
          isInline: false,
          isModule: true,
        });
      })
      .then(result =>
        path.endsWith(".css") ? result : result?.default ?? result
      )
      .catch(error => {
        throw report(error, path);
      });
  }

  const resolved = Lilact.resolver?.(path);

  if (resolved != null) {
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
    throw report(error, path);
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

  throw report(
    new Error(`Unable to load ${path}: HTTP ${request.status || 0}`),
    path
  );
}

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
      module => {
        status = "success";
        result = module;
      },
      error => {
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

function scriptTags() {
  return Array.from(
    document.querySelectorAll('script[type="text/jsx"]')
  ).map(element => ({
    src: element.getAttribute("src"),
    content: element.textContent || "",
  }));
}

export function runScripts() {
  for (const script of scriptTags()) {
    if (script.src) require(script.src);
    if (script.content) run(script.content);
  }
}
