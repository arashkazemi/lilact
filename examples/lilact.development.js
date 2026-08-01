/*!
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

--------------------------------------------------------------------------------

Lilact also includes the following libraries accessible as members of 
the Lilact object:

@emotion/css:
Copyright (c) Emotion team and other contributors
MIT License

redux:
Copyright (c) 2015-present Dan Abramov
MIT License


* MIT License Notice:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

--------------------------------------------------------------------------------

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

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/redux/dist/redux.mjs
var redux_exports = {};
__export(redux_exports, {
  __DO_NOT_USE__ActionTypes: () => actionTypes_default,
  applyMiddleware: () => applyMiddleware,
  bindActionCreators: () => bindActionCreators,
  combineReducers: () => combineReducers,
  compose: () => compose,
  createStore: () => createStore,
  isAction: () => isAction,
  isPlainObject: () => isPlainObject,
  legacy_createStore: () => legacy_createStore
});
var $$observable = /* @__PURE__ */ (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
var symbol_observable_default = $$observable;
var randomString = () => Math.random().toString(36).substring(7).split("").join(".");
var ActionTypes = {
  INIT: `@@redux/INIT${/* @__PURE__ */ randomString()}`,
  REPLACE: `@@redux/REPLACE${/* @__PURE__ */ randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
};
var actionTypes_default = ActionTypes;
function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null)
    return false;
  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null;
}
function miniKindOf(val) {
  if (val === void 0)
    return "undefined";
  if (val === null)
    return "null";
  const type = typeof val;
  switch (type) {
    case "boolean":
    case "string":
    case "number":
    case "symbol":
    case "function": {
      return type;
    }
  }
  if (Array.isArray(val))
    return "array";
  if (isDate(val))
    return "date";
  if (isError(val))
    return "error";
  const constructorName = ctorName(val);
  switch (constructorName) {
    case "Symbol":
    case "Promise":
    case "WeakMap":
    case "WeakSet":
    case "Map":
    case "Set":
      return constructorName;
  }
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase().replace(/\s/g, "");
}
function ctorName(val) {
  return typeof val.constructor === "function" ? val.constructor.name : null;
}
function isError(val) {
  return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
}
function isDate(val) {
  if (val instanceof Date)
    return true;
  return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
}
function kindOf(val) {
  let typeOfVal = typeof val;
  if (true) {
    typeOfVal = miniKindOf(val);
  }
  return typeOfVal;
}
function createStore(reducer, preloadedState, enhancer) {
  if (typeof reducer !== "function") {
    throw new Error(false ? formatProdErrorMessage(2) : `Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`);
  }
  if (typeof preloadedState === "function" && typeof enhancer === "function" || typeof enhancer === "function" && typeof arguments[3] === "function") {
    throw new Error(false ? formatProdErrorMessage(0) : "It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.");
  }
  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    enhancer = preloadedState;
    preloadedState = void 0;
  }
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error(false ? formatProdErrorMessage(1) : `Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`);
    }
    return enhancer(createStore)(reducer, preloadedState);
  }
  let currentReducer = reducer;
  let currentState = preloadedState;
  let currentListeners = /* @__PURE__ */ new Map();
  let nextListeners = currentListeners;
  let listenerIdCounter = 0;
  let isDispatching = false;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = /* @__PURE__ */ new Map();
      currentListeners.forEach((listener, key) => {
        nextListeners.set(key, listener);
      });
    }
  }
  function getState() {
    if (isDispatching) {
      throw new Error(false ? formatProdErrorMessage(3) : "You may not call store.getState() while the reducer is executing. The reducer has already received the state as an argument. Pass it down from the top reducer instead of reading it from the store.");
    }
    return currentState;
  }
  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error(false ? formatProdErrorMessage(4) : `Expected the listener to be a function. Instead, received: '${kindOf(listener)}'`);
    }
    if (isDispatching) {
      throw new Error(false ? formatProdErrorMessage(5) : "You may not call store.subscribe() while the reducer is executing. If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state. See https://redux.js.org/api/store#subscribelistener for more details.");
    }
    let isSubscribed = true;
    ensureCanMutateNextListeners();
    const listenerId = listenerIdCounter++;
    nextListeners.set(listenerId, listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      if (isDispatching) {
        throw new Error(false ? formatProdErrorMessage(6) : "You may not unsubscribe from a store listener while the reducer is executing. See https://redux.js.org/api/store#subscribelistener for more details.");
      }
      isSubscribed = false;
      ensureCanMutateNextListeners();
      nextListeners.delete(listenerId);
      currentListeners = null;
    };
  }
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(false ? formatProdErrorMessage(7) : `Actions must be plain objects. Instead, the actual type was: '${kindOf(action)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`);
    }
    if (typeof action.type === "undefined") {
      throw new Error(false ? formatProdErrorMessage(8) : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }
    if (typeof action.type !== "string") {
      throw new Error(false ? formatProdErrorMessage(17) : `Action "type" property must be a string. Instead, the actual type was: '${kindOf(action.type)}'. Value was: '${action.type}' (stringified)`);
    }
    if (isDispatching) {
      throw new Error(false ? formatProdErrorMessage(9) : "Reducers may not dispatch actions.");
    }
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    const listeners = currentListeners = nextListeners;
    listeners.forEach((listener) => {
      listener();
    });
    return action;
  }
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== "function") {
      throw new Error(false ? formatProdErrorMessage(10) : `Expected the nextReducer to be a function. Instead, received: '${kindOf(nextReducer)}`);
    }
    currentReducer = nextReducer;
    dispatch({
      type: actionTypes_default.REPLACE
    });
  }
  function observable() {
    const outerSubscribe = subscribe;
    return {
      /**
       * The minimal observable subscription method.
       * @param observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== "object" || observer === null) {
          throw new Error(false ? formatProdErrorMessage(11) : `Expected the observer to be an object. Instead, received: '${kindOf(observer)}'`);
        }
        function observeState() {
          const observerAsObserver = observer;
          if (observerAsObserver.next) {
            observerAsObserver.next(getState());
          }
        }
        observeState();
        const unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe
        };
      },
      [symbol_observable_default]() {
        return this;
      }
    };
  }
  dispatch({
    type: actionTypes_default.INIT
  });
  const store = {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [symbol_observable_default]: observable
  };
  return store;
}
function legacy_createStore(reducer, preloadedState, enhancer) {
  return createStore(reducer, preloadedState, enhancer);
}
function warning(message) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message);
  }
  try {
    throw new Error(message);
  } catch (e) {
  }
}
function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  const reducerKeys = Object.keys(reducers);
  const argumentName = action && action.type === actionTypes_default.INIT ? "preloadedState argument passed to createStore" : "previous state received by the reducer";
  if (reducerKeys.length === 0) {
    return "Store does not have a valid reducer. Make sure the argument passed to combineReducers is an object whose values are reducers.";
  }
  if (!isPlainObject(inputState)) {
    return `The ${argumentName} has unexpected type of "${kindOf(inputState)}". Expected argument to be an object with the following keys: "${reducerKeys.join('", "')}"`;
  }
  const unexpectedKeys = Object.keys(inputState).filter((key) => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]);
  unexpectedKeys.forEach((key) => {
    unexpectedKeyCache[key] = true;
  });
  if (action && action.type === actionTypes_default.REPLACE)
    return;
  if (unexpectedKeys.length > 0) {
    return `Unexpected ${unexpectedKeys.length > 1 ? "keys" : "key"} "${unexpectedKeys.join('", "')}" found in ${argumentName}. Expected to find one of the known reducer keys instead: "${reducerKeys.join('", "')}". Unexpected keys will be ignored.`;
  }
}
function assertReducerShape(reducers) {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key];
    const initialState = reducer(void 0, {
      type: actionTypes_default.INIT
    });
    if (typeof initialState === "undefined") {
      throw new Error(false ? formatProdErrorMessage(12) : `The slice reducer for key "${key}" returned undefined during initialization. If the state passed to the reducer is undefined, you must explicitly return the initial state. The initial state may not be undefined. If you don't want to set a value for this reducer, you can use null instead of undefined.`);
    }
    if (typeof reducer(void 0, {
      type: actionTypes_default.PROBE_UNKNOWN_ACTION()
    }) === "undefined") {
      throw new Error(false ? formatProdErrorMessage(13) : `The slice reducer for key "${key}" returned undefined when probed with a random type. Don't try to handle '${actionTypes_default.INIT}' or other actions in "redux/*" namespace. They are considered private. Instead, you must return the current state for any unknown actions, unless it is undefined, in which case you must return the initial state, regardless of the action type. The initial state may not be undefined, but can be null.`);
    }
  });
}
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};
  for (let i2 = 0; i2 < reducerKeys.length; i2++) {
    const key = reducerKeys[i2];
    if (true) {
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }
    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);
  let unexpectedKeyCache;
  if (true) {
    unexpectedKeyCache = {};
  }
  let shapeAssertionError;
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }
  return function combination(state = {}, action) {
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }
    if (true) {
      const warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        warning(warningMessage);
      }
    }
    let hasChanged = false;
    const nextState = {};
    for (let i2 = 0; i2 < finalReducerKeys.length; i2++) {
      const key = finalReducerKeys[i2];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === "undefined") {
        const actionType = action && action.type;
        throw new Error(false ? formatProdErrorMessage(14) : `When called with an action of type ${actionType ? `"${String(actionType)}"` : "(unknown type)"}, the slice reducer for key "${key}" returned undefined. To ignore an action, you must explicitly return the previous state. If you want this reducer to hold no value, you can return null instead of undefined.`);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}
function bindActionCreator(actionCreator, dispatch) {
  return function(...args) {
    return dispatch(actionCreator.apply(this, args));
  };
}
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }
  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error(false ? formatProdErrorMessage(16) : `bindActionCreators expected an object or a function, but instead received: '${kindOf(actionCreators)}'. Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`);
  }
  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}
function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b2) => (...args) => a(b2(...args)));
}
function applyMiddleware(...middlewares) {
  return (createStore2) => (reducer, preloadedState) => {
    const store = createStore2(reducer, preloadedState);
    let dispatch = () => {
      throw new Error(false ? formatProdErrorMessage(15) : "Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.");
    };
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    };
    const chain = middlewares.map((middleware2) => middleware2(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);
    return {
      ...store,
      dispatch
    };
  };
}
function isAction(action) {
  return isPlainObject(action) && "type" in action && typeof action.type === "string";
}

// node_modules/@emotion/css/dist/emotion-css.esm.js
var emotion_css_esm_exports = {};
__export(emotion_css_esm_exports, {
  cache: () => cache,
  css: () => css,
  cx: () => cx,
  flush: () => flush,
  getRegisteredStyles: () => getRegisteredStyles2,
  hydrate: () => hydrate,
  injectGlobal: () => injectGlobal,
  keyframes: () => keyframes,
  merge: () => merge2,
  sheet: () => sheet
});

// node_modules/@emotion/sheet/dist/emotion-sheet.esm.js
var isDevelopment = false;
function sheetForTag(tag) {
  if (tag.sheet) {
    return tag.sheet;
  }
  for (var i2 = 0; i2 < document.styleSheets.length; i2++) {
    if (document.styleSheets[i2].ownerNode === tag) {
      return document.styleSheets[i2];
    }
  }
  return void 0;
}
function createStyleElement(options) {
  var tag = document.createElement("style");
  tag.setAttribute("data-emotion", options.key);
  if (options.nonce !== void 0) {
    tag.setAttribute("nonce", options.nonce);
  }
  tag.appendChild(document.createTextNode(""));
  tag.setAttribute("data-s", "");
  return tag;
}
var StyleSheet = /* @__PURE__ */ (function() {
  function StyleSheet2(options) {
    var _this = this;
    this._insertTag = function(tag) {
      var before;
      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }
      _this.container.insertBefore(tag, before);
      _this.tags.push(tag);
    };
    this.isSpeedy = options.speedy === void 0 ? !isDevelopment : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce;
    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }
  var _proto = StyleSheet2.prototype;
  _proto.hydrate = function hydrate2(nodes) {
    nodes.forEach(this._insertTag);
  };
  _proto.insert = function insert(rule) {
    if (this.ctr % (this.isSpeedy ? 65e3 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }
    var tag = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var sheet2 = sheetForTag(tag);
      try {
        sheet2.insertRule(rule, sheet2.cssRules.length);
      } catch (e) {
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }
    this.ctr++;
  };
  _proto.flush = function flush2() {
    this.tags.forEach(function(tag) {
      var _tag$parentNode;
      return (_tag$parentNode = tag.parentNode) == null ? void 0 : _tag$parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;
  };
  return StyleSheet2;
})();

// node_modules/stylis/src/Enum.js
var MS = "-ms-";
var MOZ = "-moz-";
var WEBKIT = "-webkit-";
var COMMENT = "comm";
var RULESET = "rule";
var DECLARATION = "decl";
var IMPORT = "@import";
var KEYFRAMES = "@keyframes";
var LAYER = "@layer";

// node_modules/stylis/src/Utility.js
var abs = Math.abs;
var from = String.fromCharCode;
var assign = Object.assign;
function hash(value, length2) {
  return charat(value, 0) ^ 45 ? (((length2 << 2 ^ charat(value, 0)) << 2 ^ charat(value, 1)) << 2 ^ charat(value, 2)) << 2 ^ charat(value, 3) : 0;
}
function trim(value) {
  return value.trim();
}
function match(value, pattern) {
  return (value = pattern.exec(value)) ? value[0] : value;
}
function replace(value, pattern, replacement) {
  return value.replace(pattern, replacement);
}
function indexof(value, search) {
  return value.indexOf(search);
}
function charat(value, index2) {
  return value.charCodeAt(index2) | 0;
}
function substr(value, begin, end) {
  return value.slice(begin, end);
}
function strlen(value) {
  return value.length;
}
function sizeof(value) {
  return value.length;
}
function append(value, array) {
  return array.push(value), value;
}
function combine(array, callback) {
  return array.map(callback).join("");
}

// node_modules/stylis/src/Tokenizer.js
var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = "";
function node2(value, root, parent, type, props, children, length2) {
  return { value, root, parent, type, props, children, line, column, length: length2, return: "" };
}
function copy(root, props) {
  return assign(node2("", null, null, "", null, null, 0), root, { length: -root.length }, props);
}
function char() {
  return character;
}
function prev() {
  character = position > 0 ? charat(characters, --position) : 0;
  if (column--, character === 10)
    column = 1, line--;
  return character;
}
function next() {
  character = position < length ? charat(characters, position++) : 0;
  if (column++, character === 10)
    column = 1, line++;
  return character;
}
function peek() {
  return charat(characters, position);
}
function caret() {
  return position;
}
function slice(begin, end) {
  return substr(characters, begin, end);
}
function token(type) {
  switch (type) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    // ! + , / > @ ~ isolate token
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    // ; { } breakpoint token
    case 59:
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function alloc(value) {
  return line = column = 1, length = strlen(characters = value), position = 0, [];
}
function dealloc(value) {
  return characters = "", value;
}
function delimit(type) {
  return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
}
function whitespace(type) {
  while (character = peek())
    if (character < 33)
      next();
    else
      break;
  return token(type) > 2 || token(character) > 3 ? "" : " ";
}
function escaping(index2, count) {
  while (--count && next())
    if (character < 48 || character > 102 || character > 57 && character < 65 || character > 70 && character < 97)
      break;
  return slice(index2, caret() + (count < 6 && peek() == 32 && next() == 32));
}
function delimiter(type) {
  while (next())
    switch (character) {
      // ] ) " '
      case type:
        return position;
      // " '
      case 34:
      case 39:
        if (type !== 34 && type !== 39)
          delimiter(character);
        break;
      // (
      case 40:
        if (type === 41)
          delimiter(type);
        break;
      // \
      case 92:
        next();
        break;
    }
  return position;
}
function commenter(type, index2) {
  while (next())
    if (type + character === 47 + 10)
      break;
    else if (type + character === 42 + 42 && peek() === 47)
      break;
  return "/*" + slice(index2, position - 1) + "*" + from(type === 47 ? type : next());
}
function identifier(index2) {
  while (!token(peek()))
    next();
  return slice(index2, position);
}

// node_modules/stylis/src/Parser.js
function compile(value) {
  return dealloc(parse("", null, null, null, [""], value = alloc(value), 0, [0], value));
}
function parse(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
  var index2 = 0;
  var offset = 0;
  var length2 = pseudo;
  var atrule = 0;
  var property = 0;
  var previous = 0;
  var variable = 1;
  var scanning = 1;
  var ampersand = 1;
  var character2 = 0;
  var type = "";
  var props = rules;
  var children = rulesets;
  var reference = rule;
  var characters2 = type;
  while (scanning)
    switch (previous = character2, character2 = next()) {
      // (
      case 40:
        if (previous != 108 && charat(characters2, length2 - 1) == 58) {
          if (indexof(characters2 += replace(delimit(character2), "&", "&\f"), "&\f") != -1)
            ampersand = -1;
          break;
        }
      // " ' [
      case 34:
      case 39:
      case 91:
        characters2 += delimit(character2);
        break;
      // \t \n \r \s
      case 9:
      case 10:
      case 13:
      case 32:
        characters2 += whitespace(previous);
        break;
      // \
      case 92:
        characters2 += escaping(caret() - 1, 7);
        continue;
      // /
      case 47:
        switch (peek()) {
          case 42:
          case 47:
            append(comment(commenter(next(), caret()), root, parent), declarations);
            break;
          default:
            characters2 += "/";
        }
        break;
      // {
      case 123 * variable:
        points[index2++] = strlen(characters2) * ampersand;
      // } ; \0
      case 125 * variable:
      case 59:
      case 0:
        switch (character2) {
          // \0 }
          case 0:
          case 125:
            scanning = 0;
          // ;
          case 59 + offset:
            if (ampersand == -1) characters2 = replace(characters2, /\f/g, "");
            if (property > 0 && strlen(characters2) - length2)
              append(property > 32 ? declaration(characters2 + ";", rule, parent, length2 - 1) : declaration(replace(characters2, " ", "") + ";", rule, parent, length2 - 2), declarations);
            break;
          // @ ;
          case 59:
            characters2 += ";";
          // { rule/at-rule
          default:
            append(reference = ruleset(characters2, root, parent, index2, offset, rules, points, type, props = [], children = [], length2), rulesets);
            if (character2 === 123)
              if (offset === 0)
                parse(characters2, root, reference, reference, props, rulesets, length2, points, children);
              else
                switch (atrule === 99 && charat(characters2, 3) === 110 ? 100 : atrule) {
                  // d l m s
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length2), children), rules, children, length2, points, rule ? props : children);
                    break;
                  default:
                    parse(characters2, reference, reference, reference, [""], children, 0, points, children);
                }
        }
        index2 = offset = property = 0, variable = ampersand = 1, type = characters2 = "", length2 = pseudo;
        break;
      // :
      case 58:
        length2 = 1 + strlen(characters2), property = previous;
      default:
        if (variable < 1) {
          if (character2 == 123)
            --variable;
          else if (character2 == 125 && variable++ == 0 && prev() == 125)
            continue;
        }
        switch (characters2 += from(character2), character2 * variable) {
          // &
          case 38:
            ampersand = offset > 0 ? 1 : (characters2 += "\f", -1);
            break;
          // ,
          case 44:
            points[index2++] = (strlen(characters2) - 1) * ampersand, ampersand = 1;
            break;
          // @
          case 64:
            if (peek() === 45)
              characters2 += delimit(next());
            atrule = peek(), offset = length2 = strlen(type = characters2 += identifier(caret())), character2++;
            break;
          // -
          case 45:
            if (previous === 45 && strlen(characters2) == 2)
              variable = 0;
        }
    }
  return rulesets;
}
function ruleset(value, root, parent, index2, offset, rules, points, type, props, children, length2) {
  var post = offset - 1;
  var rule = offset === 0 ? rules : [""];
  var size = sizeof(rule);
  for (var i2 = 0, j = 0, k = 0; i2 < index2; ++i2)
    for (var x = 0, y = substr(value, post + 1, post = abs(j = points[i2])), z = value; x < size; ++x)
      if (z = trim(j > 0 ? rule[x] + " " + y : replace(y, /&\f/g, rule[x])))
        props[k++] = z;
  return node2(value, root, parent, offset === 0 ? RULESET : type, props, children, length2);
}
function comment(value, root, parent) {
  return node2(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0);
}
function declaration(value, root, parent, length2) {
  return node2(value, root, parent, DECLARATION, substr(value, 0, length2), substr(value, length2 + 1, -1), length2);
}

// node_modules/stylis/src/Serializer.js
function serialize(children, callback) {
  var output = "";
  var length2 = sizeof(children);
  for (var i2 = 0; i2 < length2; i2++)
    output += callback(children[i2], i2, children, callback) || "";
  return output;
}
function stringify(element, index2, children, callback) {
  switch (element.type) {
    case LAYER:
      if (element.children.length) break;
    case IMPORT:
    case DECLARATION:
      return element.return = element.return || element.value;
    case COMMENT:
      return "";
    case KEYFRAMES:
      return element.return = element.value + "{" + serialize(element.children, callback) + "}";
    case RULESET:
      element.value = element.props.join(",");
  }
  return strlen(children = serialize(element.children, callback)) ? element.return = element.value + "{" + children + "}" : "";
}

// node_modules/stylis/src/Middleware.js
function middleware(collection) {
  var length2 = sizeof(collection);
  return function(element, index2, children, callback) {
    var output = "";
    for (var i2 = 0; i2 < length2; i2++)
      output += collection[i2](element, index2, children, callback) || "";
    return output;
  };
}
function rulesheet(callback) {
  return function(element) {
    if (!element.root) {
      if (element = element.return)
        callback(element);
    }
  };
}

// node_modules/@emotion/memoize/dist/emotion-memoize.esm.js
function memoize(fn) {
  var cache2 = /* @__PURE__ */ Object.create(null);
  return function(arg) {
    if (cache2[arg] === void 0) cache2[arg] = fn(arg);
    return cache2[arg];
  };
}

// node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js
var identifierWithPointTracking = function identifierWithPointTracking2(begin, points, index2) {
  var previous = 0;
  var character2 = 0;
  while (true) {
    previous = character2;
    character2 = peek();
    if (previous === 38 && character2 === 12) {
      points[index2] = 1;
    }
    if (token(character2)) {
      break;
    }
    next();
  }
  return slice(begin, position);
};
var toRules = function toRules2(parsed, points) {
  var index2 = -1;
  var character2 = 44;
  do {
    switch (token(character2)) {
      case 0:
        if (character2 === 38 && peek() === 12) {
          points[index2] = 1;
        }
        parsed[index2] += identifierWithPointTracking(position - 1, points, index2);
        break;
      case 2:
        parsed[index2] += delimit(character2);
        break;
      case 4:
        if (character2 === 44) {
          parsed[++index2] = peek() === 58 ? "&\f" : "";
          points[index2] = parsed[index2].length;
          break;
        }
      // fallthrough
      default:
        parsed[index2] += from(character2);
    }
  } while (character2 = next());
  return parsed;
};
var getRules = function getRules2(value, points) {
  return dealloc(toRules(alloc(value), points));
};
var fixedElements = /* @__PURE__ */ new WeakMap();
var compat = function compat2(element) {
  if (element.type !== "rule" || !element.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }
  var value = element.value;
  var parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;
  while (parent.type !== "rule") {
    parent = parent.parent;
    if (!parent) return;
  }
  if (element.props.length === 1 && value.charCodeAt(0) !== 58 && !fixedElements.get(parent)) {
    return;
  }
  if (isImplicitRule) {
    return;
  }
  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;
  for (var i2 = 0, k = 0; i2 < rules.length; i2++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i2] ? rules[i2].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i2];
    }
  }
};
var removeLabel = function removeLabel2(element) {
  if (element.type === "decl") {
    var value = element.value;
    if (
      // charcode for l
      value.charCodeAt(0) === 108 && // charcode for b
      value.charCodeAt(2) === 98
    ) {
      element["return"] = "";
      element.value = "";
    }
  }
};
function prefix(value, length2) {
  switch (hash(value, length2)) {
    // color-adjust
    case 5103:
      return WEBKIT + "print-" + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    // flex, flex-direction
    case 6828:
    case 4268:
      return WEBKIT + value + MS + value + value;
    // order
    case 6165:
      return WEBKIT + value + MS + "flex-" + value + value;
    // align-items
    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + "box-$1$2" + MS + "flex-$1$2") + value;
    // align-self
    case 5443:
      return WEBKIT + value + MS + "flex-item-" + replace(value, /flex-|-self/, "") + value;
    // align-content
    case 4675:
      return WEBKIT + value + MS + "flex-line-pack" + replace(value, /align-content|flex-|-self/, "") + value;
    // flex-shrink
    case 5548:
      return WEBKIT + value + MS + replace(value, "shrink", "negative") + value;
    // flex-basis
    case 5292:
      return WEBKIT + value + MS + replace(value, "basis", "preferred-size") + value;
    // flex-grow
    case 6060:
      return WEBKIT + "box-" + replace(value, "-grow", "") + WEBKIT + value + MS + replace(value, "grow", "positive") + value;
    // transition
    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, "$1" + WEBKIT + "$2") + value;
    // cursor
    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + "$1"), /(image-set)/, WEBKIT + "$1"), value, "") + value;
    // background, background-image
    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + "$1$`$1");
    // justify-content
    case 4968:
      return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + "box-pack:$3" + MS + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + WEBKIT + value + value;
    // (margin|padding)-inline-(start|end)
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + "$1$2") + value;
    // (min|max)?(width|height|inline-size|block-size)
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (strlen(value) - 1 - length2 > 6) switch (charat(value, length2 + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          if (charat(value, length2 + 4) !== 45) break;
        // (f)ill-available, (f)it-content
        case 102:
          return replace(value, /(.+:)(.+)-([^]+)/, "$1" + WEBKIT + "$2-$3$1" + MOZ + (charat(value, length2 + 3) == 108 ? "$3" : "$2-$3")) + value;
        // (s)tretch
        case 115:
          return ~indexof(value, "stretch") ? prefix(replace(value, "stretch", "fill-available"), length2) + value : value;
      }
      break;
    // position: sticky
    case 4949:
      if (charat(value, length2 + 1) !== 115) break;
    // display: (flex|inline-flex)
    case 6444:
      switch (charat(value, strlen(value) - 3 - (~indexof(value, "!important") && 10))) {
        // stic(k)y
        case 107:
          return replace(value, ":", ":" + WEBKIT) + value;
        // (inline-)?fl(e)x
        case 101:
          return replace(value, /(.+:)([^;!]+)(;|!.+)?/, "$1" + WEBKIT + (charat(value, 14) === 45 ? "inline-" : "") + "box$3$1" + WEBKIT + "$2$3$1" + MS + "$2box$3") + value;
      }
      break;
    // writing-mode
    case 5936:
      switch (charat(value, length2 + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb") + value;
        // vertical-r(l)
        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "tb-rl") + value;
        // horizontal(-)tb
        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, "lr") + value;
      }
      return WEBKIT + value + MS + value + value;
  }
  return value;
}
var prefixer = function prefixer2(element, index2, children, callback) {
  if (element.length > -1) {
    if (!element["return"]) switch (element.type) {
      case DECLARATION:
        element["return"] = prefix(element.value, element.length);
        break;
      case KEYFRAMES:
        return serialize([copy(element, {
          value: replace(element.value, "@", "@" + WEBKIT)
        })], callback);
      case RULESET:
        if (element.length) return combine(element.props, function(value) {
          switch (match(value, /(::plac\w+|:read-\w+)/)) {
            // :read-(only|write)
            case ":read-only":
            case ":read-write":
              return serialize([copy(element, {
                props: [replace(value, /:(read-\w+)/, ":" + MOZ + "$1")]
              })], callback);
            // :placeholder
            case "::placeholder":
              return serialize([copy(element, {
                props: [replace(value, /:(plac\w+)/, ":" + WEBKIT + "input-$1")]
              }), copy(element, {
                props: [replace(value, /:(plac\w+)/, ":" + MOZ + "$1")]
              }), copy(element, {
                props: [replace(value, /:(plac\w+)/, MS + "input-$1")]
              })], callback);
          }
          return "";
        });
    }
  }
};
var defaultStylisPlugins = [prefixer];
var createCache = function createCache2(options) {
  var key = options.key;
  if (key === "css") {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(ssrStyles, function(node3) {
      var dataEmotionAttribute = node3.getAttribute("data-emotion");
      if (dataEmotionAttribute.indexOf(" ") === -1) {
        return;
      }
      document.head.appendChild(node3);
      node3.setAttribute("data-s", "");
    });
  }
  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;
  var inserted = {};
  var container2;
  var nodesToHydrate = [];
  {
    container2 = options.container || document.head;
    Array.prototype.forEach.call(
      // this means we will ignore elements which don't have a space in them which
      // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
      document.querySelectorAll('style[data-emotion^="' + key + ' "]'),
      function(node3) {
        var attrib = node3.getAttribute("data-emotion").split(" ");
        for (var i2 = 1; i2 < attrib.length; i2++) {
          inserted[attrib[i2]] = true;
        }
        nodesToHydrate.push(node3);
      }
    );
  }
  var _insert;
  var omnipresentPlugins = [compat, removeLabel];
  {
    var currentSheet;
    var finalizingPlugins = [stringify, rulesheet(function(rule) {
      currentSheet.insert(rule);
    })];
    var serializer = middleware(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));
    var stylis = function stylis2(styles) {
      return serialize(compile(styles), serializer);
    };
    _insert = function insert(selector, serialized, sheet2, shouldCache) {
      currentSheet = sheet2;
      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      if (shouldCache) {
        cache2.inserted[serialized.name] = true;
      }
    };
  }
  var cache2 = {
    key,
    sheet: new StyleSheet({
      key,
      container: container2,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted,
    registered: {},
    insert: _insert
  };
  cache2.sheet.hydrate(nodesToHydrate);
  return cache2;
};

// node_modules/@emotion/hash/dist/emotion-hash.esm.js
function murmur2(str) {
  var h = 0;
  var k, i2 = 0, len = str.length;
  for (; len >= 4; ++i2, len -= 4) {
    k = str.charCodeAt(i2) & 255 | (str.charCodeAt(++i2) & 255) << 8 | (str.charCodeAt(++i2) & 255) << 16 | (str.charCodeAt(++i2) & 255) << 24;
    k = /* Math.imul(k, m): */
    (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16);
    k ^= /* k >>> r: */
    k >>> 24;
    h = /* Math.imul(k, m): */
    (k & 65535) * 1540483477 + ((k >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  }
  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i2 + 2) & 255) << 16;
    case 2:
      h ^= (str.charCodeAt(i2 + 1) & 255) << 8;
    case 1:
      h ^= str.charCodeAt(i2) & 255;
      h = /* Math.imul(h, m): */
      (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  }
  h ^= h >>> 13;
  h = /* Math.imul(h, m): */
  (h & 65535) * 1540483477 + ((h >>> 16) * 59797 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

// node_modules/@emotion/unitless/dist/emotion-unitless.esm.js
var unitlessKeys = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

// node_modules/@emotion/serialize/dist/emotion-serialize.esm.js
var isDevelopment2 = false;
var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;
var isCustomProperty = function isCustomProperty2(property) {
  return property.charCodeAt(1) === 45;
};
var isProcessableValue = function isProcessableValue2(value) {
  return value != null && typeof value !== "boolean";
};
var processStyleName = /* @__PURE__ */ memoize(function(styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, "-$&").toLowerCase();
});
var processStyleValue = function processStyleValue2(key, value) {
  switch (key) {
    case "animation":
    case "animationName": {
      if (typeof value === "string") {
        return value.replace(animationRegex, function(match2, p1, p2) {
          cursor = {
            name: p1,
            styles: p2,
            next: cursor
          };
          return p1;
        });
      }
    }
  }
  if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === "number" && value !== 0) {
    return value + "px";
  }
  return value;
};
var noComponentSelectorMessage = "Component selectors can only be used in conjunction with @emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware compiler transform.";
function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return "";
  }
  var componentSelector = interpolation;
  if (componentSelector.__emotion_styles !== void 0) {
    return componentSelector;
  }
  switch (typeof interpolation) {
    case "boolean": {
      return "";
    }
    case "object": {
      var keyframes2 = interpolation;
      if (keyframes2.anim === 1) {
        cursor = {
          name: keyframes2.name,
          styles: keyframes2.styles,
          next: cursor
        };
        return keyframes2.name;
      }
      var serializedStyles = interpolation;
      if (serializedStyles.styles !== void 0) {
        var next2 = serializedStyles.next;
        if (next2 !== void 0) {
          while (next2 !== void 0) {
            cursor = {
              name: next2.name,
              styles: next2.styles,
              next: cursor
            };
            next2 = next2.next;
          }
        }
        var styles = serializedStyles.styles + ";";
        return styles;
      }
      return createStringFromObject(mergedProps, registered, interpolation);
    }
    case "function": {
      if (mergedProps !== void 0) {
        var previousCursor = cursor;
        var result = interpolation(mergedProps);
        cursor = previousCursor;
        return handleInterpolation(mergedProps, registered, result);
      }
      break;
    }
  }
  var asString = interpolation;
  if (registered == null) {
    return asString;
  }
  var cached = registered[asString];
  return cached !== void 0 ? cached : asString;
}
function createStringFromObject(mergedProps, registered, obj) {
  var string = "";
  if (Array.isArray(obj)) {
    for (var i2 = 0; i2 < obj.length; i2++) {
      string += handleInterpolation(mergedProps, registered, obj[i2]) + ";";
    }
  } else {
    for (var key in obj) {
      var value = obj[key];
      if (typeof value !== "object") {
        var asString = value;
        if (registered != null && registered[asString] !== void 0) {
          string += key + "{" + registered[asString] + "}";
        } else if (isProcessableValue(asString)) {
          string += processStyleName(key) + ":" + processStyleValue(key, asString) + ";";
        }
      } else {
        if (key === "NO_COMPONENT_SELECTOR" && isDevelopment2) {
          throw new Error(noComponentSelectorMessage);
        }
        if (Array.isArray(value) && typeof value[0] === "string" && (registered == null || registered[value[0]] === void 0)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue(value[_i])) {
              string += processStyleName(key) + ":" + processStyleValue(key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation(mergedProps, registered, value);
          switch (key) {
            case "animation":
            case "animationName": {
              string += processStyleName(key) + ":" + interpolated + ";";
              break;
            }
            default: {
              string += key + "{" + interpolated + "}";
            }
          }
        }
      }
    }
  }
  return string;
}
var labelPattern = /label:\s*([^\s;{]+)\s*(;|$)/g;
var cursor;
function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && args[0].styles !== void 0) {
    return args[0];
  }
  var stringMode = true;
  var styles = "";
  cursor = void 0;
  var strings = args[0];
  if (strings == null || strings.raw === void 0) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    var asTemplateStringsArr = strings;
    styles += asTemplateStringsArr[0];
  }
  for (var i2 = 1; i2 < args.length; i2++) {
    styles += handleInterpolation(mergedProps, registered, args[i2]);
    if (stringMode) {
      var templateStringsArr = strings;
      styles += templateStringsArr[i2];
    }
  }
  labelPattern.lastIndex = 0;
  var identifierName = "";
  var match2;
  while ((match2 = labelPattern.exec(styles)) !== null) {
    identifierName += "-" + match2[1];
  }
  var name = murmur2(styles) + identifierName;
  return {
    name,
    styles,
    next: cursor
  };
}

