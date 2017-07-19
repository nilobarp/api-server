// /**
//  * Autobind functions adapted from https://github.com/jayphelps/core-decorators.js
//  */
// const { defineProperty, getOwnPropertyDescriptor,
//     getOwnPropertyNames, getOwnPropertySymbols, getPrototypeOf } = Object;

// function isDescriptor(desc) {
//     if (!desc || !desc.hasOwnProperty) {
//         return false;
//     }

//     const keys = ['value', 'initializer', 'get', 'set'];

//     for (let i = 0, l = keys.length; i < l; i++) {
//         if (desc.hasOwnProperty(keys[i])) {
//             return true;
//         }
//     }

//     return false;
// }

// function decorate(handleDescriptor, entryArgs) {
//     if (isDescriptor(entryArgs[entryArgs.length - 1])) {
//         return handleDescriptor(...entryArgs, []);
//     } else {
//         return function () {
//             return handleDescriptor(arguments, entryArgs);
//         };
//     }
// }

// const getOwnKeys = getOwnPropertySymbols
//     ? function (object) {
//         let properties = getOwnPropertyNames(object);
//         let symbols = getOwnPropertySymbols(object);
//         symbols.map((s) => { properties.push(s.toString()); });
//         return properties;
//     }
//     : getOwnPropertyNames;

// function getOwnPropertyDescriptors(obj) {
//     const descs = {};

//     getOwnKeys(obj).forEach(
//         key => (descs[key] = getOwnPropertyDescriptor(obj, key))
//     );

//     return descs;
// }

// function createDefaultSetter(key) {
//     return function set(newValue) {
//         Object.defineProperty(this, key, {
//             configurable: true,
//             writable: true,
//             // IS enumerable when reassigned by the outside world
//             enumerable: true,
//             value: newValue
//         });

//         return newValue;
//     };
// }

// function bind(fn, context) {
//     if (fn.bind) {
//         return fn.bind(context);
//     } else {
//         return function __autobind__() {
//             return fn.apply(context, arguments);
//         };
//     }
// }

// let mapStore;

// function getBoundSuper(obj, fn) {
//     if (typeof WeakMap === 'undefined') {
//         throw new Error(
//             `Using @autobind on ${fn.name}() requires WeakMap support due to its use of super.${fn.name}()
//       See https://github.com/jayphelps/core-decorators.js/issues/20`
//         );
//     }

//     if (!mapStore) {
//         mapStore = new WeakMap();
//     }

//     if (mapStore.has(obj) === false) {
//         mapStore.set(obj, new WeakMap());
//     }

//     const superStore = mapStore.get(obj);

//     if (superStore.has(fn) === false) {
//         superStore.set(fn, bind(fn, obj));
//     }

//     return superStore.get(fn);
// }

// function autobindClass(klass) {
//     const descs = getOwnPropertyDescriptors(klass.prototype);
//     const keys = getOwnKeys(descs);

//     for (let i = 0, l = keys.length; i < l; i++) {
//         const key = keys[i];
//         const desc = descs[key];

//         if (typeof desc.value !== 'function' || key === 'constructor') {
//             continue;
//         }

//         defineProperty(klass.prototype, key, autobindMethod(klass.prototype, key, desc));
//     }
// }

// function autobindMethod(target, key, { value: fn, configurable, enumerable }) {
//     if (typeof fn !== 'function') {
//         throw new SyntaxError(`@autobind can only be used on functions, not: ${fn}`);
//     }

//     const { constructor } = target;

//     return {
//         configurable,
//         enumerable,

//         get() {
//             // Class.prototype.key lookup
//             // Someone accesses the property directly on the prototype on which it is
//             // actually defined on, i.e. Class.prototype.hasOwnProperty(key)
//             if (this === target) {
//                 return fn;
//             }

//             // Class.prototype.key lookup
//             // Someone accesses the property directly on a prototype but it was found
//             // up the chain, not defined directly on it
//             // i.e. Class.prototype.hasOwnProperty(key) == false && key in Class.prototype
//             if (this.constructor !== constructor && getPrototypeOf(this).constructor === constructor) {
//                 return fn;
//             }

//             // Autobound method calling super.sameMethod() which is also autobound and so on.
//             if (this.constructor !== constructor && key in this.constructor.prototype) {
//                 return getBoundSuper(this, fn);
//             }

//             let boundFn = bind(fn, this);

//             // boundFn['handlerName'] = key;

//             defineProperty(this, key, {
//                 configurable: true,
//                 writable: true,
//                 // NOT enumerable when it's a bound method
//                 enumerable: false,
//                 value: boundFn
//             });

//             return boundFn;
//         },
//         set: createDefaultSetter(key)
//     };
// }

// function Middleware(target: any, key: string | symbol, descriptor: PropertyDescriptor) {
//     return autobindMethod(target, key, {value: descriptor.value, configurable: descriptor.configurable, enumerable: descriptor.enumerable});
// }

// export function Autobind (args): any {
//     return autobindClass(arguments[0]);
// }

// export function Controller (args): any {
//     return autobindClass(arguments[0]);
// }