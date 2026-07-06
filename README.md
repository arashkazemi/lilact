<img src="./icon.png" alt="Description" width="200" style="margin-left: -.75rem"/>

# Lilact

### A Little React/JSX Runtime Implementation for Browser

[Docs on GitHub Pages](https://arashkazemi.github.io/lilact/) - [Demos on GitHub Pages](https://arashkazemi.github.io/lilact/static)

[Lilact repo on GitHub](https://github.com/arashkazemi/lilact) - [Lilact on npm](https://www.npmjs.com/package/lilact)

---

If you find Lilact useful, please consider sponsoring. Your support funds ongoing maintenance, 
performance improvements, and new features. [Sponsor me on GitHub](https://github.com/sponsors/arashkazemi)

---

`Lilact` is an extremely lightweight implementation of the React API that is
designed to work in the browser. It can be used as a single script
that is around `70kb` minified and around `25kb` gzipped and includes everything.
`Lilact` is very fast, it uses minimum resources and handles memory very efficiently.

`Lilact` uses its own robust JSX transpiler, and not babel. It is a recursive-descent 
parser with lookahead, but it doesn't parse the JS syntax completely and relies on the 
JS runtime to detect some errors. The transpiler weights
only a few kilobytes and can be even incorporated into other React engines. To
make it better, it even generates sourcemaps like a charm, without relying on
any 3rd party library. There is a `transpile.js` helper in the bin directory to
show how you can use it. 

`Lilact` implements both the **legacy class based** and **modern hook based** APIs. And it 
has almost everything  necessary. In addition to the API, it also includes the official 
`Redux` and `PropTypes` libraries to be used (see the `redux.jsx` and `proptypes.jsx` demos). 
So yes it has redux support and has many of the functions and hooks, i.e. `connect` and 
`useDispatch`.

It also includes the amazing `@emotion/css` library to ease working with styles.
It can be accessed through `Lilact.emotion`.

To ease working, it already includes a `HashRouter`, `CSSTransition`, `ErrorBoundary`,
`Suspense`, `Spinner`, and many other stuff. It also has a specific timeout implementation 
that can be paused and resumed at will. `Lilact`'s `Suspense` even has a few more features
than the standard API.

You can see all the methods available in the documentation. And there is a list of
demos that can all be seen alongside their code at [Lilact Demo Examples](./static/index.html).
Just note that the modules are separated in the documentation to improve the doc
structure, and in practice all the methods and members are accessible via the `Lilact` object 
itself directly.

`Lilact` runs in the browser, so it uses `eval` to run the transpiled scripts, and cannot 
use import and exports the same as a module. So you should import the functions using the following 
convention

        const { useState, useRef, render } = Lilact;

And to export you can use `module.exports = ...`. 


---

To use in other node projects, install `Lilact` from npm public repository:

        npm install lilact  

It is also available via unpkg CDN and can be included in HTML files using

        <script src="https://unpkg.com/lilact/dist/lilact.development.min.js"></script>

or

        <script src="https://unpkg.com/lilact/dist/lilact.production.min.js"></script>


To use in a webpage, first download the source code and extract it. The minified 
script itself is available in the `/dist` directory and the documentation 
can be found in the `/docs` and also in the source files. 

Note that the production version, like the official React API, doesn't do the proptypes 
checks, but you can access PropTypes using Lilact.PropTypes. 

After being loaded, Lilact automatically scans the document for any scirpt elements
with `type='text/jsx'` and it will run them. If the `src` attribute is set it will load
the resource, and if there is inner content it will be executed. Of course this is not the 
only way.

Lilact wraps the browser events to mimic React events, this mimicry is not perfect, as 
the footprint was very important, but it works fine. 

As a simple example Lilact can be used like this:

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


To know more about using `Lilact`, see the included example and for the details
see the class documentation. And of course don't forget to check the 
[Lilact Demo Examples](./static/index.html).

`Lilact` is currently in its beta state. It is under heavy tests and improvements are 
being made. Please report any possible issues or bugs, they will be fixed
without any hesitation! 

--------

Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>. All rights reserved.

Lilact project is subject to the terms of BSD-2-Clause License. See the `LICENSE.TXT` file for more details.

<style>.tsd-page-title{display: none}</style>