// node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js
var isBrowser = true;
function getRegisteredStyles(registered, registeredStyles, classNames) {
  var rawClassName = "";
  classNames.split(" ").forEach(function(className) {
    if (registered[className] !== void 0) {
      registeredStyles.push(registered[className] + ";");
    } else if (className) {
      rawClassName += className + " ";
    }
  });
  return rawClassName;
}
var registerStyles = function registerStyles2(cache2, serialized, isStringTag) {
  var className = cache2.key + "-" + serialized.name;
  if (
    // we only need to add the styles to the registered cache if the
    // class name could be used further down
    // the tree but if it's a string tag, we know it won't
    // so we don't have to add it to registered cache.
    // this improves memory usage since we can avoid storing the whole style string
    (isStringTag === false || // we need to always store it if we're in compat mode and
    // in node since emotion-server relies on whether a style is in
    // the registered cache to know whether a style is global or not
    // also, note that this check will be dead code eliminated in the browser
    isBrowser === false) && cache2.registered[className] === void 0
  ) {
    cache2.registered[className] = serialized.styles;
  }
};
var insertStyles = function insertStyles2(cache2, serialized, isStringTag) {
  registerStyles(cache2, serialized, isStringTag);
  var className = cache2.key + "-" + serialized.name;
  if (cache2.inserted[serialized.name] === void 0) {
    var current = serialized;
    do {
      cache2.insert(serialized === current ? "." + className : "", current, cache2.sheet, true);
      current = current.next;
    } while (current !== void 0);
  }
};

// node_modules/@emotion/css/create-instance/dist/emotion-css-create-instance.esm.js
function insertWithoutScoping(cache2, serialized) {
  if (cache2.inserted[serialized.name] === void 0) {
    return cache2.insert("", serialized, cache2.sheet, true);
  }
}
function merge(registered, css3, className) {
  var registeredStyles = [];
  var rawClassName = getRegisteredStyles(registered, registeredStyles, className);
  if (registeredStyles.length < 2) {
    return className;
  }
  return rawClassName + css3(registeredStyles);
}
var createEmotion = function createEmotion2(options) {
  var cache2 = createCache(options);
  cache2.sheet.speedy = function(value) {
    this.isSpeedy = value;
  };
  cache2.compat = true;
  var css3 = function css4() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var serialized = serializeStyles(args, cache2.registered, void 0);
    insertStyles(cache2, serialized, false);
    return cache2.key + "-" + serialized.name;
  };
  var keyframes2 = function keyframes3() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    var serialized = serializeStyles(args, cache2.registered);
    var animation = "animation-" + serialized.name;
    insertWithoutScoping(cache2, {
      name: serialized.name,
      styles: "@keyframes " + animation + "{" + serialized.styles + "}"
    });
    return animation;
  };
  var injectGlobal2 = function injectGlobal3() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    var serialized = serializeStyles(args, cache2.registered);
    insertWithoutScoping(cache2, serialized);
  };
  var cx3 = function cx4() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return merge(cache2.registered, css3, classnames(args));
  };
  return {
    css: css3,
    cx: cx3,
    injectGlobal: injectGlobal2,
    keyframes: keyframes2,
    hydrate: function hydrate2(ids) {
      ids.forEach(function(key) {
        cache2.inserted[key] = true;
      });
    },
    flush: function flush2() {
      cache2.registered = {};
      cache2.inserted = {};
      cache2.sheet.flush();
    },
    sheet: cache2.sheet,
    cache: cache2,
    getRegisteredStyles: getRegisteredStyles.bind(null, cache2.registered),
    merge: merge.bind(null, cache2.registered, css3)
  };
};
var classnames = function classnames2(args) {
  var cls = "";
  for (var i2 = 0; i2 < args.length; i2++) {
    var arg = args[i2];
    if (arg == null) continue;
    var toAdd = void 0;
    switch (typeof arg) {
      case "boolean":
        break;
      case "object": {
        if (Array.isArray(arg)) {
          toAdd = classnames2(arg);
        } else {
          toAdd = "";
          for (var k in arg) {
            if (arg[k] && k) {
              toAdd && (toAdd += " ");
              toAdd += k;
            }
          }
        }
        break;
      }
      default: {
        toAdd = arg;
      }
    }
    if (toAdd) {
      cls && (cls += " ");
      cls += toAdd;
    }
  }
  return cls;
};

// node_modules/@emotion/css/dist/emotion-css.esm.js
var _createEmotion = createEmotion({
  key: "css"
});
var flush = _createEmotion.flush;
var hydrate = _createEmotion.hydrate;
var cx = _createEmotion.cx;
var merge2 = _createEmotion.merge;
var getRegisteredStyles2 = _createEmotion.getRegisteredStyles;
var injectGlobal = _createEmotion.injectGlobal;
var keyframes = _createEmotion.keyframes;
var css = _createEmotion.css;
var sheet = _createEmotion.sheet;
var cache = _createEmotion.cache;

