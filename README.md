<img src="./icon.png" alt="Description" width="128" style="margin-left: -.76rem"/>

# Lilact

### A Little React/JSX Runtime Implementation for the Browser

---

[Docs on GitHub Pages](https://arashkazemi.github.io/lilact/) — [Demos on GitHub Pages](https://arashkazemi.github.io/lilact/static)

[Lilact repo on GitHub](https://github.com/arashkazemi/lilact) — [Lilact on npm](https://www.npmjs.com/package/lilact)

[Lilact/Node/Express Demo Project](https://github.com/arashkazemi/lilact-express) — [Lilact/PHP Demo Project](https://github.com/arashkazemi/lilact-php-demo) — [Lilact/Python Demo Project](https://github.com/arashkazemi/lilact-python-demo)

---

If you find Lilact useful, please consider sponsoring. Your support funds ongoing maintenance, performance improvements, and new features.  
[Sponsor me on GitHub](github.com/sponsors/arashkazemi)

---

## Overview

`Lilact` is a very lightweight implementation of the React API designed to run in the browser. It can be used as a single script that is around `80kb` minified and around `27kb` gzipped, and includes its whole API.

`Lilact` is very fast, uses minimal resources, and handles memory very efficiently.

In a Node.js environment, `Lilact` can be incorporated and imported similarly to React, and it can also be used as a static library in other platforms.

---

## JSX Transpiler

`Lilact` uses its own JSX transpiler (not Babel). It is a recursive-descent parser with lookahead. It doesn’t parse the full JavaScript syntax and instead relies on the JS runtime to detect some errors.

The transpiler is only a few kilobytes and can be incorporated into other React engines as well. It even generates sourcemaps without relying on any third-party library.

There is a `transpile.js` helper in the `bin` directory to demonstrate how to use it.

---

## React APIs, Libraries, and Built-in Components

`Lilact` implements both the **legacy class-based** API and the **modern hook-based** API, and it includes almost everything you need.

In addition to the API itself, it bundles the official `Redux` and `PropTypes` libraries (see the `redux.jsx` and `proptypes.jsx` demos). As a result, it has Redux support and provides many functions and hooks, including `connect` and `useDispatch`.

It also includes the amazing `@emotion/css` library to ease working with styles. You can access it via `Lilact.emotion`.

For convenience, it already includes components such as:

- `HashRouter`
- `CSSTransition`
- `ErrorBoundary`
- `Suspense`

and helper components like:

- `Spinner`
- `ResizablePane`

It also includes a specific timeout implementation that can be paused and resumed at will. `Lilact`’s `Suspense` includes additional features beyond the standard API.

You can see all available members and methods in the documentation. There is also a list of demos you can view alongside their code at:  
[Lilact Demo Examples](https://arashkazemi.github.io/lilact/static)

Note: modules are separated in the documentation to improve structure, but in practice all members and methods are accessible directly via the `Lilact` object.

---

## Webpack-based Bundler

A `webpack` based bundler is available in the `bin` directory. It can be used like this:

```bash
npx lilact-bundle --entry client/App.jsx --mode production --name bundle.js --out public/dist
```

---

## Using Lilact Outside Node.js (Browser / Script Tag Integration)

`Lilact` runs in the browser, so if you use `Lilact` outside Node, it uses `eval` to run the transpiled scripts, so it cannot use `import`/`export` the same way as a module.

Import the functions using this convention:

```js
const { useState, useRef, render } = Lilact;
```

To export:

```js
module.exports = ...
```

Bundled projects can also be used statically on other backends. However, bundling is not required: JSX files can be served and transpiled live.

A complete example of a `Lilact` project with an `express` request handler is available at:  
[lilact-express](https://github.com/arashkazemi/lilact-express)

An example using it with a PHP/MySQL data store is available at:  
[lilact-php-demo](https://github.com/arashkazemi/lilact-php-demo)

An example using it with a Python/SQLite data store is available at:  
[lilact-python-demo](https://github.com/arashkazemi/lilact-python-demo)

---

## Installation and Delivery

### Node.js (npm)
To use `Lilact` in other Node projects, install it from the npm public repository:

```bash
npm i lilact
```

### Browser / Static (dist + CDN)
To use `Lilact` in a webpage, first download the source code and extract it. The minified script itself is available in the `/dist` directory, and the documentation can be found in `/docs` and also in the source files.

It is also available via unpkg CDN and can be included in HTML like:

```html
<script src="https://unpkg.com/lilact/dist/lilact.development.min.js"></script>
```

or

```html
<script src="https://unpkg.com/lilact/dist/lilact.production.min.js"></script>
```

Note: the production version, like the official React API, doesn’t perform PropTypes checks, but you can access PropTypes using `Lilact.PropTypes`.

After loading, `Lilact` automatically scans the document for any script elements with `type='text/jsx'` and runs them. If the `src` attribute is present on the script, it will load the resource; if the script contains inner content, it will be executed.

This is not the only way to use it—inside Node projects you can use standard module imports and treat `Lilact` like a normal module.

`Lilact` wraps browser events to mimic React events. This mimicry is not perfect on some edge cases (because the footprint was important), but it works well overall.

---

## Example

### Node.js example

```js
import { render } from "lilact";

function App() {
  return <div>Hello World</div>;
}

render(<App/>, document.body);
```

### Outside Node.js (e.g., PHP / Python integration)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Lilact Demo</title>
  <script src='./lilact.development.min.js' type="module"></script>
</head>
<body></body>
<script type='text/jsx'>
  const { render } = Lilact;

  function App() {
    return <div>Hello World</div>;
  }
  
  render(<App/>, document.body);
</script>
</html>
```

---

## Learn More / Demos / Beta Status

To know more about using `Lilact`, see the included examples:  
[Lilact Demo Examples](https://arashkazemi.github.io/lilact/static)

For the details, see the documentation.

`Lilact` is currently in its beta state. It is under heavy testing and improvements are being made. Please report any possible issues or bugs—They will be fixed without any hesitation!

---

Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>. All rights reserved.

Lilact project is subject to the terms of BSD-2-Clause License. See the `LICENSE.TXT` file for more details.

<style>.tsd-page-title{display: none}</style>
