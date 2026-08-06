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

import { isValidComponent } from "./misc.jsx";


function isNullOrUndefined(v) {
  return v === null || v === undefined;
}

function shallowCopy(obj) {
  return Object.assign({}, obj);
}

function formatComponentName(componentName) {
  return componentName || "<<anonymous>>";
}

function defaultGetDisplayName(x) {
  if (!x) return "Unknown";
  return x.displayName || x.name || "Unknown";
}


// ---- node validator ----
function isNode(x) {
  // ignored-by-render children should be accepted by node
  if (x === null || x === undefined) return true;
  if (x === false || x === true) return true;

  // primitives render
  if (typeof x === "string" || typeof x === "number") return true;

  if (isValidComponent(x)) return true;

  // arrays are accepted as children; renderer will flatten later
  if (Array.isArray(x)) return x.every(isNode);

  return false;
}

function isValidElementType(x) {
  return typeof x === "function" || typeof x === "string";
}

/**
 * Build a prop validator with a consistent contract:
 * validator(props, propName, componentName, location, propFullName)
 * returns null if OK, Error if invalid.
 *
 * Each validator also gets `.isRequired`.
 */
function createPrimitiveValidator(typeCheck) {
  const validator = function validate(props, propName, componentName, location, propFullName, secret) {
    // secret is accepted for compatibility, but we don't gate on it.
    const value = props[propName];

    // Non-required: null/undefined is OK (matches prop-types behavior)
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
  const PropTypes = {};

  PropTypes.any = (function () {
    const v = function validateAny(props, propName, componentName, location, propFullName) {
      return null; // always ok
    };
    v.isRequired = function validateAnyRequired() {
      return null; // always ok even if required
    };
    return v;
  })();

  PropTypes.array = createPrimitiveValidator((v) => Array.isArray(v));
  PropTypes.array.expectedType = "array";

  PropTypes.bool = createPrimitiveValidator((v) => typeof v === "boolean");
  PropTypes.bool.expectedType = "boolean";

  PropTypes.func = createPrimitiveValidator((v) => typeof v === "function");
  PropTypes.func.expectedType = "function";

  PropTypes.number = createPrimitiveValidator((v) => typeof v === "number" && !Number.isNaN(v));
  PropTypes.number.expectedType = "number";

  PropTypes.object = createPrimitiveValidator((v) => typeof v === "object" && v !== null && !Array.isArray(v));
  PropTypes.object.expectedType = "object";

  PropTypes.string = createPrimitiveValidator((v) => typeof v === "string");
  PropTypes.string.expectedType = "string";

  PropTypes.symbol = createPrimitiveValidator((v) => typeof v === "symbol");
  PropTypes.symbol.expectedType = "symbol";

  PropTypes.component = createPrimitiveValidator((v) => isValidComponent(v));
  PropTypes.component.expectedType = "component";

  PropTypes.element = createPrimitiveValidator((v) => isValidComponent(v));
  PropTypes.element.expectedType = "element";

  PropTypes.node = createPrimitiveValidator((v) => isNode(v));
  PropTypes.node.expectedType = "node";

  PropTypes.elementType = createPrimitiveValidator((v) => isValidElementType(v));
  PropTypes.elementType.expectedType = "elementType";


  // ----- combinators -----

  PropTypes.oneOf = function oneOf(values) {
    const allowed = Array.isArray(values) ? values : [];
    const validator = function validateOneOf(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;

      for (let i = 0; i < allowed.length; i++) {
        if (value === allowed[i]) return null;
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

  PropTypes.oneOfType = function oneOfType(validators) {
    const vlist = validators || [];
    const validator = function validateOneOfType(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;

      for (let i = 0; i < vlist.length; i++) {
        const err = vlist[i](props, propName, componentName, location, propFullName);
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

  PropTypes.arrayOf = function arrayOf(innerValidator) {
    const inner = innerValidator;
    const validator = function validateArrayOf(props, propName, componentName, location, propFullName) {
      const value = props[propName];
      if (isNullOrUndefined(value)) return null;
      if (!Array.isArray(value)) {
        return new Error(
          `Invalid ${location} \`${propFullName}\` of type \`${typeof value}\` supplied to \`${formatComponentName(componentName)}\`, expected an array.`
        );
      }

      for (let i = 0; i < value.length; i++) {
        const itemPath = `${propFullName}[${i}]`;

        const itemErr = inner(
          { [propName]: value[i] },
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

  PropTypes.objectOf = function objectOf(innerValidator) {
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
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
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

      if (propIsMissing) return null; // optional shape/exact: missing is allowed

      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return new Error(
          `Invalid ${location} \`${propFullName}\` of type \`${typeof value}\` supplied to \`${formatComponentName(componentName)}\`, expected an object.`
        );
      }

      // For exact, fail on extra keys
      if (exact) {
        const valueKeys = Object.keys(value);
        for (let i = 0; i < valueKeys.length; i++) {
          const k = valueKeys[i];
          if (!Object.prototype.hasOwnProperty.call(spec, k)) {
            const keyPath = `${propFullName}.${k}`;
            return new Error(
              `Invalid ${location} \`${keyPath}\` supplied to \`${formatComponentName(componentName)}\`: extra key \`${k}\` is not allowed by exact().`
            );
          }
        }
      }

      // Validate spec keys
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const specValidator = spec[k];
        const nestedVal = value[k];
        const nestedPath = `${propFullName}.${k}`;

        if (isNullOrUndefined(nestedVal)) {
          // decide requiredness from whether specValidator has isRequired wrapper identity
          // In prop-types, requiredness is encoded by calling `.isRequired`, which returns a validator that errors on missing.
          // Here, we can detect by presence of an internal flag; we don't have one, so we handle requiredness by trying both:
          // - call specValidator (optional) -> if it returns null/undefined-missing allowed
          // - BUT we need correct behavior: specValidator itself is already the chosen validator (required or not).
          // So just call specValidator normally with nested props; required validators will error if missing.
          const err = specValidator(
            { [propName]: nestedVal },
            propName,
            componentName,
            location,
            nestedPath
          );
          if (err !== null) return err;
          continue;
        }

        // present: validate with specValidator
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

  PropTypes.shape = function shape(spec) {
    return makeShapeValidator(spec, { exact: false });
  };

  PropTypes.exact = function exact(spec) {
    return makeShapeValidator(spec, { exact: true });
  };

  PropTypes.instanceOf = function instanceOf(ClassOrConstructor) {
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

  // ----- checkPropTypes -----

  const warningCache = new Set();

  PropTypes.checkPropTypes = function checkPropTypes(typeSpecs, values, location, componentName) {
    if (!DEBUG) return;

    if (!typeSpecs) return;
    const specs = typeSpecs;

    const component = formatComponentName(componentName);

    const typeSpecKeys = Object.keys(specs);
    for (let i = 0; i < typeSpecKeys.length; i++) {
      const propKey = typeSpecKeys[i];
      const validator = specs[propKey];

      if (typeof validator !== "function") continue;

      const fullName = propKey;

      const err = validator(values || {}, propKey, component, location, fullName);
      if (err instanceof Error) {
        const cacheKey = `${component}|${location}|${propKey}|${err.message}`;
        if (warningCache.has(cacheKey)) continue;
        warningCache.add(cacheKey);

        // mimic dev warnings
        if (typeof console !== "undefined" && console.error) {
          console.error(
            `Warning: Failed prop type: ${err.message}`
          );
        }
      }
    }
  };

  return PropTypes;
}

// Export default PropTypes-like object
export const PropTypes = createPropTypes();