// .tmp/src/proptypes.jsx
function isNullOrUndefined(v) {
  return v === null || v === void 0;
}
function formatComponentName(componentName) {
  return componentName || "<<anonymous>>";
}
function defaultGetDisplayName(x) {
  if (!x) return "Unknown";
  return x.displayName || x.name || "Unknown";
}
function createPrimitiveValidator(typeCheck) {
  const validator = function validate(props, propName, componentName, location, propFullName, secret) {
    const value = props[propName];
    if (isNullOrUndefined(value)) return null;
    if (typeCheck(value)) return null;
    const expected = typeCheck.expectedType || "the correct type";
    const actual = value === null ? "null" : typeof value;
    return new Error(
      `Invalid ${location} \`${propFullName}\` of type \`${actual}\` supplied to \`${formatComponentName(componentName)}\`, expected \`${expected}\`.`
    );
  };
  validator.isRequired = function validateRequired(props, propName, componentName, location, propFullName) {
    const value = props[propName];
    if (isNullOrUndefined(value)) {
      return new Error(
        `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${value}\`.`
      );
    }
    return validator(props, propName, componentName, location, propFullName);
  };
  return validator;
}
function createPropTypes() {
  const PropTypes2 = {};
  PropTypes2.any = (function() {
    const v = function validateAny(props, propName, componentName, location, propFullName) {
      return null;
    };
    v.isRequired = function validateAnyRequired() {
      return null;
    };
    return v;
  })();
  PropTypes2.array = createPrimitiveValidator((v) => Array.isArray(v));
  PropTypes2.array.expectedType = "array";
  PropTypes2.bool = createPrimitiveValidator((v) => typeof v === "boolean");
  PropTypes2.bool.expectedType = "boolean";
  PropTypes2.func = createPrimitiveValidator((v) => typeof v === "function");
  PropTypes2.func.expectedType = "function";
  PropTypes2.number = createPrimitiveValidator((v) => typeof v === "number" && !Number.isNaN(v));
  PropTypes2.number.expectedType = "number";
  PropTypes2.object = createPrimitiveValidator((v) => typeof v === "object" && v !== null && !Array.isArray(v));
  PropTypes2.object.expectedType = "object";
  PropTypes2.string = createPrimitiveValidator((v) => typeof v === "string");
  PropTypes2.string.expectedType = "string";
  PropTypes2.symbol = createPrimitiveValidator((v) => typeof v === "symbol");
  PropTypes2.symbol.expectedType = "symbol";
  PropTypes2.oneOf = function oneOf(values) {
    const allowed = Array.isArray(values) ? values : [];
    const validator = function validateOneOf(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;
      for (let i2 = 0; i2 < allowed.length; i2++) {
        if (value === allowed[i2]) return null;
      }
      const actual = value === null ? "null" : typeof value;
      return new Error(
        `Invalid ${location} \`${propFullName}\` of value \`${String(value)}\` supplied to \`${formatComponentName(componentName)}\`, expected one of [${allowed.map(String).join(", ")}] (received type \`${actual}\`).`
      );
    };
    validator.isRequired = function validateOneOfRequired(props, propName, componentName, location, propFullName) {
      if (isNullOrUndefined(props[propName])) {
        return new Error(
          `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${props[propName]}\`.`
        );
      }
      return validator(props, propName, componentName, location, propFullName);
    };
    return validator;
  };
  PropTypes2.oneOfType = function oneOfType(validators) {
    const vlist = validators || [];
    const validator = function validateOneOfType(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;
      for (let i2 = 0; i2 < vlist.length; i2++) {
        const err = vlist[i2](props, propName, componentName, location, propFullName);
        if (err === null) return null;
      }
      return new Error(
        `Invalid ${location} \`${propFullName}\` supplied to \`${formatComponentName(componentName)}\` (none of the allowed types matched).`
      );
    };
    validator.isRequired = function validateOneOfTypeRequired(props, propName, componentName, location, propFullName) {
      if (isNullOrUndefined(props[propName])) {
        return new Error(
          `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${props[propName]}\`.`
        );
      }
      return validator(props, propName, componentName, location, propFullName);
    };
    return validator;
  };
  PropTypes2.arrayOf = function arrayOf(innerValidator) {
    const inner = innerValidator;
    const validator = function validateArrayOf(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;
      if (!Array.isArray(value)) {
        return new Error(
          `Invalid ${location} \`${propFullName}\` of type \`${typeof value}\` supplied to \`${formatComponentName(componentName)}\`, expected an array.`
        );
      }
      for (let i2 = 0; i2 < value.length; i2++) {
        const itemPath = `${propFullName}[${i2}]`;
        const itemErr = inner(
          { [propName]: value[i2] },
          propName,
          componentName,
          location,
          itemPath
        );
        if (itemErr !== null) return itemErr;
      }
      return null;
    };
    validator.isRequired = function validateArrayOfRequired(props, propName, componentName, location, propFullName) {
      if (isNullOrUndefined(props[propName])) {
        return new Error(
          `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${props[propName]}\`.`
        );
      }
      return validator(props, propName, componentName, location, propFullName);
    };
    return validator;
  };
  PropTypes2.objectOf = function objectOf(innerValidator) {
    const inner = innerValidator;
    const validator = function validateObjectOf(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return new Error(
          `Invalid ${location} \`${propFullName}\` of type \`${typeof value}\` supplied to \`${formatComponentName(componentName)}\`, expected an object.`
        );
      }
      const keys = Object.keys(value);
      for (let i2 = 0; i2 < keys.length; i2++) {
        const k = keys[i2];
        const keyPath = `${propFullName}.${k}`;
        const keyErr = inner(
          { [propName]: value[k] },
          propName,
          componentName,
          location,
          keyPath
        );
        if (keyErr !== null) return keyErr;
      }
      return null;
    };
    validator.isRequired = function validateObjectOfRequired(props, propName, componentName, location, propFullName) {
      if (isNullOrUndefined(props[propName])) {
        return new Error(
          `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${props[propName]}\`.`
        );
      }
      return validator(props, propName, componentName, location, propFullName);
    };
    return validator;
  };
  function makeShapeValidator(spec, { exact }) {
    const keys = spec ? Object.keys(spec) : [];
    const validator = function validateShapeLike(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      const propIsMissing = isNullOrUndefined(value);
      if (propIsMissing) return null;
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return new Error(
          `Invalid ${location} \`${propFullName}\` of type \`${typeof value}\` supplied to \`${formatComponentName(componentName)}\`, expected an object.`
        );
      }
      if (exact) {
        const valueKeys = Object.keys(value);
        for (let i2 = 0; i2 < valueKeys.length; i2++) {
          const k = valueKeys[i2];
          if (!Object.prototype.hasOwnProperty.call(spec, k)) {
            const keyPath = `${propFullName}.${k}`;
            return new Error(
              `Invalid ${location} \`${keyPath}\` supplied to \`${formatComponentName(componentName)}\`: extra key \`${k}\` is not allowed by exact().`
            );
          }
        }
      }
      for (let i2 = 0; i2 < keys.length; i2++) {
        const k = keys[i2];
        const specValidator = spec[k];
        const nestedVal = value[k];
        const nestedPath = `${propFullName}.${k}`;
        if (isNullOrUndefined(nestedVal)) {
          const err2 = specValidator(
            { [propName]: nestedVal },
            propName,
            componentName,
            location,
            nestedPath
          );
          if (err2 !== null) return err2;
          continue;
        }
        const err = specValidator(
          { [propName]: nestedVal },
          propName,
          componentName,
          location,
          nestedPath
        );
        if (err !== null) return err;
      }
      return null;
    };
    validator.isRequired = function validateShapeLikeRequired(props, propName, componentName, location, propFullName) {
      if (isNullOrUndefined(props[propName])) {
        return new Error(
          `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${props[propName]}\`.`
        );
      }
      return validator(props, propName, componentName, location, propFullName);
    };
    return validator;
  }
  PropTypes2.shape = function shape(spec) {
    return makeShapeValidator(spec, { exact: false });
  };
  PropTypes2.exact = function exact(spec) {
    return makeShapeValidator(spec, { exact: true });
  };
  PropTypes2.instanceOf = function instanceOf(ClassOrConstructor) {
    const validator = function validateInstanceOf(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;
      if (value instanceof ClassOrConstructor) return null;
      return new Error(
        `Invalid ${location} \`${propFullName}\` supplied to \`${formatComponentName(componentName)}\`: expected instance of \`${defaultGetDisplayName(ClassOrConstructor)}\`.`
      );
    };
    validator.isRequired = function validateInstanceOfRequired(props, propName, componentName, location, propFullName) {
      if (isNullOrUndefined(props[propName])) {
        return new Error(
          `The ${location} \`${propFullName}\` is marked as required in \`${formatComponentName(componentName)}\`, but its value is \`${props[propName]}\`.`
        );
      }
      return validator(props, propName, componentName, location, propFullName);
    };
    return validator;
  };
  const warningCache = /* @__PURE__ */ new Set();
  PropTypes2.checkPropTypes = function checkPropTypes(typeSpecs, values, location, componentName) {
    if (false) return;
    if (!typeSpecs) return;
    const specs = typeSpecs;
    const component = formatComponentName(componentName);
    const typeSpecKeys = Object.keys(specs);
    for (let i2 = 0; i2 < typeSpecKeys.length; i2++) {
      const propKey = typeSpecKeys[i2];
      const validator = specs[propKey];
      if (typeof validator !== "function") continue;
      const fullName = propKey;
      const err = validator(values || {}, propKey, component, location, fullName);
      if (err instanceof Error) {
        const cacheKey = `${component}|${location}|${propKey}|${err.message}`;
        if (warningCache.has(cacheKey)) continue;
        warningCache.add(cacheKey);
        if (typeof console !== "undefined" && console.error) {
          console.error(
            `Warning: Failed prop type: ${err.message}`
          );
        }
      }
    }
  };
  return PropTypes2;
}
var PropTypes = createPropTypes();

// .tmp/src/components.jsx
var components_exports = {};
__export(components_exports, {
  Component: () => Component,
  HTMLComponent: () => HTMLComponent,
  RootComponent: () => RootComponent,
  boolean_html_attributes_set: () => boolean_html_attributes_set,
  capture_events_set: () => capture_events_set,
  createComponent: () => createComponent2,
  createElement: () => createElement,
  createRoot: () => createRoot,
  current_component: () => current_component,
  effect_timeout: () => effect_timeout,
  events_set: () => events_set,
  insertion_effects: () => insertion_effects,
  layout_effects: () => layout_effects,
  length_css_attributes_set: () => length_css_attributes_set,
  memo: () => memo,
  passive_effects: () => passive_effects,
  processEffects: () => processEffects,
  render: () => render,
  roots: () => roots,
  special_attributes: () => special_attributes,
  update_cbs: () => update_cbs,
  update_interval_margin: () => update_interval_margin,
  update_set: () => update_set,
  update_timeout: () => update_timeout
});

// .tmp/src/symbols.jsx
var [
  CORE,
  COMPONENT,
  TEXT2,
  IS_ZOMBIE,
  IDX,
  CHILD_CLASS_ADDENDUM,
  MEMOIZED,
  LAZY,
  DUE,
  REPEAT,
  CLEARED,
  INTERVAL,
  CALLBACK,
  ARGS
] = [
  /* @__PURE__ */ Symbol.for("LILACT:CORE"),
  /* @__PURE__ */ Symbol.for("LILACT:COMPONENT"),
  /* @__PURE__ */ Symbol.for("LILACT:TEXT"),
  /* @__PURE__ */ Symbol.for("LILACT:IS_ZOMBIE"),
  /* @__PURE__ */ Symbol.for("LILACT:IDX"),
  /* @__PURE__ */ Symbol.for("LILACT:CHILD_CLASS_ADDENDUM"),
  /* @__PURE__ */ Symbol.for("LILACT:MEMOIZED"),
  /* @__PURE__ */ Symbol.for("LILACT:LAZY"),
  /* @__PURE__ */ Symbol.for("LILACT:TIMERS:DUE"),
  /* @__PURE__ */ Symbol.for("LILACT:TIMERS:REPEAT"),
  /* @__PURE__ */ Symbol.for("LILACT:TIMERS:CLEARED"),
  /* @__PURE__ */ Symbol.for("LILACT:TIMERS:INTERVAL"),
  /* @__PURE__ */ Symbol.for("LILACT:TIMERS:CALLBACK"),
  /* @__PURE__ */ Symbol.for("LILACT:TIMERS:ARGS")
];

// .tmp/src/misc.jsx
var misc_exports = {};
__export(misc_exports, {
  Children: () => Children,
  Fragment: () => Fragment2,
  deepEqual: () => deepEqual,
  eval_num: () => eval_num,
  findDOMNode: () => findDOMNode,
  forwardRef: () => forwardRef,
  getComponentByPointer: () => getComponentByPointer,
  id_num: () => id_num,
  isAsync: () => isAsync,
  isClass: () => isClass,
  isEmpty: () => isEmpty,
  isError: () => isError2,
  isThenable: () => isThenable,
  isValidComponent: () => isValidComponent,
  isValidElement: () => isValidElement,
  shallowEqual: () => shallowEqual,
  toBool: () => toBool
});
var typeOf = (input) => {
  const rawObject = Object.prototype.toString.call(input).toLowerCase();
  const typeOfRegex = /\[object (.*)]/g;
  const type = typeOfRegex.exec(rawObject)[1];
  return type;
};
var isValidComponent = (value) => {
  return value[CORE] !== void 0 || value[TEXT] !== void 0;
};
var isValidElement = isValidComponent;
var findDOMNode = (component) => {
  var _a, _b;
  if (!((_b = (_a = component[CORE]) == null ? void 0 : _a.element) == null ? void 0 : _b.parentNode)) throw new Error("findDOMNode only works on mounted components.");
  return component[CORE].element;
};
var Fragment2 = function({ children }) {
  return children;
};
Fragment2.displayName = "Fragment";
var Children = {
  /**
   * Returns the only child from a children collection.
   *
   * @param children - The children to read.
   * @returns The single child (or null/exception based on the number of children).
   */
  only(children) {
    var _a, _b;
    children = [...children];
    let i2 = 0;
    while (i2 < children.length) {
      if (((_b = (_a = children[i2]) == null ? void 0 : _a.constructor) == null ? void 0 : _b.name) === "Array") {
        children.splice(i2, 1, ...children[i2]);
        i2--;
      } else if (children[i2] === null || children[i2] === void 0) {
        children.splice(i2, 1);
        i2--;
      }
      if (i2 > 1) {
        throw new Error("No child or child is not the only one");
      }
      i2++;
    }
    if (children.length === 1) return children[0];
  },
  /**
   * Converts component children into a flat array.
   *
   * @param children - The children to convert.
   * @returns An array representation of the children.
   */
  toArray(children) {
    var _a;
    if (children) {
      if (((_a = children == null ? void 0 : children.constructor) == null ? void 0 : _a.name) === "Array") return [...children];
      return [children];
    }
    return [];
  }
};
var forwardRef = (render2) => {
  const forwarded = function(props, ref) {
    return render2({ ...props, ref: void 0 }, ref);
  };
  forwarded.displayName = "Forwarded " + render2.displayName;
  return forwarded;
};
function getComponentByPointer() {
  let resolve_func;
  const pr = new Promise((res2, rej) => {
    resolve_func = res2;
  });
  function click_handler(event2) {
    event2.stopImmediatePropagation();
    window.removeEventListener("click", click_handler, true);
    let t = event2.target;
    while (!t[COMPONENT] && t.parentNode) {
      t = t.parentNode;
    }
    resolve_func(t[COMPONENT]);
    return false;
  }
  window.addEventListener("click", click_handler, true);
  return pr;
}
function isEmpty(value) {
  for (let i2 in value) return false;
  return true;
}
var shallowEqual = (source, target, ignore) => {
  if (typeOf(source) !== typeOf(target)) {
    return false;
  }
  if (typeOf(source) === "array") {
    if (source.length !== target.length) {
      return false;
    }
    return source.every((el, index2) => el === target[index2] || index2 === ignore);
  } else if (typeOf(source) === "object") {
    return Object.keys(source).every((key) => source[key] === target[key] || key === ignore);
  } else if (typeOf(source) === "date") {
    return source.getTime() === target.getTime();
  }
  return source === target;
};
function deepEqual(source, target) {
  if (typeOf(source) !== typeOf(target)) {
    return false;
  }
  if (typeOf(source) === "array") {
    if (source.length !== target.length) {
      return false;
    }
    return source.every((entry, index2) => deepEqual(entry, target[index2]));
  } else if (typeOf(source) === "object") {
    if (Object.keys(source).length !== Object.keys(target).length) {
      return false;
    }
    return Object.keys(source).every(
      (key) => deepEqual(source[key], target[key])
    );
  } else if (typeOf(source) === "date") {
    return source.getTime() === target.getTime();
  }
  return source === target;
}
function isClass(value) {
  if (!(value && value.constructor === Function) || value.prototype === void 0)
    return false;
  if (Function.prototype !== Object.getPrototypeOf(value))
    return true;
  return Object.getOwnPropertyNames(value.prototype).length > 1;
}
function isAsync(value) {
  return typeof value === "function" && value.constructor && value.constructor.name === "AsyncFunction";
}
function isThenable(value) {
  return value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}
function isError2(value) {
  return value instanceof Error || Object.prototype.toString.call(value) === "[object Error]";
}
function toBool(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    value = value.trim().toLowerCase();
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return Boolean(value);
}
var id_num = Math.floor(Math.random() * 1e4);
var eval_num = 0;

// .tmp/src/components.jsx
var ComponentCache = class {
  constructor(owner) {
    __publicField(this, "owner");
    __publicField(this, "current_map", /* @__PURE__ */ new Map());
    __publicField(this, "new_map", /* @__PURE__ */ new Map());
    __publicField(this, "pick_index", 0);
    this.owner = owner;
  }
  pick(key, construct_func) {
    var _a, _b;
    let comp;
    let buck = this.current_map.get(key);
    if (buck && buck.length > buck[IDX]) {
      comp = buck[buck[IDX]];
      buck[IDX]++;
      buck = this.new_map.get(key);
      if (buck !== void 0) {
        buck.push(comp);
      } else {
        buck = [comp];
        this.new_map.set(key, buck);
        buck[IDX] = 0;
      }
    } else {
      comp = construct_func();
      buck = this.new_map.get(key);
      if (buck !== void 0) {
        buck.push(comp);
      } else {
        buck = [comp];
        this.new_map.set(key, buck);
        buck[IDX] = 0;
      }
      if (comp[CORE]) (_b = (_a = comp[CORE]).parent) != null ? _b : _a.parent = this.owner;
    }
    return comp;
  }
  commit() {
    this.current_map.forEach((arr) => {
      arr.slice(arr[IDX]).forEach((ex) => {
        if (ex.cleanup) {
          ex.cleanup();
        } else if (ex.element) {
          ex.element.parentElement.removeChild(ex.element);
        }
      });
    });
    this.current_map = this.new_map;
    this.new_map = /* @__PURE__ */ new Map();
  }
};
var ComponentCore = class {
  constructor(comp, props) {
    /* 
    
    	// these are commented so they are not allocated by default. i just wanted to keep a list.
    
    	entity = undefined
    
    	ref = undefined;
    
    	context = undefined;
    	state = undefined;
    
    	container = null;
    	outlet = null;
    
    	depo = new ComponentCache;
    
    	element = undefined;
    	mount_state
    
    	insert_index
    	loader_args
    
    	*/
    __publicField(this, "component");
    __publicField(this, "props");
    this.component = comp;
    this.props = props || {};
  }
  /*
  */
  // TODO: should componentDidUpdate be called after arranging/appending the outlet or before?
  apply(next_props = this.props, next_state = this.next_state || this.state) {
    var _a, _b, _c, _d, _e;
    let do_rerender = true;
    if (this.outlet && (this == null ? void 0 : this[MEMOIZED])) {
      if (shallowEqual(this.props, next_props, "children") && shallowEqual((_a = this.props) == null ? void 0 : _a.children, next_props == null ? void 0 : next_props.children)) {
        do_rerender = false;
      }
    }
    if (do_rerender) {
      if (true) {
        if ((_b = this.entity) == null ? void 0 : _b.propTypes) {
          PropTypes.checkPropTypes(this.entity.propTypes, this.props, "prop", this.entity.name);
        } else if ((_c = this.component) == null ? void 0 : _c.propTypes) {
          PropTypes.checkPropTypes(this.component.propTypes, this.props, "prop", this.component.name);
        }
      }
      if (typeof next_state === "function") next_state = next_state(this.state);
      if (this.component.constructor.defaultProps) {
        next_props = { ...this.component.constructor.defaultProps, ...next_props };
      }
      if (this.component.shouldComponentUpdate && !this.component.shouldComponentUpdate(next_state, next_props, this.context)) return;
      if (typeof this.entity === "string") {
        if (!(this.element instanceof Element)) {
          this.element = document.createElement(this.entity);
          if (next_props == null ? void 0 : next_props.defaultValue) this.element.value = String(next_props.defaultValue).slice(0, next_props == null ? void 0 : next_props.maxLength);
          if (next_props == null ? void 0 : next_props.defaultChecked) this.element.checked = next_props.defaultChecked;
        }
        this.element[COMPONENT] = this.component;
      }
      if (next_props.ref) {
        if (typeof next_props.ref === "function") {
          next_props.ref(this.element || this.component);
        } else {
          next_props.ref.current = this.element || this.component;
        }
      }
      if (next_props !== void 0 && this.component.componentWillReceiveProps) {
        this.component.componentWillReceiveProps(next_props);
      }
      if (this.component.componentWillUpdate) {
        this.component.componentWillUpdate(next_props, next_state);
      }
      const prev_state = this.state, prev_props = this.props;
      if (this.element) {
        this.updateElementProps(next_props);
      }
      this.props = next_props;
      if (typeof this.next_state === "object") {
        if (!this.state) this.state = { ...next_state };
        else Object.assign(this.state, next_state);
      } else if (this.next_state !== void 0) throw new Error("Component.setState only accepts objects or functions is new state.");
      if (this.next_state) delete this.next_state;
      if (this.hooks !== void 0) {
        this.hook_index = 0;
        lilact_default.current_component = [this, lilact_default.current_component];
        try {
          this.outlet = this.component.render(next_props, { current: this.element || this.component });
        } catch (e) {
          renderErrorHandler(this, e);
        }
        lilact_default.current_component = lilact_default.current_component[1];
      } else {
        try {
          this.outlet = this.component.render({ current: this.element || this.component });
        } catch (e) {
          renderErrorHandler(this, e);
        }
      }
      if (((_e = (_d = this.outlet) == null ? void 0 : _d.constructor) == null ? void 0 : _e.name) !== "Array") {
        this.outlet = [this.outlet];
      }
      this.outlet = [...this.outlet];
      for (let i2 = 0; i2 < this.outlet.length; i2++) {
        let item = this.outlet[i2];
        if (item === void 0 || item === null || typeof item === "boolean") {
          this.outlet.splice(i2, 1);
          i2--;
        } else if (typeof item === "function") {
          const res2 = this.childFunctionHandler(item);
          this.outlet.splice(i2, 1, res2);
          i2--;
        } else if (item.constructor.name === "Array") {
          this.outlet.splice(i2, 1, ...item);
          i2--;
        } else {
          const core = prepareCore(this, item);
          this.outlet[i2] = core;
          if (core[TEXT2] === void 0) {
            core.container = this.element ? this : this.container;
            core.apply(item.props);
          } else {
            if (!core.element) {
              core.element = document.createTextNode(item[TEXT2]);
              core[TEXT2] = item[TEXT2];
            } else if (core[TEXT2] !== item[TEXT2]) {
              core.element.textContent = item[TEXT2];
              core[TEXT2] = item[TEXT2];
            }
          }
        }
      }
      if (this.cache) this.cache.commit();
      if (this.element) this.arrangeOutlet();
      if (this.component.componentDidUpdate) {
        this.component.componentDidUpdate(prev_props, prev_state, this.last_snapshot);
      }
      if (this.last_snapshot) delete this.last_snapshot;
    }
  }
  async cleanup() {
    var _a, _b, _c;
    try {
      const promises = [];
      if ((_a = this.props) == null ? void 0 : _a.ref) {
        if (typeof this.props.ref === "function") {
          this.props.ref(null);
        } else {
          this.props.current = null;
        }
      }
      if (this.component.componentWillUnmount) {
        this.component.componentWillUnmount();
      }
      if ((_b = this == null ? void 0 : this.element) == null ? void 0 : _b.parentElement) {
        this.element.parentElement.removeChild(this.element);
      }
      if (this.outlet !== void 0) {
        for (let c of this.outlet) {
          if (c.cleanup) {
            c.cleanup();
          }
        }
      }
      if (((_c = this.props) == null ? void 0 : _c.children) !== void 0) {
        for (let c of this.props.children) {
          if (c.cleanup) {
            c.cleanup();
          }
        }
      }
      if (this.hooks !== void 0) {
        for (let h of this.hooks) {
          if (h.cleanup) {
            h.cleanup();
          }
        }
      }
    } catch (e) {
      throw e;
    }
  }
  updateElementProps(patch, force = false) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (this.entity === "input") {
      if (!(patch == null ? void 0 : patch.type)) patch.type = "text";
      if (patch.type !== this.element.type) {
        this.element.type = patch.type;
      }
      if ((patch == null ? void 0 : patch.value) !== void 0 && (patch == null ? void 0 : patch.value) !== this.element.value) {
        if (patch.value === void 0) patch.value = "";
        this.element.value = String(patch.value).slice(0, patch == null ? void 0 : patch.maxLength);
      }
    } else if (this.entity === "textarea") {
      if ((patch == null ? void 0 : patch.value) !== this.element.value) {
        this.element.value = String(patch.value).slice(0, patch == null ? void 0 : patch.maxLength);
      }
    } else if (this.entity === "select") {
      if ((patch == null ? void 0 : patch.value) !== this.element.value) {
        lilact_default.setTimeout(() => this.element.value = String(patch.value), 0);
      }
    }
    for (let a in this.props) {
      const al = a.toLowerCase();
      if (!patch.hasOwnProperty(a)) {
        if (events_set.has(al)) {
          this.event_detachers[al]();
        } else {
          this.element.setAttribute(a, void 0);
        }
      }
    }
    for (let a in patch) {
      const al = a.toLowerCase();
      if (special_attributes.has(al)) continue;
      if (patch === this.props || !lilact_default.defaultIsEqual(patch[a], this.props[a]) || force) {
        if (events_set.has(al)) {
          (_a = this.event_detachers) != null ? _a : this.event_detachers = {};
          (_c = (_b = this.event_detachers)[al]) == null ? void 0 : _c.call(_b);
          this.event_detachers[al] = lilact_default.addWrappedEventListener(this.element, al.substring(2), patch[a]);
        } else if (capture_events_set.hasOwnProperty(al)) {
          const alc = capture_events_set[al];
          (_d = this.event_detachers) != null ? _d : this.event_detachers = {};
          (_f = (_e = this.event_detachers)[al]) == null ? void 0 : _f.call(_e);
          this.event_detachers[al] = lilact_default.addWrappedEventListener(this.element, alc.substring(2), patch[a], { capture: true });
        } else if (a === "style") {
          if (typeof patch.style === "string") {
            this.element.style = patch.style;
          } else {
            if ((_g = this.props) == null ? void 0 : _g.style) {
              if (typeof this.props.style === "string") {
                this.element.style = "";
              } else {
                for (let p in this.props.style) {
                  if (!patch.style.hasOwnProperty(p)) {
                    this.element.style[p] = "";
                  }
                }
              }
            }
            for (const x in patch.style) {
              if (length_css_attributes_set.has(x)) {
                if (isFinite(patch.style[x])) {
                  patch.style[x] += "px";
                }
              }
            }
            Object.assign(this.element.style, patch.style);
          }
        } else if (boolean_html_attributes_set.has(a)) {
          this.element[a] = toBool(patch[a]);
        } else if (a === "autoFocus") {
          this.element["autofocus"] = toBool(patch[a]);
        } else if (a === "htmlFor") {
          this.element.setAttribute("for", patch[a]);
        } else {
          if (al !== "value" || ["input", "textarea", "select"].indexOf(this.entity) === -1) {
            this.element.setAttribute(al, patch[a]);
          }
        }
      }
    }
    if (patch == null ? void 0 : patch.action) {
      this.element.onsubmit = patch.action;
    } else {
      this.element.onsubmit = void 0;
    }
    if (true) {
    }
    this.updateElementClass(patch);
  }
  updateElementClass(patch = this.props) {
    var _a, _b;
    let cn = patch == null ? void 0 : patch.className;
    cn != null ? cn : cn = (patch == null ? void 0 : patch.class) ? patch.class : "";
    if ((_a = this == null ? void 0 : this.parent) == null ? void 0 : _a[CHILD_CLASS_ADDENDUM]) {
      cn += " " + ((_b = this == null ? void 0 : this.parent) == null ? void 0 : _b[CHILD_CLASS_ADDENDUM]);
    }
    if (cn.length > 0) {
      cn = cn.split(/\s+/g);
      for (const n of Array.from(this.element.classList)) {
        if (cn.indexOf(n) === -1) {
          this.element.classList.remove(n);
        }
      }
      for (const n of cn) {
        if (n.length > 0) {
          this.element.classList.add(n);
        }
      }
    } else {
      delete this.element.className;
    }
  }
  scanZombies(container2, next_element) {
    const chs = container2.element.childNodes;
    while (chs[container2.insert_index] && chs[container2.insert_index][IS_ZOMBIE] && chs[container2.insert_index] !== next_element) {
      container2.insert_index++;
    }
  }
  appendElement(core) {
    var _a;
    this.scanZombies(core.container, core.element);
    if ((core == null ? void 0 : core.element.parentNode) === null) {
      core.container.element.insertBefore(
        core.element,
        core.container.element.childNodes[core.container.insert_index] || null
      );
      if ((_a = core == null ? void 0 : core.component) == null ? void 0 : _a.componentDidMount) {
        core.component.componentDidMount();
      }
    } else {
      if (core.container.element.childNodes[core.container.insert_index] !== core.element) {
        core.container.element.insertBefore(
          core.element,
          core.container.element.childNodes[core.container.insert_index] || null
        );
      }
    }
    core.container.insert_index++;
  }
  arrangeOutlet() {
    var _a;
    this.insert_index = 0;
    for (const core of this.outlet) {
      if (core) {
        if (core.element) {
          core.container = this.element ? this : this.container;
          core.container.appendElement(core);
        } else {
          if (core.arrangeOutlet) core.arrangeOutlet();
          if (!(core == null ? void 0 : core.mounted)) {
            core.mounted = true;
            if ((_a = core == null ? void 0 : core.component) == null ? void 0 : _a.componentDidMount) {
              core.component.componentDidMount();
            }
          }
        }
      }
    }
  }
  // note: override this to tailor function children like <Transition>{(state)=>{...}}</Transition>
  childFunctionHandler(func) {
    return func(this.state);
  }
};
var renderErrorHandler = (c, e) => {
  var _a, _b, _c, _d;
  const stack = [c];
  while (c && !((_a = c.component) == null ? void 0 : _a.componentDidCatch)) {
    c = c.parent;
    if (c) stack.push(c);
  }
  if ((_b = c == null ? void 0 : c.component) == null ? void 0 : _b.componentDidCatch) {
    if ((_c = c.entity) == null ? void 0 : _c.getDerivedStateFromError) {
      c.component.setState(c.entity.getDerivedStateFromError.call(c, e));
    }
  }
  let stack_log = Array.prototype.map.call(stack, (x) => `in  ${typeof x.component.displayName === "function" ? x.component.displayName() : x.component.displayName}`).join("\n");
  e.componentStack = stack;
  e.componentStackLog = stack_log;
  if ((_d = c == null ? void 0 : c.component) == null ? void 0 : _d.componentDidCatch) {
    c.component.componentDidCatch(e, { componentStack: stack, componentStackLog: stack_log });
  } else throw e;
};
function constructFunc(core, parent) {
  let comp = core;
  if (core[TEXT2] !== void 0) {
  } else {
    let entity = core.entity;
    let memoized = false;
    if (typeof entity === "object" && entity[MEMOIZED]) {
      memoized = true;
      entity = entity[MEMOIZED];
    }
    if (typeof entity === "string") {
      comp = new HTMLComponent(entity, core.props);
    } else {
      if (isClass(entity)) {
        if (entity == null ? void 0 : entity.defaultProps) {
          core.props = { ...entity.defaultProps, ...core.props };
        }
        comp = new entity(core.props);
        const desc = Object.getOwnPropertyDescriptor(comp, "state");
        if (desc) {
          if (typeof desc.get !== "function" && typeof desc.set !== "function") {
            comp[CORE].state = comp.state;
            Object.defineProperty(comp, "state", {
              get() {
                return this[CORE].state;
              },
              set(v) {
                if (this[CORE].state === void 0) {
                  this[CORE].state = v;
                } else {
                  throw new Error("Assigning component state this way is not allowed.");
                }
              }
            });
          }
        }
      } else if (typeof entity === "function") {
        if (entity == null ? void 0 : entity.defaultProps) {
          core.props = { ...entity.defaultProps, ...core.props };
        }
        comp = new Component(core.props);
        comp.render = entity.bind(comp);
        comp[CORE].hooks = [];
        comp[CORE].hook_index = 0;
      } else {
        throw new Error("Error in constructing component.");
      }
      comp[CORE].entity = entity;
      if (core.container) {
        comp[CORE].container = core.container;
      }
    }
    if (memoized) comp[CORE][MEMOIZED] = true;
  }
  if (parent instanceof ComponentCore) comp[CORE].parent = parent;
  return comp;
}
function prepareCore(parent, core) {
  var _a, _b, _c;
  try {
    (_a = parent.cache) != null ? _a : parent.cache = new ComponentCache(parent);
    core = parent.cache.pick(
      core[TEXT2] === void 0 ? (_b = core == null ? void 0 : core.props) == null ? void 0 : _b.key : ":text:",
      () => core[TEXT2] !== void 0 || core instanceof ComponentCore ? core : constructFunc(core, parent)[CORE]
    );
    return core;
  } catch (e) {
    if ((_c = core == null ? void 0 : core.component) == null ? void 0 : _c.componentDidCatch) {
      core.component.componentDidCatch(e);
    } else throw e;
  }
}
function doUpdates() {
  clearTimeout(lilact_default.effect_timeout);
  const _update_set = lilact_default.update_set;
  const _update_cbs = lilact_default.update_cbs;
  lilact_default.update_set = /* @__PURE__ */ new Set();
  lilact_default.update_cbs = /* @__PURE__ */ new Set();
  for (const u of _update_set) u.apply();
  for (const cb of _update_cbs) cb();
  processEffects();
}
function processEffects() {
  const _insertion_effects = lilact_default.insertion_effects;
  const _layout_effects = lilact_default.layout_effects;
  const _passive_effects = lilact_default.passive_effects;
  lilact_default.insertion_effects = /* @__PURE__ */ new Set();
  lilact_default.layout_effects = /* @__PURE__ */ new Set();
  lilact_default.passive_effects = /* @__PURE__ */ new Set();
  for (const ie of _insertion_effects) ie();
  for (const le of _layout_effects) le();
  requestAnimationFrame(() => {
    for (const pe of _passive_effects) pe();
  });
}
var generateComponentKey = (entity, props) => {
  let key;
  if (props.key !== void 0) {
    key = /*':k:'+*/
    props.key;
  } else if (props.id !== void 0) {
    key = ":i:" + props.id;
  } else if (props.path !== void 0) {
    key = ":p:" + props.path;
  } else if (props[TEXT2] !== void 0) {
    key = ":text:";
  } else {
    if (typeof entity === "string") {
      key = ":t:" + entity;
    } else if (entity == null ? void 0 : entity.name) {
      key = entity.name;
    } else {
      key = "::";
    }
    if (props.name !== void 0) {
      key = key + ":" + props.name;
    } else if (props.path !== void 0) {
      key = key + ":" + props.path;
    }
  }
  return key;
};
var Component = class {
  /**
  * Component state used to drive rendering.
  * Update it with `setState()` to trigger a re-render.
  * @type {object}
  */
  get state() {
    return this[CORE].state;
  }
  set state(v) {
    if (this[CORE].state === void 0) {
      this[CORE].state = v;
    } else {
      throw new Error("Assigning component state this way is not allowed.");
    }
  }
  /**
  * Component context.
  * @type {any}
  * @protected
  */
  get context() {
    return this[CORE].context;
  }
  set context(v) {
    throw new Error("Assigning component context this way is not allowed.");
  }
  /**
  * Component context value.
  * Use it to access shared data provided by an outer component/system.
  * @type {any}
  */
  get type() {
    return this[CORE].entity;
  }
  set type(v) {
    throw new Error("Component type is immutable.");
  }
  /**
  * Props passed into the component instance.
  * Use it as read-only input when rendering.
  * @type {any}
  */
  get props() {
    return this[CORE].props;
  }
  set props(v) {
    throw new Error("Assigning component props this way is not allowed.");
  }
  /**
  * A reference associated with the component to be used with useRef.
  * Can be used to expose the component instance or an underlying DOM node.
  * @type {any}
  */
  get ref() {
    return this[CORE].ref;
  }
  set ref(v) {
    throw new Error("Component ref is immutable.");
  }
  /**
  * A unique identifier for the component instance. 
  * The key is immutable and can only be set when the component is declared.
  * @type {string|number}
  */
  get key() {
    return this[CORE].props.key;
  }
  set key(v) {
    throw new Error("Component key is immutable.");
  }
  /**
  * The displayed name for the component. It is overridable.
  * It can also be set for function components.
  * @type {string}
  */
  displayName() {
    var _a, _b;
    if ((_a = this[CORE].entity) == null ? void 0 : _a.displayName) return (_b = this[CORE].entity) == null ? void 0 : _b.displayName;
    if (typeof this[CORE].entity === "string") return this[CORE].entity;
    if (isClass(this[CORE].entity)) this[CORE].entity.constructor.name;
    if (typeof this[CORE].entity === "function") return this[CORE].entity.name;
    return "Component";
  }
  constructor(props) {
    this[CORE] = new ComponentCore(this, props);
  }
  /**
  * Force the component to re-render even if no state/props change.
  * Useful for imperative updates.
  * @returns {void}
  */
  forceUpdate(callback) {
    lilact_default.clearTimeout(lilact_default.update_timeout);
    lilact_default.update_set.add(this[CORE].container || this[CORE]);
    if (callback) lilact_default.update_cbs.add(callback.bind(this));
    lilact_default.update_timeout = lilact_default.setTimeout(doUpdates, lilact_default.update_interval_margin);
  }
  /**
  * Update component state.
  * Accepts a partial state (or a function returning partial state) and schedules a re-render.
  * @param {any} new state
  * @param {any} callback to called after updates.
  * @returns {void}
  */
  setState(next_state, callback) {
    if (this.getSnapshotBeforeUpdate !== void 0) {
      this[CORE].last_snapshot = this.getSnapshotBeforeUpdate(this[CORE].props, this.state);
    }
    this[CORE].next_state = next_state;
    this.forceUpdate(callback ? callback.bind(this) : void 0);
  }
  /* User Functions
  	
  	static defaultProps
  
  	render							 () {}
  
  	componentWillReceiveProps		 (next_props)
  	componentWillUpdate				 (next_props, next_state)
  	componentDidCatch				 (error, info) 	{}
  	componentDidMount				 () 			{}
  	componentDidUpdate				 (prevProps, prevState, last_snapshot) {}
  	componentWillUnmount			 () {}
  	getSnapshotBeforeUpdate			 (prevProps, prevState) {}
  	shouldComponentUpdate			 (nextProps, nextState) {}
  
  	static getDerivedStateFromError	 (error) {}
  	static getDerivedStateFromProps	 (props, state) {}
  
  
  	*/
  /* // todo: maybe 
  	static get contextType() {  }
  	static set contextType(ctxt) {  } 
  
  	static get childContextTypes()  {}
  	static set childContextTypes(ctxt) {  } 
  
  	getChildContext()
  	*/
};
var HTMLComponent = class extends Component {
  constructor(entity, props) {
    super(props);
    this[CORE].entity = entity;
  }
  render() {
    return this[CORE].props.children;
  }
};
var RootComponent = class extends HTMLComponent {
  constructor(element, props) {
    super(":root", props);
    __publicField(this, "displayName", "Root");
    if (typeof this.element === "string") {
      element = document.querySelector(element);
    }
    this[CORE].element = element;
    for (const ch2 of props.children) {
      if (ch2[CORE]) ch2[CORE].container = this[CORE];
      else ch2.container = this[CORE];
    }
  }
};
function createComponent2(entity, props = {}, ...children) {
  if (typeof entity !== "string" && typeof entity !== "function") {
    if (typeof entity !== "object" || !entity[MEMOIZED]) {
      throw new Error("Invalid entity for createComponent.");
    }
  }
  for (let i2 = 0; i2 < children.length; i2++) {
    let ch2 = children[i2];
    if (ch2 === void 0 || ch2 === null || typeof ch2 === "boolean") {
      children.splice(i2, 1);
      i2--;
      continue;
    }
    if (["number", "bigint"].indexOf(typeof ch2) !== -1) {
      ch2 = ch2.toString();
    }
    if (typeof ch2 === "string") {
      children[i2] = { [TEXT2]: ch2 };
    } else {
      children[i2] = ch2;
    }
  }
  props.key = generateComponentKey(entity, props);
  props.children = children;
  return { entity, props };
}
function createRoot(element) {
  let root;
  return {
    render(component) {
      if (!root) {
        root = new RootComponent(element, { children: [component] });
        lilact_default.roots.add(root[CORE]);
        root.forceUpdate();
        return root;
      } else {
        throw new Error("root already rendered!");
      }
    },
    unmount() {
      if (root) {
        root.cleanup();
        element.innerHTML = "";
      }
    }
  };
}
function render(component, element) {
  if (component[CORE] && (component[CORE].container || component[CORE].parent)) {
    throw new Error("Component is already in use");
  }
  return createRoot(element).render(component);
}
function memo(component) {
  return { [MEMOIZED]: component };
}
var createElement = createComponent2;
var current_component = [];
var update_set = /* @__PURE__ */ new Set();
var update_cbs = /* @__PURE__ */ new Set();
var roots = /* @__PURE__ */ new Set();
var layout_effects = /* @__PURE__ */ new Set();
var insertion_effects = /* @__PURE__ */ new Set();
var passive_effects = /* @__PURE__ */ new Set();
var update_timeout = void 0;
var effect_timeout = void 0;
var update_interval_margin = 0;
var special_attributes = /* @__PURE__ */ new Set([
  "classname",
  "ref",
  "action",
  "lilact_jsx_loc",
  "children",
  "key",
  "defaultvalue",
  "defaultchecked"
]);
var events_set = /* @__PURE__ */ new Set([
  "onafterprint",
  "onbeforeprint",
  "onbeforeunload",
  "onerror",
  "onhashchange",
  "onload",
  "onmessage",
  "onoffline",
  "ononline",
  "onpagehide",
  "onpageshow",
  "onpopstate",
  "onresize",
  "onstorage",
  "onunload",
  "onblur",
  "onchange",
  "oncontextmenu",
  "onfocus",
  "oninput",
  "oninvalid",
  "onreset",
  "onsearch",
  "onselect",
  "onsubmit",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onclick",
  "ondblclick",
  "onmousedown",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onmousewheel",
  "onwheel",
  "ondrag",
  "ondragend",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "onscroll",
  "oncopy",
  "oncut",
  "onpaste",
  "onabort",
  "oncanplay",
  "oncanplaythrough",
  "oncuechange",
  "ondurationchange",
  "onemptied",
  "onended",
  "onerror",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onpause",
  "onplay",
  "onplaying",
  "onprogress",
  "onratechange",
  "onseeked",
  "onseeking",
  "onstalled",
  "onsuspend",
  "ontimeupdate",
  "onvolumechange",
  "onwaiting",
  "ontoggle",
  "onpointerdown",
  "onpointerup",
  "onpointermove",
  "onpointercancel",
  "onpointerover",
  "onpointerout",
  "onpointerenter",
  "onpointerleave"
]);
var capture_events_set = {};
for (const x of events_set) {
  capture_events_set[x + "capture"] = x;
}
var length_css_attributes_set = /* @__PURE__ */ new Set([
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "top",
  "right",
  "bottom",
  "left",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "outlineWidth",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "wordSpacing",
  "textIndent",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "columnGap",
  "rowGap",
  "gap"
]);
var boolean_html_attributes_set = /* @__PURE__ */ new Set([
  "disabled",
  "readOnly",
  "required",
  "checked",
  "multiple",
  "hidden",
  "open",
  "loop",
  "muted",
  "controls",
  "playsInline",
  "allowFullScreen"
]);

// .tmp/src/hooks.jsx
var hooks_exports = {};
__export(hooks_exports, {
  createContext: () => createContext,
  startTransition: () => startTransition,
  useActionState: () => useActionState,
  useCallback: () => useCallback,
  useContext: () => useContext,
  useDebugValue: () => useDebugValue,
  useDeferredValue: () => useDeferredValue,
  useEffect: () => useEffect,
  useHook: () => useHook,
  useId: () => useId,
  useImperativeHandle: () => useImperativeHandle,
  useInsertionEffect: () => useInsertionEffect,
  useLayoutEffect: () => useLayoutEffect,
  useLocalStorage: () => useLocalStorage,
  useMemo: () => useMemo,
  useReducer: () => useReducer,
  useRef: () => useRef,
  useState: () => useState,
  useTransition: () => useTransition
});
function useHook() {
  const core = lilact_default.current_component[0];
  if (core.hooks[core.hook_index] === void 0) {
    core.hooks.push({});
  }
  return core.hooks[core.hook_index++];
}
function useState(initialValue) {
  const hk = useHook();
  if (isEmpty(hk)) {
    if (typeof initialValue === "function") hk.value = initialValue();
    else hk.value = initialValue;
    hk.set_func = function(core, hk2, value) {
      if (typeof value === "function") hk2.value = value(hk2.value);
      else hk2.value = value;
      core.component.forceUpdate();
    }.bind(void 0, lilact_default.current_component[0], hk);
  }
  return [hk.value, hk.set_func];
}
function useCallback(callback, deps = void 0) {
  if (deps !== void 0 && (typeof deps !== "object" || deps.constructor.name !== "Array")) {
    throw new Error("Callback dependencies must be an array or omitted.");
  }
  const hk = useHook();
  if (!isEmpty(hk)) {
    if (deps !== void 0 && (hk == null ? void 0 : hk.deps) !== void 0 && shallowEqual(deps, hk.deps)) {
      return hk.callback;
    }
  }
  if (hk == null ? void 0 : hk.cleanup) {
    hk.cleanup();
  }
  hk.deps = deps;
  hk.callback = callback;
  return hk.callback;
}
function createContext(defaultValue) {
  const prov = function({ value, children }) {
    return children;
  };
  return {
    default: defaultValue,
    Provider: prov
  };
}
function useContext(context2) {
  var _a;
  let core = lilact_default.current_component[0].parent;
  while (core.entity !== context2.Provider && core.parent) {
    core = core.parent;
  }
  if (core.parent) {
    let v = (_a = core.props) == null ? void 0 : _a.value;
    return v != null ? v : v = context2.default;
  }
  return context2.default;
}
function useId(prefix2 = "N") {
  const hk = useHook();
  if (isEmpty(hk)) {
    hk.id = prefix2 + lilact_default.id_num++;
  }
  return hk.id;
}
function useTransition() {
  const hk = useHook();
  if (isEmpty(hk)) {
    hk.count = 0;
    hk.func = (async function(core, hk2, fn) {
      if (hk2.count === 0) {
        core.component.forceUpdate();
      }
      hk2.count++;
      await fn();
      hk2.count--;
      if (hk2.count === 0) {
        core.component.forceUpdate();
      }
    }).bind(void 0, lilact_default.current_component[0], hk);
  }
  return [hk.count != 0, hk.func];
}
function useLocalStorage(key, initialValue) {
  const hk = useHook();
  let val;
  try {
    val = JSON.parse(localStorage[key]);
  } catch (e) {
  }
  if (val === void 0) {
    if (typeof initialValue === "function") initialValue = initialValue();
    val = initialValue;
    localStorage[key] = JSON.stringify(val);
  }
  if (isEmpty(hk)) {
    hk.value = val;
    hk.set_func = function(core, hk2, val2) {
      if (typeof val2 === "function") val2 = val2(hk2.value);
      if (val2 === hk2.value) return;
      localStorage[key] = JSON.stringify(val2);
      hk2.value = val2;
      core.component.forceUpdate();
    }.bind(void 0, lilact_default.current_component[0], hk);
  }
  return [hk.value, hk.set_func];
}
function useRef(initialValue = null) {
  const hk = useHook();
  if (isEmpty(hk)) {
    hk.current = initialValue;
  }
  return hk;
}
function useLayoutEffect(effect, deps = void 0) {
  if (deps !== void 0 && (typeof deps !== "object" || deps.constructor.name !== "Array")) {
    throw new Error("Layout effect dependencies must be an array, object or omitted.");
  }
  const hk = useHook();
  if (!isEmpty(hk)) {
    if (deps !== void 0 && (hk == null ? void 0 : hk.deps) !== void 0 && shallowEqual(deps, hk.deps)) return;
  }
  if (hk == null ? void 0 : hk.cleanup) {
    hk.cleanup();
  }
  hk.deps = deps;
  lilact_default.layout_effects.add(() => {
    hk.cleanup = effect();
  });
  lilact_default.clearTimeout(lilact_default.effect_timeout);
  lilact_default.setTimeout(lilact_default.processEffects, 0);
}
function useEffect(effect, deps = void 0) {
  if (deps !== void 0 && (typeof deps !== "object" || deps.constructor.name !== "Array")) {
    throw new Error("Effect dependencies must be an array, object or omitted.");
  }
  const hk = useHook();
  if (!isEmpty(hk)) {
    if (deps !== void 0 && (hk == null ? void 0 : hk.deps) !== void 0 && shallowEqual(deps, hk.deps)) return;
  }
  if (hk == null ? void 0 : hk.cleanup) {
    hk.cleanup();
  }
  hk.deps = deps;
  lilact_default.passive_effects.add(() => {
    hk.cleanup = effect();
  });
  lilact_default.clearTimeout(lilact_default.effect_timeout);
  lilact_default.setTimeout(lilact_default.processEffects, 0);
}
function useInsertionEffect(effect, deps = void 0) {
  if (deps !== void 0 && (typeof deps !== "object" || deps.constructor.name !== "Array")) {
    throw new Error("Insertion effect dependencies must be an array, object, or omitted.");
  }
  const hk = useHook();
  if (!isEmpty(hk)) {
    if (deps !== void 0 && (hk == null ? void 0 : hk.deps) !== void 0 && shallowEqual(deps, hk.deps)) return;
  }
  if (hk == null ? void 0 : hk.cleanup) {
    hk.cleanup();
  }
  hk.deps = deps;
  lilact_default.insertion_effects.add(() => {
    hk.cleanup = effect();
  });
  lilact_default.clearTimeout(lilact_default.effect_timeout);
  lilact_default.setTimeout(lilact_default.processEffects, 0);
}
function useMemo(factory, deps = void 0) {
  if (deps !== void 0 && (typeof deps !== "object" || deps.constructor.name !== "Array")) {
    throw new Error("Memo dependencies must be an array or omitted.");
  }
  const hk = useHook();
  if (!isEmpty(hk)) {
    if (deps !== void 0 && (hk == null ? void 0 : hk.deps) !== void 0 && shallowEqual(deps, hk.deps)) {
      return hk.value;
    }
  }
  hk.deps = deps;
  hk.value = factory();
  return hk.value;
}
function useActionState(action, initialState) {
  const hk = useHook();
  const [is_pending, tran_start_func] = useTransition();
  if (isEmpty(hk)) {
    hk.state = initialState;
    hk.form_action = (sub) => {
      event.preventDefault();
      tran_start_func(
        async () => {
          const form_data = new FormData(sub.target, sub.submitter);
          hk.state = await action(hk.state, form_data);
        },
        []
      );
      return false;
    };
  }
  return [hk.state, hk.form_action, is_pending];
}
function useReducer(reducer, initialArg, init) {
  const hk = useHook();
  if (isEmpty(hk)) {
    hk.reducer = reducer;
    hk.state = init ? init(initialArg) : initialArg;
    hk.dispatch = function(core, hk2, action) {
      const newst = hk2.reducer(hk2.state, action);
      if (!lilact_default.defaultIsEqual(newst, hk2.state)) {
        hk2.state = newst;
        core.component.forceUpdate();
      }
    }.bind(void 0, lilact_default.current_component[0], hk);
  }
  return [hk.state, hk.dispatch];
}
function useDeferredValue(value, initialValue) {
  const { useEffect: useEffect2, useRef: useRef2, useState: useState2 } = lilact_default;
  const [deferred, setDeferred] = useState2(
    typeof initialValue !== "undefined" ? initialValue : value
  );
  const lastValueRef = useRef2(value);
  const pendingRef = useRef2(null);
  useEffect2(() => {
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;
    if (pendingRef.current != null) {
      pendingRef.current.cancelled = true;
      pendingRef.current = null;
    }
    const job = { cancelled: false };
    pendingRef.current = job;
    Promise.resolve().then(() => {
      if (job.cancelled) return;
      setDeferred(value);
      pendingRef.current = null;
    });
    return () => {
      if (pendingRef.current) {
        pendingRef.current.cancelled = true;
        pendingRef.current = null;
      }
    };
  }, [value]);
  return deferred;
}
function useImperativeHandle(ref, factory, deps = void 0) {
  if (deps !== void 0 && (ref == null ? void 0 : ref.deps) !== void 0 && shallowEqual(deps, ref.deps)) return;
  ref.deps = deps;
  if (typeof (ref == null ? void 0 : ref.current) !== "object") {
    ref.current = {};
  }
  Object.assign(ref.current, factory(), 0);
}
function useDebugValue(val, formatter = (x) => x) {
  if (true) {
    console.log(formatter(val));
  }
}
function startTransition(transition) {
  transition();
}

// .tmp/src/run.jsx
var run_exports = {};
__export(run_exports, {
  lazy: () => lazy,
  require: () => require2,
  required_scripts: () => required_scripts,
  run: () => run,
  runScripts: () => runScripts
});
var required_scripts = {};
function run(jsx, path = `InlineJSX-${++lilact_default.eval_num}`, is_inline = true) {
  const mappings = [];
  const module = { exports: {} };
  let processed;
  required_scripts[path] = {
    mappings,
    module,
    is_inline,
    path,
    code: jsx
  };
  try {
    processed = lilact_default.transpileJSX(
      jsx,
      {
        path,
        mappings,
        factory: "createComponent",
        appendSourcemap: false,
        blocks_info: lilact_default.blocks_info,
        injectTraceLabels: true
      }
    );
  } catch (e) {
    lilact_default.error = e;
    throw e;
  }
  if (true) {
    required_scripts[path].processed = processed;
  }
  processed += "\n//# sourceURL=eval:/" + path;
  lilact_default.scanBlockLabels(processed, path);
  try {
    globalThis.Lilact = lilact_default;
    globalThis.createComponent = lilact_default.createComponent;
    globalThis.Fragment = lilact_default.Fragment;
    const res = eval(processed);
    if (module.exports) return module.exports;
    return res;
  } catch (e) {
    e = lilact_default.traceError(e);
    throw e;
  }
}
function require2(path2, forceUpdate) {
  var _a;
  if (required_scripts[path2] && !forceUpdate) return required_scripts[path2].module.exports;
  if (path2[0] === "#") {
    const el = document.getElementById(path2);
    if (el) {
      return run(el.innerText, path2);
    }
  } else if ((_a = lilact_default) == null ? void 0 : _a[LAZY]) {
    lilact_default[LAZY] = false;
    return fetch(path2).then((res2) => {
      if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
      return res2.text();
    }).then((res2) => {
      var _a2;
      res2 = run(res2, path2, false);
      return (_a2 = res2 == null ? void 0 : res2.default) != null ? _a2 : res2;
    }).catch((err) => {
      throw err;
    });
  } else {
    const request = new XMLHttpRequest();
    request.open("GET", path2, false);
    request.send(null);
    if (request.status === 200) {
      return run(request.responseText, path2, false);
    }
  }
  throw new Error(`Required resource not found (${path2})`);
}
function lazy(factory) {
  let status = "pending";
  let result;
  lilact_default[LAZY] = true;
  result = factory();
  if (lilact_default.isThenable(result)) {
    result.then(
      (mod) => {
        status = "success";
        result = mod;
        return result;
      },
      (err) => {
        status = "error";
        result = err;
        throw err;
      }
    );
  } else {
    status = "success";
  }
  function LazyComponent(props) {
    if (status === "pending") throw result;
    if (status === "error") throw result;
    const Component2 = result;
    return createComponent(Component2, { ...props });
  }
  return LazyComponent;
}
function scanScriptTagsWithType() {
  const scripts = Array.from(
    document.querySelectorAll('script[type="text/jsx"]')
  );
  return scripts.map((el) => {
    var _a, _b;
    return {
      src: (_a = el.getAttribute("src")) != null ? _a : null,
      content: (_b = el.textContent) != null ? _b : ""
    };
  });
}
function runScripts() {
  const scripts = scanScriptTagsWithType();
  for (const s of scripts) {
    if (s.src) require2(s.src);
    if (s.content) run(s.content);
  }
}

// .tmp/src/transition.jsx
var transition_exports = {};
__export(transition_exports, {
  CSSTransition: () => CSSTransition,
  SwitchTransition: () => SwitchTransition,
  Transition: () => Transition,
  TransitionGroup: () => TransitionGroup
});

// .tmp/src/timers.jsx
var timers_exports = {};
__export(timers_exports, {
  animationFramePromise: () => animationFramePromise,
  clearInterval: () => clearInterval,
  clearTimeout: () => clearTimeout2,
  grabTimers: () => grabTimers,
  pauseTimers: () => pauseTimers,
  releaseTimers: () => releaseTimers,
  resetTimers: () => resetTimers,
  resumeTimers: () => resumeTimers,
  setInterval: () => setInterval,
  setTimeout: () => setTimeout2,
  timeoutPromise: () => timeoutPromise
});
var timer_pause_time = void 0;
var current_timer_idx = -1;
var timer_list = [];
var timer_timeout = -1;
var all_timers = {};
var _setTimeout = window.setTimeout;
var _setInterval = window.setInterval;
var _clearTimeout = window.clearTimeout;
var _clearInterval = window.clearInterval;
function get_bucket(target) {
  let left = 0;
  let right = timer_list.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const mid_val = timer_list[mid][DUE];
    if (mid_val === target) {
      return [mid, timer_list[mid]];
    } else if (mid_val < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  const bucket = [];
  bucket[DUE] = target;
  timer_list.splice(left, 0, bucket);
  return [left, bucket];
}
function add_timer(t, is_repeat = false) {
  const [i2, bucket] = get_bucket(t[DUE]);
  if (!is_repeat) {
    current_timer_idx++;
    all_timers[current_timer_idx] = t;
    t[IDX] = current_timer_idx;
  }
  bucket.push(t);
  if (timer_list[0][0] === t) {
    _clearTimeout(timer_timeout);
    timer_timeout = _setTimeout(run_timer, t[INTERVAL]);
  }
  return current_timer_idx;
}
function run_timer() {
  const now = Date.now();
  let i2 = 0;
  let buck = timer_list[i2];
  while (buck && buck[DUE] - now <= 0) {
    for (const t of buck) {
      if (!t[CLEARED]) {
        t[CALLBACK](...t[ARGS]);
        if (t[REPEAT]) {
          t[DUE] = Date.now() + t[INTERVAL];
          add_timer(t, true);
        } else {
          delete all_timers[t[IDX]];
        }
      } else {
        delete all_timers[t[IDX]];
      }
    }
    i2++;
    buck = timer_list[i2];
  }
  timer_list.splice(0, i2);
  if (timer_list.length > 0) {
    _clearTimeout(timer_timeout);
    timer_timeout = _setTimeout(run_timer, timer_list[0][DUE] - now);
  }
}
function resetTimers() {
  _clearTimeout(timer_timeout);
  timer_pause_time = void 0;
  current_timer_idx = -1;
  timer_list = [];
  timer_timeout = -1;
  all_timers = {};
}
function pauseTimers() {
  _clearTimeout(timer_timeout);
  timer_pause_time = Date.now();
}
function resumeTimers() {
  if (!timer_pause_time) return;
  if (timer_list.length > 0) {
    const now = Date.now();
    timer_pause_time -= now;
    for (const t of timer_list) {
      t[DUE] -= timer_pause_time;
    }
    timer_timeout = _setTimeout(run_timer, timer_list[0][DUE] - now);
  }
  timer_pause_time = void 0;
}
function setTimeout2(callback, delay, ...args) {
  return add_timer({ [CALLBACK]: callback, [INTERVAL]: delay, [DUE]: Date.now() + delay, [REPEAT]: false, [ARGS]: args });
}
function setInterval(callback, interval, ...args) {
  return add_timer({ [CALLBACK]: callback, [INTERVAL]: interval, [DUE]: Date.now() + interval, [REPEAT]: true, [ARGS]: args });
}
function clearTimeout2(id) {
  if (all_timers[id]) all_timers[id][CLEARED] = true;
}
function clearInterval(id) {
  if (all_timers[id]) all_timers[id][CLEARED] = true;
}
function grabTimers() {
  globalThis.setTimeout = Lilact.setTimeout;
  globalThis.setInterval = Lilact.setInterval;
  globalThis.clearTimeout = Lilact.clearTimeout;
  globalThis.clearInterval = Lilact.clearInterval;
}
function releaseTimers() {
  globalThis.setTimeout = _setTimeout;
  globalThis.setInterval = _setInterval;
  globalThis.clearTimeout = _clearTimeout;
  globalThis.clearInterval = _clearInterval;
}
function timeoutPromise(duration = 0, timerSource = Lilact) {
  let id, resolve, reject;
  const promise = new Promise((res2, rej) => {
    resolve = res2;
    reject = rej;
    id = timerSource.setTimeout(() => {
      resolve();
    }, duration);
  });
  promise.proceed = () => {
    timerSource.clearTimeout(id);
    resolve();
  };
  promise.cancel = () => {
    timerSource.clearTimeout(id);
    reject();
  };
  return promise;
}
function animationFramePromise() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

// .tmp/src/transition.jsx
var UNMOUNTED = "unmounted";
var EXITED = "exited";
var ENTERING = "entering";
var ENTERED = "entered";
var EXITING = "exiting";
function Transition({
  in: inProp,
  timeout = lilact_default.defaultTransitionTimeout,
  mountOnEnter = false,
  unmountOnExit = false,
  appear = false,
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited,
  children,
  // this is underscored to prevent accidental setting by the user.
  // i added it to the Transition itself to simplify the implementation,
  // but the user should use CSSTransition itself.
  _classNames: classNames
}) {
  var _a, _b, _c, _d, _e, _f;
  (_b = (_a = this[CORE]).is_mounted) != null ? _b : _a.is_mounted = !mountOnEnter || inProp || appear;
  (_d = (_c = this[CORE]).is_appeared) != null ? _d : _c.is_appeared = inProp;
  (_f = (_e = this[CORE]).timer) != null ? _f : _e.timer = null;
  this[CORE].childFunctionHandler = (func) => {
    return func(this[CORE].mount_state);
  };
  if (!this[CORE].mount_state) {
    if (!this[CORE].is_mounted) this[CORE].mount_state = UNMOUNTED;
    if (inProp) {
      this[CORE].mount_state = appear && !this[CORE].is_appeared ? ENTERING : ENTERED;
    } else this[CORE].mount_state = EXITED;
  }
  useEffect(() => {
    return () => clearTimeout2(this[CORE].timer);
  }, []);
  useEffect(() => {
    if (!this[CORE].is_appeared && appear && this[CORE].mount_state === ENTERING && inProp) {
      onEnter == null ? void 0 : onEnter();
      requestAnimationFrame(() => {
        onEntering == null ? void 0 : onEntering(!this[CORE].is_appeared);
        clearTimeout2(this[CORE].timer);
        this[CORE].timer = setTimeout2(() => {
          this[CORE].mount_state = ENTERED;
          this.forceUpdate();
          this[CORE].is_appeared = true;
          onEntered == null ? void 0 : onEntered(!this[CORE].is_appeared);
        }, timeout);
      });
    }
  }, []);
  useEffect(() => {
    if (inProp) {
      this[CORE].is_mounted = true;
      if (this[CORE].mount_state === ENTERING || this[CORE].mount_state === ENTERED) return;
      onEnter == null ? void 0 : onEnter(!this[CORE].is_appeared);
      this[CORE].mount_state = ENTERING;
      this.forceUpdate(() => {
        onEntering == null ? void 0 : onEntering(!this[CORE].is_appeared);
        clearTimeout2(this[CORE].timer);
        this[CORE].timer = setTimeout2(() => {
          this[CORE].mount_state = ENTERED;
          this.forceUpdate();
          this[CORE].is_appeared = true;
          onEntered == null ? void 0 : onEntered();
        }, timeout);
      });
    } else {
      if (this[CORE].mount_state === UNMOUNTED || this[CORE].mount_state === EXITING || this[CORE].mount_state === EXITED) return;
      onExit == null ? void 0 : onExit();
      this[CORE].mount_state = EXITING;
      this.forceUpdate(() => {
        onExiting == null ? void 0 : onExiting();
        clearTimeout2(this[CORE].timer);
        this[CORE].timer = setTimeout2(() => {
          this[CORE].mount_state = EXITED;
          this.forceUpdate();
          onExited == null ? void 0 : onExited();
          if (unmountOnExit) {
            this[CORE].is_mounted = false;
            this[CORE].mount_state = UNMOUNTED;
            this.forceUpdate();
          }
        }, timeout);
      });
    }
  }, [inProp, timeout]);
  if (!this[CORE].is_mounted) return null;
  if (classNames) {
    if (this[CORE].mount_state === ENTERING) {
      if (this[CORE].is_appeared)
        this[CORE][CHILD_CLASS_ADDENDUM] = classNames.appearActive;
      else
        this[CORE][CHILD_CLASS_ADDENDUM] = classNames.enterActive;
    } else if (this[CORE].mount_state === ENTERED) {
      if (this[CORE].is_appeared)
        this[CORE][CHILD_CLASS_ADDENDUM] = classNames.appearDone;
      else
        this[CORE][CHILD_CLASS_ADDENDUM] = classNames.enterDone;
    } else if (this[CORE].mount_state === EXITING) this[CORE][CHILD_CLASS_ADDENDUM] = classNames.exitActive;
    else if (this[CORE].mount_state === EXITED) this[CORE][CHILD_CLASS_ADDENDUM] = classNames.exitDone;
  }
  return children;
}
function CSSTransition({
  in: inProp,
  timeout = lilact_default.defaultTransitionTimeout,
  classNames = "fade",
  mountOnEnter = false,
  unmountOnExit = false,
  appear = false,
  children,
  onEnter,
  onEntering,
  onEntered,
  onExit,
  onExiting,
  onExited
}) {
  if (typeof classNames === "string") {
    classNames = {
      appear: `${classNames}-enter ${classNames}-appear`,
      appearActive: `${classNames}-enter-active ${classNames}-appear-active`,
      appearDone: `${classNames}-enter-done ${classNames}-appear-done`,
      enter: `${classNames}-enter`,
      enterActive: `${classNames}-enter-active`,
      enterDone: `${classNames}-enter-done`,
      exit: `${classNames}-exit`,
      exitActive: `${classNames}-exit-active`,
      exitDone: `${classNames}-exit-done`
    };
  }
  return createComponent(Transition, { "in": inProp, "timeout": timeout, "mountOnEnter": mountOnEnter, "unmountOnExit": unmountOnExit, "appear": appear, "onEnter": onEnter, "onEntering": onEntering, "onEntered": onEntered, "onExit": onExit, "onExiting": onExiting, "onExited": onExited, "_classNames": classNames }, children);
}
function SwitchTransition({
  children,
  activeKey,
  mode = "out-in",
  // "out-in" | "in-out"
  timeout = lilact_default.defaultTransitionTimeout,
  classNames = "switch",
  mountOnEnter = false,
  unmountOnExit = false,
  appear = false,
  // callbacks (optional)
  onExited,
  onEnter,
  onExiting,
  onEntered,
  ...csstProps
}) {
  const childArray = useMemo(() => Children.toArray(children), [children]);
  const [exitingKey, setExitingKey] = useState(null);
  const [exitStarted, setExitStarted] = useState(false);
  const [enterAllowed, setEnterAllowed] = useState(true);
  const prevKeyRef = useRef(activeKey);
  const activeKeyRef = useRef(activeKey);
  const exitingKeyRef = useRef(exitingKey);
  useLayoutEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);
  useLayoutEffect(() => {
    exitingKeyRef.current = exitingKey;
  }, [exitingKey]);
  useLayoutEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey === activeKey) return;
    prevKeyRef.current = activeKey;
    setExitingKey(prevKey);
    if (mode === "out-in") {
      setEnterAllowed(false);
      setExitStarted(true);
    } else {
      setEnterAllowed(true);
      setExitStarted(false);
    }
  }, [activeKey, mode]);
  const handleExited = (key) => (node3, isAppearing) => {
    if (typeof onExited === "function") onExited(node3, isAppearing);
    if (key === exitingKeyRef.current) {
      setExitingKey(null);
      if (mode === "out-in") {
        setExitStarted(false);
        setEnterAllowed(true);
      }
      if (mode === "in-out") {
        setExitStarted(false);
      }
    }
  };
  const handleEntered = (key) => (node3, isAppearing) => {
    if (typeof onEntered === "function") onEntered(node3, isAppearing);
    if (mode === "in-out") {
      if (key === activeKeyRef.current && exitingKeyRef.current != null) {
        setExitStarted(true);
      }
    }
  };
  return createComponent("div", { "style": { position: "relative" } }, childArray.map((child, index2) => {
    var _a;
    const key = ((_a = child == null ? void 0 : child.props) == null ? void 0 : _a.key) || index2;
    const isIncoming = key === activeKey;
    const isOutgoing = key === exitingKey;
    const inProp = isIncoming ? enterAllowed : isOutgoing ? !exitStarted : false;
    return createComponent(CSSTransition, { ...csstProps, "key": key, "in": inProp, "timeout": timeout, "classNames": classNames, "mountOnEnter": mountOnEnter, "unmountOnExit": unmountOnExit, "appear": appear, "onEnter": onEnter, "onExiting": onExiting, "onEntered": handleEntered(key), "onExited": handleExited(key) }, createComponent("div", { "style": { position: "absolute", inset: 0 } }, child));
  }));
}
function TransitionGroup({ children }) {
  return children;
}

// .tmp/src/events.jsx
var events_exports = {};
__export(events_exports, {
  addWrappedEventListener: () => addWrappedEventListener,
  createSyntheticEvent: () => createSyntheticEvent,
  releaseSyntheticEvent: () => releaseSyntheticEvent,
  wrapListener: () => wrapListener
});
if (typeof Element !== "undefined" && !Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector || function(s) {
    var matches = (this.document || this.ownerDocument).querySelectorAll(s);
    var i2 = matches.length;
    while (--i2 >= 0 && matches.item(i2) !== this) {
    }
    return i2 > -1;
  };
}
if (typeof Event !== "undefined" && !Event.prototype.composedPath) {
  Event.prototype.composedPath = function() {
    var path2 = [];
    var el = this.target;
    while (el) {
      path2.push(el);
      el = el.parentElement;
    }
    path2.push(window);
    return path2;
  };
}
var _pool = [];
var MAX_POOL_SIZE = 10;
var POINTER_TYPES = ["mouse", "pen", "touch"];
function createSyntheticEvent(nativeEvent, currentTarget) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  const e = _pool.length ? _pool.pop() : {};
  e.nativeEvent = nativeEvent;
  e.type = nativeEvent.type;
  e.target = nativeEvent.target || nativeEvent.srcElement || null;
  e.currentTarget = currentTarget || nativeEvent.currentTarget || null;
  e.timeStamp = nativeEvent.timeStamp || Date.now();
  e.defaultPrevented = !!nativeEvent.defaultPrevented;
  e.isPropagationStopped = false;
  e.isPersistent = false;
  e.bubbles = !!nativeEvent.bubbles;
  e.cancelable = !!nativeEvent.cancelable;
  e.composed = !!nativeEvent.composed;
  e.detail = nativeEvent.detail;
  e.relatedTarget = nativeEvent.relatedTarget || (nativeEvent.fromElement ? nativeEvent.fromElement : null) || (nativeEvent.toElement ? nativeEvent.toElement : null) || null;
  e.altKey = !!nativeEvent.altKey;
  e.ctrlKey = !!nativeEvent.ctrlKey;
  e.metaKey = !!nativeEvent.metaKey;
  e.shiftKey = !!nativeEvent.shiftKey;
  e.isDefaultPrevented = () => e.defaultPrevented;
  e.preventDefault = () => {
    if (nativeEvent.preventDefault) nativeEvent.preventDefault();
    e.defaultPrevented = true;
  };
  e.stopPropagation = () => {
    if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
    e.isPropagationStopped = true;
  };
  e.persist = () => {
    e.isPersistent = true;
  };
  e.key = nativeEvent.key || null;
  e.code = nativeEvent.code || null;
  e.which = (_b = (_a = nativeEvent.which) != null ? _a : nativeEvent.keyCode) != null ? _b : null;
  e.button = (_c = nativeEvent.button) != null ? _c : null;
  e.buttons = (_d = nativeEvent.buttons) != null ? _d : null;
  e.pointerId = (_e = nativeEvent.pointerId) != null ? _e : null;
  e.pointerType = (_f = nativeEvent.pointerType) != null ? _f : null;
  e.isPrimary = (_g = nativeEvent.isPrimary) != null ? _g : null;
  e.clientX = (_h = nativeEvent.clientX) != null ? _h : 0;
  e.clientY = (_i = nativeEvent.clientY) != null ? _i : 0;
  e.screenX = (_j = nativeEvent.screenX) != null ? _j : 0;
  e.screenY = (_k = nativeEvent.screenY) != null ? _k : 0;
  e.pageX = (_l = nativeEvent.pageX) != null ? _l : null;
  e.pageY = (_m = nativeEvent.pageY) != null ? _m : null;
  e.movementX = (_n = nativeEvent.movementX) != null ? _n : 0;
  e.movementY = (_o = nativeEvent.movementY) != null ? _o : 0;
  e.pressure = (_p = nativeEvent.pressure) != null ? _p : null;
  e.tiltX = (_q = nativeEvent.tiltX) != null ? _q : null;
  e.tiltY = (_r = nativeEvent.tiltY) != null ? _r : null;
  e.width = (_s = nativeEvent.width) != null ? _s : null;
  e.height = (_t = nativeEvent.height) != null ? _t : null;
  e.pointerEventsSupported = POINTER_TYPES.includes(e.pointerType);
  try {
    const tgt = e.target;
    e.value = tgt && "value" in tgt ? tgt.value : void 0;
    e.checked = tgt && "checked" in tgt ? tgt.checked : void 0;
    e.selectionStart = tgt && "selectionStart" in tgt ? tgt.selectionStart : void 0;
    e.selectionEnd = tgt && "selectionEnd" in tgt ? tgt.selectionEnd : void 0;
  } catch (err) {
    e.value = void 0;
    e.checked = void 0;
    e.selectionStart = void 0;
    e.selectionEnd = void 0;
  }
  e.touches = nativeEvent.touches || null;
  e.targetTouches = nativeEvent.targetTouches || null;
  e.changedTouches = nativeEvent.changedTouches || null;
  e.path = typeof nativeEvent.composedPath === "function" ? nativeEvent.composedPath() : [e.target];
  e.repeat = (_u = nativeEvent.repeat) != null ? _u : false;
  e.location = (_v = nativeEvent.location) != null ? _v : 0;
  return e;
}
function releaseSyntheticEvent(e) {
  if (e && !e.isPersistent) {
    e.nativeEvent = null;
    e.type = null;
    e.target = null;
    e.currentTarget = null;
    e.timeStamp = 0;
    e.defaultPrevented = false;
    e.isPropagationStopped = false;
    e.isPersistent = false;
    e.isDefaultPrevented = null;
    e.preventDefault = null;
    e.stopPropagation = null;
    e.persist = null;
    e.bubbles = false;
    e.cancelable = false;
    e.composed = false;
    e.detail = void 0;
    e.relatedTarget = null;
    e.altKey = false;
    e.ctrlKey = false;
    e.metaKey = false;
    e.shiftKey = false;
    e.key = null;
    e.code = null;
    e.which = null;
    e.button = null;
    e.buttons = null;
    e.pointerId = null;
    e.pointerType = null;
    e.isPrimary = null;
    e.clientX = 0;
    e.clientY = 0;
    e.screenX = 0;
    e.screenY = 0;
    e.pageX = null;
    e.pageY = null;
    e.movementX = 0;
    e.movementY = 0;
    e.pressure = null;
    e.tiltX = null;
    e.tiltY = null;
    e.width = null;
    e.height = null;
    e.value = void 0;
    e.checked = void 0;
    e.selectionStart = void 0;
    e.selectionEnd = void 0;
    e.touches = null;
    e.targetTouches = null;
    e.changedTouches = null;
    e.path = null;
    e.repeat = false;
    e.location = 0;
    if (_pool.length < MAX_POOL_SIZE) _pool.push(e);
  }
}
function wrapListener(fn, opts = {}) {
  const { stopPropagationOnTrueReturn = false } = opts;
  return function handler(nativeEvent) {
    const currentTarget = this || nativeEvent.currentTarget || null;
    const sEvent = createSyntheticEvent(nativeEvent, currentTarget);
    try {
      const result = fn(sEvent);
      if (stopPropagationOnTrueReturn && result === true) {
        sEvent.stopPropagation();
      }
    } finally {
      releaseSyntheticEvent(sEvent);
    }
  };
}
function addWrappedEventListener(target, type, fn, options = {}) {
  const handler = wrapListener(fn, options);
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

// .tmp/src/redux.jsx
var redux_exports2 = {};
__export(redux_exports2, {
  Provider: () => Provider,
  combineReducers: () => combineReducers2,
  connect: () => connect,
  useDispatch: () => useDispatch,
  useSelector: () => useSelector,
  useStore: () => useStore
});
var ReduxContext;
function Provider({ store, children }) {
  ReduxContext != null ? ReduxContext : ReduxContext = createContext(null);
  return createComponent(ReduxContext.Provider, { "value": store }, children);
}
function useStore() {
  const store = useContext(ReduxContext);
  if (!store) {
    throw new Error("Could not find Redux store in context. <Provider> is missing.");
  }
  return store;
}
function useDispatch() {
  const store = useStore();
  return store.dispatch;
}
function useSelector(selector, equalityFn = (a, b2) => a === b2) {
  const store = useStore();
  const latestSelected = useRef();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const [selected, setSelected] = useState(() => selector(store.getState()));
  latestSelected.current = selected;
  useEffect(() => {
    function checkForUpdates() {
      const nextSelected = selectorRef.current(store.getState());
      if (!equalityFn(latestSelected.current, nextSelected)) {
        latestSelected.current = nextSelected;
        setSelected(nextSelected);
      }
    }
    const unsubscribe = store.subscribe(checkForUpdates);
    checkForUpdates();
    return unsubscribe;
  }, [store, equalityFn]);
  return selected;
}
function connect(mapStateToProps, mapDispatchToProps) {
  const shouldSubscribe = Boolean(mapStateToProps);
  return function wrapWithConnect(WrappedComponent) {
    function ConnectedComponent(props) {
      const store = useStore();
      let dispatchProps = { dispatch: store.dispatch };
      if (typeof mapDispatchToProps === "function") {
        dispatchProps = mapDispatchToProps(store.dispatch, props);
      } else if (typeof mapDispatchToProps === "object" && mapDispatchToProps !== null) {
        dispatchProps = {};
        const dispatch = store.dispatch;
        for (const key in mapDispatchToProps) {
          const actionCreator = mapDispatchToProps[key];
          dispatchProps[key] = (...args) => dispatch(actionCreator(...args));
        }
      }
      let stateProps = {};
      if (mapStateToProps) {
        const selector = (state) => mapStateToProps(state, props);
        stateProps = useSelector(selector, shallowEqual) || {};
      }
      const mergedProps = { ...props, ...stateProps, ...dispatchProps };
      return createComponent(WrappedComponent, { ...mergedProps });
    }
    return ConnectedComponent;
  };
}
function combineReducers2(reducers) {
  const reducerKeys = Object.keys(reducers);
  for (const key of reducerKeys) {
    if (typeof reducers[key] !== "function") {
      throw new Error(`combineReducers: reducer for key "${key}" is not a function`);
    }
  }
  return function rootReducer(state = {}, action) {
    let hasChanged = false;
    const nextState = {};
    for (const key of reducerKeys) {
      const reducer = reducers[key];
      const prevSlice = state[key];
      const nextSlice = reducer(prevSlice, action);
      nextState[key] = nextSlice;
      hasChanged = hasChanged || nextSlice !== prevSlice;
    }
    return hasChanged ? nextState : state;
  };
}

// .tmp/src/errors.jsx
var errors_exports = {};
__export(errors_exports, {
  blocks_info: () => blocks_info,
  error: () => error,
  globalErrorHandler: () => globalErrorHandler,
  scanBlockLabels: () => scanBlockLabels,
  traceError: () => traceError
});
function getErrorLocation(err) {
  if (err.lineno !== void 0 || err.line !== void 0 || err.lineNumber !== void 0) {
    const l = err.lineNumber || err.lineno || err.line;
    const c = err.columnNumber || err.colno || err.column;
    return { line: l, col: c };
  }
  let match2 = /:(\d+):(\d+)[\n].*/m.exec(err.stack);
  if (match2 === null) {
    match2 = /:(\d+):(\d+)\)\s+at .*/m.exec(err.stack);
  }
  if (match2) {
    return { line: parseInt(match2[1]), col: parseInt(match2[2]) };
  }
  return null;
}
function parseEvalLocationFromStack(stack, urlPrefix = "eval:/") {
  const raw = typeof stack === "string" ? stack : String(stack || "");
  const lines = raw.split(/\r?\n/);
  const re = new RegExp(`\\(?((?:${escapeRegExp(urlPrefix)})[^\\s):]+):(\\d+):(?:(\\d+))?\\)?$`);
  for (const l of lines) {
    const line2 = l.trim();
    if (!line2.includes(urlPrefix)) continue;
    const m = line2.match(re);
    if (!m) continue;
    const url = m[1];
    const parsedLine = Number(m[2]);
    const parsedCol = m[3] == null ? null : Number(m[3]);
    if (Number.isFinite(parsedLine) && (parsedCol === null || Number.isFinite(parsedCol))) {
      return { url, line: parsedLine, col: parsedCol, matched: line2 };
    }
  }
  return { url: null, line: null, col: null, matched: null, stackPreview: lines.slice(0, 6).join("\n") };
}
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function mapLocation(mps, r, c) {
  let map = null;
  for (const i2 in mps) {
    if (mps[i2][0] < r) continue;
    if (mps[i2][0] > r || mps[i2][0] === r && mps[i2][1] >= c) {
      map = mps[i2 - 1];
      break;
    }
  }
  if (!map) map = mps[mps.length - 1];
  return { line: r - map[0] + map[2], col: r - map[0] === 0 ? map[3] : 0 };
}
function scanBlockLabels(code2, path2) {
  const ls = Array.from(code2.matchAll(/LILACTBLOCK(\d+):(\d+),(\d+):([^*]+)\*\//mg));
  ls.forEach(
    (x) => {
      lilact_default.blocks_info.labels[x[1]] = {
        path: path2,
        desc: x[4]
      };
    }
  );
}
function traceError(error2) {
  var _a;
  if (error2 == null ? void 0 : error2.is_traced) {
    return error2;
  }
  const loc = parseEvalLocationFromStack(error2.stack);
  const obj = {
    fileName: ((_a = loc.url) == null ? void 0 : _a.slice(6)) || error2.fileName,
    lineNumber: loc.line,
    columnNumber: loc.col,
    message: error2.message,
    name: error2.name,
    stack: error2.stack,
    _error: error2,
    is_traced: true
  };
  if (error2.name !== "JSXParseError") {
    let mps;
    if (loc.url) {
      const rm = required_scripts[obj.fileName];
      mps = rm.mappings;
      const mloc = mapLocation(mps, obj.lineNumber - 1, obj.columnNumber - 1);
      obj.lineNumber = mloc.line;
      obj.columnNumber = mloc.col;
    } else if (error2.lilact_trace !== void 0) {
      let loc2 = getErrorLocation(error2);
      let mps2;
      let blk;
      if (typeof error2.lilact_trace === "object") {
        blk = lilact_default.blocks_info.labels[error2.lilact_trace[0]];
      } else {
        blk = lilact_default.blocks_info.labels[error2.lilact_trace];
      }
      if (blk) {
        obj.fileName = blk.path;
        obj.label = blk.label;
        mps2 = required_scripts[blk.path].mappings;
        loc2 = mapLocation(mps2, loc2.line - 1, loc2.col - 1);
        obj.lineNumber = loc2.line;
        obj.columnNumber = loc2.col;
      }
    }
  } else {
    const loc2 = getErrorLocation(error2);
    if (error2.fileName) obj.fileName = error2.fileName;
    obj.lineNumber = loc2.line;
    obj.columnNumber = loc2.col;
  }
  lilact_default.error = obj;
  return obj;
}
function globalErrorHandler(error2) {
  if (error2.error) error2 = error2.error;
  error2 = traceError(error2);
  const cls = css(`
			background: linear-gradient(135deg, #fff2f2d4, #ffffffd4);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255,255,255,.25);
			border-radius: 5px;
			box-shadow: 0 10px 30px rgba(0,0,0,.35);
			overflow:hidden;
			min-width: 400px;
			width: 66%;
			red {
				color:#d00;
			}
			code {
				border: 1px solid #0003;
				overflow: auto;
				padding: 10px;
				display: block;
			}
		`);
  const el = document.createElement("dialog");
  el.className = cls;
  el.innerHTML = `<h3 style=""><red>Error!</red></h3>
		<b>${error2.fileName ? "At " + error2.fileName : ""}
		${Number.isFinite(error2.lineNumber) ? ": Line " + (error2.lineNumber + 1) : ""}</b><br><br>
		<b>${error2.name}</b>:&nbsp;<span>${error2.message}</span><br><br>
		${required_scripts[error2.fileName] ? "<code><pre></pre><pre><red></red></pre><pre></pre></code>" : ""}
		${error2._error.componentStackLog ? "<br>Component Stack:<br><code><pre>" + error2._error.componentStackLog + "</pre></code>" : ""}
		`;
  document.body.appendChild(el);
  const pres = el.querySelectorAll("pre");
  if (required_scripts[error2.fileName]) {
    const lines = required_scripts[error2.fileName].code.split("\n");
    if (lines == null ? void 0 : lines[error2.lineNumber - 1])
      pres[0].innerText = lines[error2.lineNumber - 1];
    if (lines == null ? void 0 : lines[error2.lineNumber]) el.querySelector("pre red").innerText = lines[error2.lineNumber];
    if (lines == null ? void 0 : lines[error2.lineNumber + 1])
      pres[2].innerText = lines[error2.lineNumber + 1];
  }
  el.showModal();
}
var blocks_info = { counter: 0, labels: {} };
var error = null;

// .tmp/src/router.jsx
var router_exports = {};
__export(router_exports, {
  HashRouter: () => HashRouter,
  Link: () => Link,
  NavLink: () => NavLink,
  Route: () => Route,
  Routes: () => Routes,
  useLocation: () => useLocation,
  useNavigate: () => useNavigate
});
var RouterContext = createContext(null);
var RouteContext = createContext({ params: {} });
var createURL = (to) => typeof to === "string" ? to : (to.pathname || "") + (to.search || "") + (to.hash || "");
var escapeRegExp2 = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function HashRouter({ children, basename = "" }) {
  const readLocation = () => {
    var _a;
    const raw = window.location.hash || "#/";
    const full = raw.slice(1);
    const baseRe = new RegExp("^" + escapeRegExp2(basename));
    const withoutBase = full.replace(baseRe, "") || "/";
    const [pathAndSearch, hashPart] = withoutBase.split("#");
    const [path2, search = ""] = pathAndSearch.split("?");
    return {
      pathname: path2 || "/",
      search: search ? "?" + search : "",
      hash: hashPart ? "#" + hashPart : "",
      state: (_a = history.state) == null ? void 0 : _a.__state
    };
  };
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const onChange = () => setLocation(readLocation());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    onChange();
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, [basename]);
  const navigate = useCallback((to, { replace: replace2 = false, state } = {}) => {
    if (typeof to === "number") {
      return new Promise((resolve) => {
        let done = false;
        const cleanup = (fn) => {
          if (done) return;
          done = true;
          window.removeEventListener("popstate", onPop);
          window.removeEventListener("hashchange", onHash);
          fn == null ? void 0 : fn();
          resolve();
        };
        const onPop = () => cleanup(() => setLocation(readLocation()));
        const onHash = () => cleanup(() => setLocation(readLocation()));
        window.addEventListener("popstate", onPop, { once: true });
        window.addEventListener("hashchange", onHash, { once: true });
        setTimeout(() => cleanup(() => setLocation(readLocation())), 0);
        history.go(to);
      });
    }
    const url = createURL(to);
    const href = "#" + (basename + url);
    if (replace2) {
      history.replaceState({ __state: state }, "", href);
    } else {
      history.pushState({ __state: state }, "", href);
    }
    setLocation(readLocation());
  }, [basename]);
  return createComponent(RouterContext.Provider, { "value": { location, navigate, basename } }, children);
}
function useLocation() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useLocation must be used inside a Router");
  return ctx.location;
}
function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useNavigate must be used inside a Router");
  return ctx.navigate;
}
function Link({ to, replace: replace2 = false, state, onClick, target, download, className, style, children, ...rest }) {
  const navigate = useNavigate();
  const href = "#" + createURL(to);
  function handleClick(e) {
    if (onClick) onClick(e);
    if (e.defaultPrevented || e.button !== 0 || target && target !== "_self" || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(to, { replace: replace2, state });
  }
  return createComponent("a", { ...rest, "href": href, "onClick": handleClick, "target": target, "download": download, "className": className, "style": style }, children);
}
function normalizePath(p) {
  if (!p) return "/";
  return p.replace(/\/+$/, "") || "/";
}
function NavLink({
  to,
  end = false,
  activeClassName = "active",
  className,
  activeStyle,
  style,
  target,
  download,
  replace: replace2 = false,
  state,
  children,
  onClick,
  ...rest
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const targetPath = typeof to === "string" ? to.split("?")[0].split("#")[0] : to.pathname || "/";
  const currentPath = location.pathname || "/";
  const isActive = end ? normalizePath(currentPath) === normalizePath(targetPath) : normalizePath(currentPath).startsWith(normalizePath(targetPath));
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
  const finalClassName = [resolvedClassName, isActive ? activeClassName : null].filter(Boolean).join(" ") || void 0;
  const resolvedStyle = typeof style === "function" ? style({ isActive }) : style;
  const mergedStyle = isActive ? { ...resolvedStyle || {}, ...activeStyle || {} } : resolvedStyle;
  const href = "#" + createURL(to);
  function handleClick(e) {
    if (onClick) onClick(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(to, { replace: replace2, state });
  }
  return createComponent("a", { ...rest, "href": href, "onClick": handleClick, "target": target, "download": download, "className": finalClassName, "style": mergedStyle, "aria-current": isActive ? "page" : void 0 }, typeof children === "function" ? children({ isActive }) : children);
}
function compilePath(pattern) {
  const paramNames = [];
  let regexSource = "^" + pattern.replace(/\/+$/, "").replace(/([.+?^=!:${}()|[\]/\\])/g, "\\$1").replace(/\\\:([A-Za-z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  }).replace(/\\\*$/g, "(.+?)?");
  regexSource += "/?$";
  const regex = new RegExp(regexSource);
  return { regex, paramNames };
}
function matchPath(pattern, pathname) {
  if (pattern == null) return { matched: true, params: {} };
  const { regex, paramNames } = compilePath(pattern);
  const m = regex.exec(pathname);
  if (!m) return { matched: false };
  const params = {};
  paramNames.forEach((n, i2) => params[n] = decodeURIComponent(m[i2 + 1] || ""));
  if (m.length > paramNames.length + 1) {
    params["*"] = m[paramNames.length + 1] ? decodeURIComponent(m[paramNames.length + 1]) : void 0;
  }
  return { matched: true, params };
}
function Route({ path: path2, element = null, children }) {
  return null;
}
function Routes({ children }) {
  var _a;
  const location = useLocation();
  const pathname = location.pathname || "/";
  const routes = Children.toArray(children);
  for (let i2 = 0; i2 < routes.length; i2++) {
    const route = routes[i2];
    const path2 = route.props.path === void 0 ? null : route.props.path;
    const element = (_a = route.props.element) != null ? _a : null;
    const childRoutes = route.props.children;
    const { matched, params } = matchPath(path2, pathname);
    if (matched) {
      if (element) {
        return createComponent(RouteContext.Provider, { "value": { params } }, element);
      } else if (childRoutes) {
        return createComponent(RouteContext.Provider, { "value": { params } }, createComponent(Routes, {}, childRoutes));
      } else {
        return createComponent(RouteContext.Provider, { "value": { params } }, createComponent("div", {}));
      }
    }
  }
  return null;
}

// .tmp/src/accessories.jsx
var accessories_exports = {};
__export(accessories_exports, {
  DragHandle: () => DragHandle,
  ErrorBoundary: () => ErrorBoundary,
  Spinner: () => Spinner,
  SplitPane: () => SplitPane,
  Suspense: () => Suspense
});
var { css: css2, cx: cx2 } = emotion_css_esm_exports;
function Spinner({
  size = 48,
  className,
  style,
  color = "currentColor",
  strokeWidth = 3,
  "aria-label": ariaLabel = "Loading"
}) {
  const s = Math.max(1, size) + "px";
  return createComponent("div", { "className": className, "style": {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    ...style
  }, "aria-label": ariaLabel, "role": "status" }, createComponent("div", { "style": {
    width: s,
    height: s,
    borderRadius: "50%",
    border: `${strokeWidth}px solid rgba(0,0,0,0.15)`,
    borderTopColor: color,
    animation: "ddSpinnerSpin 0.9s linear infinite",
    boxSizing: "border-box"
  } }), createComponent("style", {}, `
				@keyframes ddSpinnerSpin { to { transform: rotate(360deg); } }
			`));
}
var ErrorBoundary = class extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "displayName", "ErrorBoundary");
    __publicField(this, "state", { hasError: false, error: null });
    __publicField(this, "reset", () => this.setState({ hasError: false, error: null }));
  }
  static getDerivedStateFromError(error2) {
    return { hasError: true, error: error2 };
  }
  componentDidCatch(error2, info) {
    const { onError } = this.props;
    try {
      if (onError) onError(error2, info);
    } catch (e) {
      console.error("onError threw", e);
    }
  }
  render() {
    const { Fallback, children } = this.props;
    if (this.state.hasError) return createComponent(Fallback, { "error": this.state.error, "reset": this.reset });
    return children;
  }
};
var Suspense = class extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "displayName", "Suspense");
    this.state = { showingFallback: false };
    this._pending = /* @__PURE__ */ new Set();
    this._delayTimer = null;
    this._minShowTimer = null;
    this._fallbackShownAt = 0;
  }
  /** @ignore */
  static getDerivedStateFromError(error2) {
    if (isThenable(error2)) {
      return null;
    }
    throw error2;
  }
  /** @ignore */
  componentDidCatch(error2, info) {
    if (!isThenable(error2)) return;
    this._attachPromise(error2);
  }
  /** @ignore */
  componentWillUnmount() {
    this._clearTimers();
    this._pending.clear();
  }
  /** @ignore */
  _clearTimers() {
    if (this._delayTimer) {
      clearTimeout2(this._delayTimer);
      this._delayTimer = null;
    }
    if (this._minShowTimer) {
      clearTimeout2(this._minShowTimer);
      this._minShowTimer = null;
    }
  }
  /** @ignore */
  _attachPromise(promise) {
    if (this._pending.has(promise)) return;
    this._pending.add(promise);
    if (this._pending.size === 1) {
      const delay = Math.max(0, this.props.minDelay);
      if (this._delayTimer) {
        clearTimeout2(this._delayTimer);
        this._delayTimer = null;
      }
      this._delayTimer = setTimeout2(() => {
        this._delayTimer = null;
        this._fallbackShownAt = Date.now();
        this.setState({ showingFallback: true });
      }, delay);
    }
    const onSettled = () => {
      if (this._pending.has(promise)) {
        this._pending.delete(promise);
      }
      if (this._pending.size === 0) {
        if (this._delayTimer) {
          clearTimeout2(this._delayTimer);
          this._delayTimer = null;
          this.setState({ showingFallback: false });
          return;
        }
        const elapsed = Date.now() - (this._fallbackShownAt || 0);
        const remaining = Math.max(0, this.props.minShowTime - elapsed);
        if (remaining === 0) {
          this.setState({ showingFallback: false });
        } else {
          if (this._minShowTimer) {
            clearTimeout2(this._minShowTimer);
            this._minShowTimer = null;
          }
          this._minShowTimer = setTimeout2(() => {
            this._minShowTimer = null;
            this.setState({ showingFallback: false });
          }, remaining);
        }
      }
    };
    promise.then(onSettled, onSettled);
  }
  /** @ignore */
  render() {
    if (this.state.showingFallback) {
      return createComponent(Fragment, {}, this.props.fallback);
    }
    return createComponent(Fragment, {}, this.props.children);
  }
};
__publicField(Suspense, "defaultProps", { minDelay: 200, minShowTime: 300 });
function DragHandle({
  onDelta,
  onStart,
  onEnd,
  style,
  className,
  children,
  data
}) {
  const activePointerIdRef = useRef(null);
  const startClientXRef = useRef(0);
  const startClientYRef = useRef(0);
  const lastClientXRef = useRef(0);
  const lastClientYRef = useRef(0);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const resetDrag = useCallback(() => {
    activePointerIdRef.current = null;
    draggingRef.current = false;
    startClientXRef.current = 0;
    startClientYRef.current = 0;
    lastClientXRef.current = 0;
    lastClientYRef.current = 0;
    setIsDragging(false);
  }, []);
  const computeDeltaFromStart = useCallback((clientX, clientY) => {
    const dx = clientX - startClientXRef.current;
    const dy = clientY - startClientYRef.current;
    return { dx, dy };
  }, []);
  const endDrag = useCallback((reason = "up") => {
    if (!draggingRef.current) return;
    onEnd == null ? void 0 : onEnd(reason);
    resetDrag();
  }, [onEnd, resetDrag]);
  const onPointerDown = useCallback((e) => {
    if (e.button != null && e.button !== 0) return;
    draggingRef.current = true;
    activePointerIdRef.current = e.pointerId;
    startClientXRef.current = e.clientX;
    startClientYRef.current = e.clientY;
    lastClientXRef.current = e.clientX;
    lastClientYRef.current = e.clientY;
    setIsDragging(true);
    onStart == null ? void 0 : onStart(data);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (e2) {
    }
  }, [onStart]);
  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    const { dx, dy } = computeDeltaFromStart(e.clientX, e.clientY);
    onDelta == null ? void 0 : onDelta(dx, dy, data);
    lastClientXRef.current = e.clientX;
    lastClientYRef.current = e.clientY;
  }, [computeDeltaFromStart, onDelta]);
  const onPointerUp = useCallback((e) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    endDrag("up", data);
  }, [endDrag]);
  const onPointerCancel = useCallback((e) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    endDrag("cancel", data);
  }, [endDrag]);
  return createComponent("div", { "role": "button", "tabIndex": 0, "style": { ...style, touchAction: "none" }, "className": cx2(className, isDragging ? "dragging" : ""), "onPointerDown": onPointerDown, "onPointerMove": onPointerMove, "onPointerUp": onPointerUp, "onPointerCancel": onPointerCancel }, children);
}
var SplitPane = forwardRef(function SplitPane2({
  mode = "horizontal",
  position: position2,
  defaultPosition = 0.5,
  min = 0.1,
  max = 0.9,
  splitterSize = 8,
  onSizeChange,
  style,
  className,
  firstPaneStyle,
  secondPaneStyle,
  splitterStyle,
  children
}, ref) {
  const initialMode = mode === "vertical" ? "vertical" : "horizontal";
  const [internalMode, setInternalMode] = useState(initialMode);
  const [internalPos, setInternalPos] = useState(clamp(defaultPosition, min, max));
  const posResolved = position2 == null ? internalPos : clamp(position2, min, max);
  useEffect(() => {
    if (position2 == null) return;
    setInternalPos(clamp(position2, min, max));
  }, [position2, min, max]);
  useEffect(() => {
    setInternalMode(mode === "vertical" ? "vertical" : "horizontal");
  }, [mode]);
  const setPosition = (next2) => {
    const clamped = clamp(next2, min, max);
    if (position2 == null) setInternalPos(clamped);
    onSizeChange == null ? void 0 : onSizeChange(clamped);
  };
  useImperativeHandle(ref, () => ({
    setPosition,
    setMode: (nextMode) => setInternalMode(nextMode === "vertical" ? "vertical" : "horizontal"),
    getPosition: () => posResolved,
    getMode: () => internalMode
  }));
  const containerRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect2 = el.getBoundingClientRect();
      sizeRef.current = { w: rect2.width, h: rect2.height };
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    sizeRef.current = { w: rect.width, h: rect.height };
    return () => ro.disconnect();
  }, []);
  const startPosRef = useRef(posResolved);
  const [dragging, setDragging] = useState(false);
  const handleStart = () => {
    setDragging(true);
    startPosRef.current = posResolved;
  };
  const handleDelta = (x, y, _data) => {
    const { w, h } = sizeRef.current;
    if (internalMode === "horizontal") {
      setPosition(startPosRef.current + x / (w || 1));
    } else {
      setPosition(startPosRef.current + y / (h || 1));
    }
  };
  const handleEnd = () => setDragging(false);
  const arr = Children.toArray(children);
  const firstChild = arr[0];
  const secondChild = arr[1];
  const p = posResolved;
  const pane1StyleAbs = internalMode === "horizontal" ? {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: `calc(${p} * (100% - ${splitterSize}px))`,
    overflow: "auto",
    ...firstPaneStyle || {}
  } : {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: `calc(${p} * (100% - ${splitterSize}px))`,
    overflow: "auto",
    ...firstPaneStyle || {}
  };
  const pane2StyleAbs = internalMode === "horizontal" ? {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `calc(${p} * (100% - ${splitterSize}px) + ${splitterSize}px)`,
    right: 0,
    overflow: "auto",
    ...secondPaneStyle || {}
  } : {
    position: "absolute",
    left: 0,
    right: 0,
    top: `calc(${p} * (100% - ${splitterSize}px) + ${splitterSize}px)`,
    bottom: 0,
    overflow: "auto",
    ...secondPaneStyle || {}
  };
  const splitterBase = {
    background: "rgba(0,0,0,0.08)",
    boxShadow: "inset 0 0 2px rgba(0,0,0,0.25)",
    zIndex: 10
  };
  const splitterAbsStyle = internalMode === "horizontal" ? {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `calc(${p} * (100% - ${splitterSize}px))`,
    width: splitterSize,
    height: "100%",
    cursor: dragging ? "col-resize" : "col-resize",
    touchAction: "none",
    pointerEvents: "auto",
    ...splitterBase,
    ...splitterStyle || {}
  } : {
    position: "absolute",
    left: 0,
    right: 0,
    top: `calc(${p} * (100% - ${splitterSize}px))`,
    height: splitterSize,
    width: "100%",
    cursor: dragging ? "row-resize" : "row-resize",
    touchAction: "none",
    pointerEvents: "auto",
    ...splitterBase,
    ...splitterStyle || {}
  };
  return createComponent("div", { "ref": containerRef, "className": className, "style": {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    ...style || {}
  } }, createComponent("div", { "style": pane1StyleAbs }, firstChild), createComponent("div", { "style": pane2StyleAbs }, secondChild), createComponent(DragHandle, { "onStart": handleStart, "onDelta": handleDelta, "onEnd": handleEnd, "style": splitterAbsStyle, "className": "splitter" }));
});
var clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// .tmp/src/vlq.js
var char_to_integer = {};
var integer_to_char = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".split("").forEach(function(char2, i2) {
  char_to_integer[char2] = i2;
  integer_to_char[i2] = char2;
});
function encode(...value) {
  if (typeof value === "number") {
    return encode_integer(value);
  }
  let result = "";
  for (let i2 = 0; i2 < value.length; i2 += 1) {
    result += encode_integer(value[i2]);
  }
  return result;
}
function encode_integer(num) {
  let result = "";
  if (num < 0) {
    num = -num << 1 | 1;
  } else {
    num <<= 1;
  }
  do {
    let clamped = num & 31;
    num >>>= 5;
    if (num > 0) {
      clamped |= 32;
    }
    result += integer_to_char[clamped];
  } while (num > 0);
  return result;
}

// .tmp/src/jsx.js
var transpilerConfig = {
  //addons: jsxAddons, // addons are not used anymore
  setBlockLabels: true,
  enableLabelStack: false,
  injectLabels: true,
  // todo: alt+shift+7 on apple abc extended layout is better i think, 
  // but my current editor doesn't support syntax highlighting with it.
  preprocessorDelimiter: "\u0294"
  // alt+shift+. on apple abc extended layout   
};
var TRANSPILER_OUTPUT = /* @__PURE__ */ Symbol.for("LILACT:TRANSPILER_OUTPUT");
var raiseError;
var tab = 0;
function lookAhead(f, code2, index2, ...args) {
  const b2 = f(code2, index2, ...args);
  if (b2) {
    return [b2.end, b2];
  }
  return [index2];
}
function parseRegex(code, index, container) {
  let i = index;
  let dels = `;=,([{}!^~&|:?*%-+/<>${transpilerConfig.preprocessorDelimiter}`;
  while (--i > 0) {
    if (" 	\r".indexOf(code[i]) !== -1) continue;
    if (code[i] === "\n") {
      dels += ")]";
      continue;
    }
    if (dels.indexOf(code[i]) !== -1) break;
    return;
  }
  const b = {
    type: "regex",
    begin: index++
  };
  while (index < code.length) {
    const ch = code[index];
    switch (ch) {
      case "\n":
        return;
      case "/":
        try {
          eval("const x=" + code.slice(b.begin, index + 1));
          b.end = index + 1;
          if (container) container.children.push(b);
          return b;
        } catch (e) {
        }
      default:
        index++;
    }
  }
}
function parseComment(code2, index2, container2) {
  const b2 = {
    type: "comment",
    begin: index2++
  };
  if (code2[index2] !== "*" && code2[index2] !== "/") {
    return parseRegex(code2, index2 - 1, container2);
  }
  const is_multiline = code2[index2] === "*";
  index2++;
  while (index2 < code2.length) {
    const ch2 = code2[index2];
    switch (ch2) {
      case "*":
        if (is_multiline && code2[index2 + 1] === "/") {
          b2.end = index2 + 2;
          if (container2) container2.children.push(b2);
          return b2;
        }
        break;
      case "\n":
        if (!is_multiline) {
          b2.end = index2 + 1;
          if (container2) container2.children.push(b2);
          return b2;
        }
        break;
    }
    index2++;
  }
  raiseError(`Unterminated comment`, b2.begin);
}
function parseDirective(code2, index2, container2) {
  let i2 = index2 + 1;
  while (code2[i2] && (code2[i2] !== "\n" && code2[i2] !== transpilerConfig.preprocessorDelimiter) || code2[i2 - 1] === "\\") {
    i2++;
  }
  const is_exp = code2[i2] === transpilerConfig.preprocessorDelimiter;
  if (is_exp) {
    const b2 = {
      type: "directive",
      begin: index2,
      cbegin: index2,
      end: i2 + 1,
      expression: code2.slice(index2 + 1, i2).replace(/\\(.)/gs, "$1"),
      value: ""
    };
    if (container2) container2.children.push(b2);
    return b2;
  } else {
    let j = index2;
    while (j-- >= 0 && (code2[j] === " " || code2[j] === "	")) ;
    const is_first = j === -1 || code2[j] === "\n";
    if (is_first) {
      const b2 = {
        type: "directive",
        begin: index2,
        cbegin: index2,
        end: i2 + 1,
        pragma: code2.slice(index2 + 1, i2 + 1).replace(/\\(.)/gs, "$1"),
        value: ""
      };
      if (container2) container2.children.push(b2);
      return b2;
    }
  }
  raiseError("Error in preprocessor statement", index2);
}
function preprocessPragmas(node, context) {
  const all_nodes = [];
  var segments = [];
  var scope_stack = [];
  var last_block = null;
  const clone_block = (i2, val) => {
    var _a, _b;
    last_block = typeof all_nodes[i2] === "object" ? structuredClone(
      { ...all_nodes[i2], children: void 0, attributes: {} }
    ) : all_nodes[i2];
    if (last_block.type === "directive") {
      last_block.value = val;
    }
    (_b = (_a = scope_stack[0]).out) != null ? _b : _a.out = [];
    scope_stack[0].out.push(last_block);
    return last_block;
  };
  const clone_attr = (i2, name) => {
    last_block = typeof all_nodes[i2] === "object" ? structuredClone(
      { ...all_nodes[i2], children: void 0, attributes: {} }
    ) : all_nodes[i2];
    scope_stack[0].attributes[name] = last_block;
    return last_block;
  };
  const push_scope = () => {
    scope_stack = [last_block, scope_stack];
  };
  const pop_scope = () => {
    scope_stack = scope_stack[1];
  };
  const vine_traverse = (nd) => {
    if (typeof nd !== "object") return segments;
    segments.push(`push_scope();`);
    if (nd.attributes) {
      for (const attr in nd.attributes) {
        const ch2 = nd.attributes[attr];
        all_nodes.push(ch2);
        segments.push(`clone_attr(${all_nodes.length - 1}, "${attr}");`);
        vine_traverse(ch2);
      }
    }
    if (nd.children) {
      for (const ch2 of nd.children) {
        all_nodes.push(ch2);
        if (ch2.type === "directive" && ch2.expression === void 0) {
          segments.push(ch2.pragma);
        } else {
          if (ch2.expression)
            segments.push(`clone_block(${all_nodes.length - 1}, ${ch2.expression});`);
          else
            segments.push(`clone_block(${all_nodes.length - 1});`);
          vine_traverse(ch2);
        }
      }
    }
    segments.push(`pop_scope();`);
    return segments;
  };
  node.out = [];
  last_block = node;
  push_scope();
  vine_traverse(node);
  const cmd = segments.join("\n");
  eval(cmd);
  return segments;
}
function parseString(code2, index2, q, container2) {
  const b2 = {
    type: "string",
    begin: index2++,
    cbegin: index2
  };
  while (index2 < code2.length) {
    const ch2 = code2[index2];
    switch (ch2) {
      case q:
        b2.cend = index2;
        b2.end = index2 + 1;
        if (container2) container2.children.push(b2);
        return b2;
      case "\n":
        if (q !== "`") raiseError(`Unterminated string`, b2.begin);
        break;
      case "$":
        if (q === "`") {
          if (code2[index2 + 1] === "{") {
            [index2] = lookAhead(parseJS, code2, index2 + 1, true, container2);
            index2--;
          }
        }
        break;
      case "\\":
        index2++;
        break;
    }
    index2++;
  }
  raiseError(`Unterminated string`, b2.begin);
}
function parseXMLContent(code2, index2, container2, eols) {
  let i2 = index2;
  let cur = index2;
  while (i2 < code2.length) {
    switch (code2[i2]) {
      case "<":
        if (code2[i2 + 1] === "/") {
          i2 += 2;
          let j2 = i2;
          while (j2 < code2.length && code2[j2] !== ">") {
            j2++;
          }
          if (j2 === code2.length) {
            return null;
          }
          const tag = code2.substring(i2, j2).trim();
          if (container2.tag !== tag) {
            raiseError(`Ill-formed xml (not closed properly)`, index2);
          }
          container2.end = j2 + 1;
          container2.cbegin = index2 + 1;
          container2.cend = i2 - 2;
          return j2;
        } else {
          [i2] = lookAhead(parseXML, code2, i2, container2);
          if (i2 > cur) {
            cur = i2;
            i2--;
          } else cur++;
        }
        break;
      case "{":
        const j = i2;
        [i2] = lookAhead(parseJS, code2, i2, true, container2);
        i2--;
        break;
    }
    i2++;
  }
  return cur;
}
function parseXML(code2, index2, container2, look_behind = false) {
  if (look_behind) {
    const prevs = [
      /*'return', 'yield', 'throw', */
      "=",
      ",",
      "(",
      "&",
      "|",
      "?",
      ":",
      "{",
      "["
    ];
    let i3 = index2;
    while (--i3 > 0) {
      if (" 	\r\n".indexOf(code2[i3]) !== -1) continue;
      if (prevs.indexOf(code2[i3]) !== -1) break;
      if (i3 > 1 && code2[i3 - 1] === "=" && code2[i3] === ">") break;
      if (i3 >= 5) {
        if (code2.slice(i3 - 5, i3 + 1) === "return") {
          if (i3 > 5) {
            if (" 	\r\n{};)".indexOf(code2[i3 - 6]) === -1) return;
          }
          break;
        }
      }
      if (i3 >= 4) {
        if (code2.slice(i3 - 4, i3 + 1) === "yield" || code2.slice(i3 - 4, i3 + 1) === "throw") {
          if (i3 > 4) {
            if (" 	\r\n{};)".indexOf(code2[i3 - 5]) === -1) return;
          }
          break;
        }
      }
      return;
    }
  }
  const delims = [
    " ",
    "	",
    "\n",
    "/",
    "&",
    "^",
    "%",
    "|",
    "!",
    "~",
    "+",
    "*",
    "?",
    "<",
    ">",
    ";",
    ",",
    "=",
    "{",
    "}",
    "(",
    ")",
    "[",
    "]",
    "'",
    '"',
    "`",
    "\\",
    "",
    void 0
  ];
  const skip_spaces = () => {
    while (code2[index2] === " " || code2[index2] === "	" || code2[index2] === "\n") index2++;
  };
  const b2 = {
    // block
    type: "xml",
    begin: index2++,
    children: [],
    attributes: {},
    self_closing: false,
    js_attributes: []
  };
  skip_spaces();
  let i2 = index2;
  while (i2 < code2.length && delims.indexOf(code2[i2]) === -1) i2++;
  if (i2 === code2.length) return;
  b2.tag = code2.substring(index2, i2);
  index2 = i2;
  let last_attr = void 0;
  while (index2 < code2.length) {
    i2 = index2;
    while (i2 < code2.length && delims.indexOf(code2[i2]) === -1) {
      i2++;
    }
    if (i2 === code2.length) return;
    const tok = code2.substring(index2, i2);
    if (tok.length) {
      last_attr = tok;
      b2.attributes[tok] = true;
    }
    index2 = i2;
    switch (code2[index2]) {
      case "=":
        if (last_attr) {
          index2++;
          skip_spaces();
          while (code2[index2] === "/") {
            const res3 = lookAhead(parseComment, code2, index2);
            if (res3[0] > index2) index2 = res3[0];
            else index2++;
            skip_spaces();
          }
          let av;
          switch (code2[index2]) {
            case "'":
            case '"':
              [index2, av] = lookAhead(parseString, code2, index2, code2[index2]);
              b2.attributes[last_attr] = av;
              last_attr = void 0;
              break;
            case "{":
              [index2, av] = lookAhead(parseJS, code2, index2, true);
              b2.attributes[last_attr] = av;
              last_attr = void 0;
              break;
            default:
              i2 = index2;
              while (i2 < code2.length && delims.indexOf(code2[i2]) === -1) {
                i2++;
              }
              if (i2 === code2.length) {
                return;
              }
              const tok2 = code2.substring(index2, i2);
              index2 = i2;
              b2.attributes[last_attr] = tok2;
              last_attr = void 0;
          }
        } else {
          return;
        }
        break;
      case "{":
        let jsc;
        [index2, jsc] = lookAhead(parseJS, code2, index2, true);
        jsc.is_xml_js = true;
        b2.js_attributes.push(jsc);
        break;
      case "/":
        if (code2[index2 + 1] === ">") {
          b2.end = index2 + 2;
          b2.cbegin = b2.begin;
          b2.cend = b2.end;
          b2.self_closing = true;
          if (container2) container2.children.push(b2);
          return b2;
        }
        const res2 = lookAhead(parseComment, code2, index2);
        if (res2[0] > index2) index2 = res2[0];
        else index2++;
        break;
      case ">":
        const j = parseXMLContent(code2, index2, b2);
        if (j === null) return;
        if (j > index2) index2 = j;
        else index2++;
        if (b2.end) {
          if (container2) container2.children.push(b2);
          return b2;
        } else {
          index2++;
        }
        break;
      case " ":
      case "	":
      case "\n":
        skip_spaces();
        break;
      default:
        return;
    }
  }
}
function parseParanthesis(code2, index2, container2) {
  const b2 = {
    // block
    type: "paranthesis",
    begin: index2,
    cbegin: ++index2,
    children: [],
    self_closing: false
  };
  while (index2 < code2.length) {
    const ch2 = code2[index2];
    switch (ch2) {
      case "<": {
        let [i3] = lookAhead(parseXML, code2, index2, b2, true);
        if (i3 > index2) index2 = i3;
        else index2++;
        break;
      }
      case '"':
      case "'":
      case "`":
        [index2] = lookAhead(parseString, code2, index2, ch2);
        break;
      case "{":
        [index2] = lookAhead(parseJS, code2, index2, true, b2);
        break;
      case "(":
        [index2] = lookAhead(parseParanthesis, code2, index2, b2);
        break;
      case "}":
        raiseError(`Unmatched curly bracket`, b2.begin);
        break;
      case ")":
        b2.end = index2 + 1;
        b2.cend = index2;
        if (container2) container2.children.push(b2);
        return b2;
      case "/":
        const [i2] = lookAhead(parseComment, code2, index2, b2);
        if (i2 > index2) index2 = i2;
        else index2++;
        break;
      case "\\":
        index2++;
      default:
        index2++;
        break;
    }
  }
  raiseError(`Unterminated paranthesis block`, b2.begin);
}
function parseJS(code2, index2 = 0, is_block = false, container2) {
  const b2 = {
    // block
    type: "js",
    begin: index2,
    cbegin: index2 += is_block ? 1 : 0,
    children: []
  };
  while (index2 < code2.length) {
    const ch2 = code2[index2];
    switch (ch2) {
      case "<": {
        let [i2] = lookAhead(parseXML, code2, index2, b2, true);
        if (i2 > index2) index2 = i2;
        else index2++;
        break;
      }
      case '"':
      case "'":
      case "`":
        [index2] = lookAhead(parseString, code2, index2, ch2);
        break;
      case "{": {
        const i2 = index2;
        [index2] = lookAhead(parseJS, code2, index2, true, b2);
        break;
      }
      case "(":
        [index2] = lookAhead(parseParanthesis, code2, index2, b2);
        break;
      case ")":
        raiseError(`Unmatched paranthesis`, b2.begin);
        break;
      case "}":
        if (is_block) {
          b2.end = index2 + 1;
          b2.cend = index2;
          if (container2) container2.children.push(b2);
          return b2;
        }
        raiseError(`Unmatched curly bracket`, b2.begin);
        break;
      case "/": {
        let [i2] = lookAhead(parseComment, code2, index2, b2);
        if (i2 > index2) index2 = i2;
        else index2++;
        break;
      }
      case transpilerConfig.preprocessorDelimiter: {
        let [i2] = lookAhead(parseDirective, code2, index2, b2);
        if (i2 > index2) index2 = i2;
        else index2++;
        break;
      }
      case "\\":
        index2++;
      default:
        index2++;
    }
  }
  if (is_block) raiseError(`Unterminated JS block`, b2.begin);
  b2.end = index2;
  b2.cend = index2;
  if (container2) container2.children.push(b2);
  return b2;
}
function labelFunctions(node3, eols, blocks_info2) {
  node3.already_labeled = true;
  function getNext(i3, step = 1) {
    while ((i3 += step) < node3.children.length && i3 >= 0) {
      const ch2 = node3.children[i3];
      if (typeof ch2 === "string") {
        const t = ch2.trim();
        if (t.length) return [i3, t];
      }
      if (typeof ch2 === "object" && ch2.type !== "comment") {
        return [i3, ch2];
      }
    }
    return [null, null];
  }
  let i2, nxt, prev2;
  for (let chi = 0; chi < node3.children.length; chi++) {
    if (typeof node3.children[chi] === "object" && node3.children[chi].type === "paranthesis") {
      [i2, prev2] = getNext(chi, -1);
      if (prev2 === null) continue;
      if (typeof prev2 !== "string" || ["switch", "catch", "try", "class"].find((x) => prev2.trim().endsWith(x)) !== void 0) continue;
      let label = prev2;
      [i2, prev2] = getNext(i2, -1);
      if (prev2 === null) continue;
      if (typeof prev2 === "string" && ["extern", "class"].indexOf(prev2) !== -1) continue;
      [i2, nxt] = getNext(chi);
      if (nxt === null) continue;
      if (transpilerConfig.injectTraceLabels && typeof nxt === "object" && nxt.type === "js") {
        const begin = getRowCol(eols, chi);
        nxt.children.splice(1, 0, `/*LILACTBLOCK${++blocks_info2.counter}:${begin}:${label}*/try{`);
        if (transpilerConfig.enableLabelStack) {
          nxt.children.splice(nxt.children.length - 1, 0, `} catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=[${blocks_info2.counter},e.lilact_trace];throw e}`);
        } else {
          nxt.children.splice(nxt.children.length - 1, 0, `} catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=${blocks_info2.counter};throw e}`);
        }
        chi += 2;
      }
    } else if (node3.children[chi] === "=>") {
      [i2, prev2] = getNext(chi, -1);
      if (typeof prev2 === "object" && prev2.type === "paranthesis") {
        const begin = getRowCol(eols, prev2.begin);
        [i2, nxt] = getNext(chi);
        if (typeof nxt === "object" && nxt.type === "js") {
          if (transpilerConfig.injectTraceLabels) {
            nxt.children.splice(
              1,
              0,
              `/*LILACTBLOCK${++blocks_info2.counter}:${begin}:<ARROW>*/try {`
            );
            if (transpilerConfig.enableLabelStack) {
              nxt.children.splice(
                nxt.children.length - 1,
                0,
                `} catch(e){if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=[${blocks_info2.counter},e.lilact_trace];throw e}`
              );
            } else {
              nxt.children.splice(
                nxt.children.length - 1,
                0,
                `} catch(e){if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=${blocks_info2.counter};throw e}`
              );
            }
          }
          chi += 2;
        }
      }
    }
  }
}
function scanEOLs(code2) {
  const endlines = [0];
  for (let i2 in code2) {
    if (code2[i2] === "\n") {
      endlines.push(parseInt(i2));
    }
  }
  endlines.push(code2.length);
  return endlines;
}
function getRowCol(eols, i2) {
  if (!eols.last) eols.last = 1;
  while (i2 > eols[eols.last]) {
    eols.last++;
    if (eols.last === eols.length) {
      eols.last = eols.length - 1;
      break;
    }
  }
  while (i2 < eols[eols.last - 1] && eols.last > 1) {
    eols.last--;
  }
  return [eols.last - 1, i2 - eols[eols.last - 1]];
}
function generateSourceMap(json, path2, jsx_eols, out_eols, mappings2 = []) {
  let mpps = [];
  const sourcemap = {
    "version": 3,
    "file": path2,
    "sourceRoot": "",
    "sources": [path2],
    "names": [],
    "mappings": ""
  };
  const scan_leaves = (node3) => {
    var _a;
    if (((_a = node3.out) == null ? void 0 : _a.length) > 0) {
      for (const ch2 of node3.out) {
        scan_leaves(ch2);
      }
    }
    if (node3.begin !== void 0 && node3.out_index !== void 0) {
      mpps.push([...getRowCol(out_eols, node3.out_index), ...getRowCol(jsx_eols, node3.begin), node3]);
    }
  };
  scan_leaves(json);
  mpps = mpps.sort(
    (a, b2) => {
      if (a[0] == b2[0]) {
        return a[1] - b2[1];
      }
      return a[0] - b2[0];
    }
  );
  mappings2.push(...mpps);
  let mstr = "";
  let r = 0, oc = 0;
  let lr = 0, lc = 0;
  for (let i2 = 0; i2 < mpps.length; i2++) {
    const m = mpps[i2];
    while (r < m[0]) {
      oc = 0;
      mstr += ";";
      r++;
    }
    mstr += ",";
    mstr += encode(m[1] - oc, 0, m[2] - lr, m[3] - lc);
    oc = m[1];
    lr = m[2];
    lc = m[3];
  }
  sourcemap.mappings = mstr.substring(1).replace(/;,/g, ";");
  return "\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64," + btoa(JSON.stringify(sourcemap));
}
function transpileJSX(jsx2, {
  factory = "createComponent",
  fragment = "Fragment",
  path: path2 = "anonymous",
  appendSourcemap = true,
  injectTraceLabels = false,
  discardComments = false,
  // lilact internal
  blocks_info: blocks_info2 = {
    labels: {},
    counter: 0
  },
  mappings: mappings2 = []
} = {}) {
  var _a, _b;
  (_a = transpilerConfig.preprocessorDelimiter) != null ? _a : transpilerConfig.preprocessorDelimiter = "\u0294";
  (_b = transpilerConfig.injectTraceLabels) != null ? _b : transpilerConfig.injectTraceLabels = injectTraceLabels;
  const eols = scanEOLs(jsx2);
  raiseError = ((eols2, msg, index2) => {
    const er = new Error(msg);
    er.name = "JSXParseError";
    [er.lineNumber, er.columnNumber] = getRowCol(eols2, index2);
    er.fileName = path2;
    er.lilact_trace = "parse";
    throw er;
  }).bind(null, eols);
  const tokenize_re = /([\{\}\(\),;\[\]\n]|[\s^\n]+)/g;
  const json = parseJS(jsx2);
  json.data = jsx2;
  const prepare = (node3) => {
    if (node3.attributes !== void 0) {
      for (const attr in node3.attributes) {
        if (typeof node3.attributes[attr] === "object") {
          prepare(node3.attributes[attr]);
        }
      }
    }
    if (node3.children !== void 0 && !node3.self_closing) {
      let i2 = node3.type === "js" ? node3.begin : node3.cbegin || node3.begin;
      for (let chi = 0; chi < node3.children.length; chi++) {
        const ch2 = node3.children[chi];
        if (ch2.begin > i2) {
          let s = jsx2.substring(i2, ch2.begin);
          if (node3.type === "xml") s = s.trim();
          if (s.length) {
            if (node3.type === "xml") {
              node3.children.splice(chi, 0, '"' + s.replaceAll("\n", "\\\n").replaceAll('"', '\\"') + '"');
            } else {
              node3.children.splice(chi, 0, ...s.split(tokenize_re));
            }
            chi++;
          }
        }
        i2 = ch2.end;
        prepare(ch2);
      }
      const e = node3.type === "js" ? node3.end : node3.cend || node3.end;
      if (i2 < e && !node3.self_closing) {
        let s = jsx2.substring(i2, e);
        if (node3.type === "xml") s = s.trim();
        if (s.length) {
          if (node3.type === "xml") {
            node3.children.push('"' + s.replace(/[\\\"\n]/g, (m) => ({
              "\\": "\\\\",
              '"': '\\"',
              "\n": "\\\n"
            })[m]) + '"');
          } else {
            node3.children.push(...s.split(tokenize_re));
          }
        }
      }
      node3.children = node3.children.filter((x) => x !== "");
      if (transpilerConfig.setBlockLabels && !node3.already_labeled) {
        labelFunctions(node3, eols, blocks_info2);
      }
    }
  };
  prepare(json);
  preprocessPragmas(json);
  const codify = (outlen, node3, is_attr = false, is_xml = false) => {
    if (typeof node3 !== "object") return node3;
    node3.out_index = outlen;
    if (node3.type === "string") return jsx2.substring(node3.begin, node3.end);
    if (node3.type === "regex") return jsx2.substring(node3.begin, node3.end);
    if (node3.type === "comment") return discardComments || is_attr ? "" : jsx2.substring(node3.begin, node3.end);
    if (node3.type === "directive") return node3.value;
    if (node3.type === "paranthesis") {
      let out2 = "(";
      if (node3.out) {
        for (const ch2 of node3.out) {
          out2 += codify(outlen + out2.length - 1, ch2);
        }
      }
      return out2 + ")";
    }
    if (node3.type === "js") {
      let out2 = "";
      if (node3.out) {
        for (const ch2 of node3.out) {
          if (is_xml && ch2.type === "comment") continue;
          out2 += codify(outlen + out2.length - (is_attr ? 1 : 0), ch2);
        }
      }
      if (is_attr) {
        return out2.substring(1, out2.length - 1);
      }
      if (node3 == null ? void 0 : node3.is_xml_js) {
        return jsx2.substring(node3.begin + 1, node3.end - 1);
      }
      return out2;
    }
    if (node3.type === "xml") {
      if (node3.tag.length === 0) {
        node3.tag = fragment;
      } else if (node3.tag[0] !== node3.tag[0].toUpperCase()) {
        node3.tag = `"${node3.tag}"`;
      }
      let out2 = "";
      let is_first = true;
      for (const a of node3.js_attributes) {
        let oo = codify(outlen + out2.length, a, false);
        out2 += `${is_first ? "" : ", "}${oo}`;
        is_first = false;
      }
      if (node3.attributes) {
        for (const a in node3.attributes) {
          out2 += `${is_first ? "" : ", "}"${a}": ${codify(outlen + out2.length, node3.attributes[a], true)}`;
          is_first = false;
        }
      }
      out2 += " }";
      if (node3.out) {
        for (const ch2 of node3.out) {
          const o = codify(outlen + out2.length, ch2, true, true);
          if (o.length > 0) {
            out2 += `, ${o}`;
            is_first = false;
          }
        }
      }
      const loc = getRowCol(eols, node3.begin);
      out2 = ` ${factory}( ${node3.tag}, { ${out2} )`;
      return out2;
    }
  };
  let out = "";
  if (injectTraceLabels) {
    out = `/*LILACTBLOCK${++blocks_info2.counter}:0,0:<EXEC>*/try{`;
  }
  out += codify(out.length, json);
  if (injectTraceLabels) {
    if (transpilerConfig.enableLabelStack) {
      out += `}catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=[${blocks_info2.counter},e.lilact_trace];throw e}`;
    } else {
      out += `}catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=${blocks_info2.counter};throw e}`;
    }
  }
  const inline_sm = generateSourceMap(json, path2, eols, scanEOLs(out), mappings2);
  if (appendSourcemap) {
    out += inline_sm;
  }
  return out;
}

// .tmp/src/lilact.jsx
var Lilact2 = {
  VERSION: "beta.18",
  // Configuration
  defaultTransitionTimeout: 300,
  defaultIsEqual: Object.is,
  // user can set it in your initializer code, and can be changed later too.
  // Units 
  ...misc_exports,
  ...run_exports,
  ...components_exports,
  ...hooks_exports,
  ...transition_exports,
  ...redux_exports2,
  ...timers_exports,
  ...events_exports,
  ...errors_exports,
  ...router_exports,
  ...accessories_exports,
  transpileJSX,
  transpilerConfig,
  // Dependencies
  PropTypes,
  redux: redux_exports,
  emotion: emotion_css_esm_exports
};
globalThis.Lilact = Lilact2;
globalThis.createComponent = Lilact2.createComponent;
globalThis.Fragment = Lilact2.Fragment;
document.addEventListener("DOMContentLoaded", () => {
  Lilact2.runScripts();
});
if (true) {
  window.addEventListener("error", (e) => {
    Lilact2.globalErrorHandler(e);
  });
}
if (true) {
  console.log(`Lilact (Version: ${Lilact2.VERSION}) - Debug Mode`);
  console.log(`Copyright(C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>`);
}
var lilact_default = Lilact2;
export {
  CSSTransition,
  Children,
  Component,
  DragHandle,
  ErrorBoundary,
  Fragment2 as Fragment,
  HTMLComponent,
  HashRouter,
  Lilact2 as Lilact,
  Link,
  NavLink,
  PropTypes,
  Provider,
  RootComponent,
  Route,
  Routes,
  Spinner,
  SplitPane,
  Suspense,
  SwitchTransition,
  Transition,
  TransitionGroup,
  addWrappedEventListener,
  animationFramePromise,
  blocks_info,
  boolean_html_attributes_set,
  capture_events_set,
  clearInterval,
  clearTimeout2 as clearTimeout,
  combineReducers2 as combineReducers,
  connect,
  createComponent2 as createComponent,
  createContext,
  createElement,
  createRoot,
  createSyntheticEvent,
  current_component,
  deepEqual,
  lilact_default as default,
  effect_timeout,
  emotion_css_esm_exports as emotion,
  error,
  eval_num,
  events_set,
  findDOMNode,
  forwardRef,
  getComponentByPointer,
  globalErrorHandler,
  grabTimers,
  id_num,
  insertion_effects,
  isAsync,
  isClass,
  isEmpty,
  isError2 as isError,
  isThenable,
  isValidComponent,
  isValidElement,
  layout_effects,
  lazy,
  length_css_attributes_set,
  memo,
  passive_effects,
  pauseTimers,
  processEffects,
  redux_exports as redux,
  releaseSyntheticEvent,
  releaseTimers,
  render,
  require2 as require,
  required_scripts,
  resetTimers,
  resumeTimers,
  roots,
  run,
  runScripts,
  scanBlockLabels,
  setInterval,
  setTimeout2 as setTimeout,
  shallowEqual,
  special_attributes,
  startTransition,
  timeoutPromise,
  toBool,
  traceError,
  transpileJSX,
  transpilerConfig,
  update_cbs,
  update_interval_margin,
  update_set,
  update_timeout,
  useActionState,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useDispatch,
  useEffect,
  useHook,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useLocalStorage,
  useLocation,
  useMemo,
  useNavigate,
  useReducer,
  useRef,
  useSelector,
  useState,
  useStore,
  useTransition,
  wrapListener
};
//# sourceMappingURL=lilact.development.js.map
