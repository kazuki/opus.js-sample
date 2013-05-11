// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 4,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((ptr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 20448;
assert(STATICTOP < TOTAL_MEMORY);
/* memory initializer */ allocate([106,28,141,56,82,187,30,58,8,105,220,58,130,237,87,59,137,99,178,59,3,42,5,60,48,220,57,60,180,62,119,60,28,163,158,60,209,242,197,60,254,134,241,60,155,171,16,61,5,173,42,61,132,194,70,61,83,230,100,61,17,137,130,61,135,159,147,61,203,178,165,61,209,190,184,61,58,191,204,61,84,175,225,61,20,138,247,61,14,37,7,62,217,244,18,62,95,49,31,62,104,215,43,62,138,227,56,62,48,82,70,62,148,31,84,62,191,71,98,62,142,198,112,62,176,151,127,62,82,91,135,62,96,15,143,62,152,229,150,62,121,219,158,62,112,238,166,62,216,27,175,62,251,96,183,62,17,187,191,62,70,39,200,62,183,162,208,62,120,42,217,62,148,187,225,62,12,83,234,62,222,237,242,62,6,137,251,62,190,16,2,63,31,90,6,63,36,159,10,63,80,222,14,63,43,22,19,63,65,69,23,63,37,106,27,63,115,131,31,63,206,143,35,63,230,141,39,63,116,124,43,63,63,90,47,63,25,38,51,63,231,222,54,63,153,131,58,63,51,19,62,63,197,140,65,63,119,239,68,63,127,58,72,63,39,109,75,63,206,134,78,63,229,134,81,63,241,108,84,63,142,56,87,63,105,233,89,63,69,127,92,63,250,249,94,63,115,89,97,63,175,157,99,63,193,198,101,63,207,212,103,63,17,200,105,63,210,160,107,63,110,95,109,63,80,4,111,63,244,143,112,63,230,2,114,63,189,93,115,63,31,161,116,63,191,205,117,63,87,228,118,63,176,229,119,63,151,210,120,63,227,171,121,63,115,114,122,63,39,39,123,63,231,202,123,63,157,94,124,63,53,227,124,63,156,89,125,63,189,194,125,63,134,31,126,63,222,112,126,63,171,183,126,63,207,244,126,63,38,41,127,63,134,85,127,63,190,122,127,63,150,153,127,63,204,178,127,63,20,199,127,63,28,215,127,63,130,227,127,63,221,236,127,63,182,243,127,63,138,248,127,63,200,251,127,63,214,253,127,63,7,255,127,63,165,255,127,63,232,255,127,63,253,255,127,63,0,0,128,63,14,190,192,189,172,31,155,190,149,130,26,191,150,149,70,190,84,114,62,190,146,3,26,191,6,152,62,189,2,160,234,189,182,43,212,189,185,114,30,191,106,190,162,190,28,7,46,190,107,243,143,189,90,158,23,62,33,173,209,62,10,102,12,63,125,60,188,62,20,33,253,190,143,169,67,63,8,119,235,191,10,243,46,62,117,147,76,65,80,83,139,191,108,236,162,191,181,21,130,193,28,107,193,65,162,98,178,192,255,231,48,190,47,79,39,190,158,206,101,190,255,87,194,189,155,60,149,189,203,248,135,190,44,97,205,189,203,33,83,189,64,166,21,190,238,35,247,189,160,253,56,190,219,167,3,62,233,95,226,62,213,202,252,190,29,203,43,62,231,168,83,62,1,79,74,190,247,3,214,62,71,119,192,63,173,249,69,191,64,164,32,193,43,194,205,62,192,178,62,64,201,118,115,65,100,204,241,191,39,165,152,191,23,204,233,60,134,193,132,187,201,232,144,61,84,72,7,60,154,231,189,189,103,71,42,188,59,137,140,187,159,122,160,187,88,90,145,189,85,196,39,187,169,11,34,61,177,219,103,62,241,54,5,61,52,17,38,62,170,10,205,189,86,185,248,62,108,4,2,62,86,102,146,62,228,254,126,60,106,251,215,61,159,142,67,64,136,70,147,63,57,40,129,191,71,90,234,191,139,84,84,64,210,53,91,192,13,253,243,189,232,39,38,189,25,31,226,59,241,90,147,60,171,170,28,189,237,238,195,59,5,106,150,188,246,141,249,58,37,201,19,190,106,115,50,189,210,214,129,58,161,100,98,62,158,210,17,62,128,215,247,62,221,12,207,62,124,15,3,63,250,242,114,190,55,139,119,62,47,110,179,62,183,13,51,191,136,99,38,65,18,165,41,64,83,208,27,192,53,7,134,192,125,150,135,63,60,247,218,63,12,212,218,59,186,186,147,189,191,192,34,189,69,144,20,61,38,112,235,189,208,37,193,188,210,156,6,60,124,58,104,188,114,11,7,189,31,26,17,189,171,204,53,59,154,208,148,190,218,230,146,191,140,104,163,190,89,193,47,191,163,233,188,62,64,50,245,62,253,245,58,62,163,119,210,190,8,144,97,63,39,107,147,192,33,31,188,63,224,243,171,62,161,214,232,191,245,91,241,193,8,172,177,64,252,177,255,58,106,21,253,189,37,245,148,189,41,102,131,189,252,233,90,189,35,134,221,189,20,249,191,189,43,237,142,189,75,171,225,188,167,236,68,190,122,110,225,189,172,28,146,62,105,170,207,190,7,203,189,61,35,101,147,190,201,231,89,191,252,194,203,189,212,95,111,190,111,129,164,191,13,108,145,63,155,201,71,64,187,39,143,189,66,91,238,191,113,201,41,64,120,238,233,192,26,168,28,64,135,138,146,186,54,152,129,189,127,33,26,189,138,114,25,190,229,100,18,62,247,202,60,62,113,202,252,61,117,220,154,61,70,65,240,61,200,40,191,61,71,193,141,61,22,144,172,61,175,81,144,61,27,166,113,61,173,246,192,61,61,209,229,190,92,47,215,60,148,107,138,62,106,78,134,190,98,186,48,62,49,37,0,64,133,9,35,190,99,96,29,61,26,81,35,65,182,248,132,64,7,206,21,192,120,99,97,189,79,18,30,60,98,186,16,190,8,223,224,60,187,222,12,61,136,166,71,189,97,152,194,61,35,245,253,187,158,146,24,189,185,155,179,187,187,236,135,189,45,182,196,61,230,206,76,190,12,24,41,189,251,87,22,63,48,68,83,61,142,172,172,62,218,226,90,63,93,26,43,63,202,82,235,189,178,75,104,192,37,89,239,190,177,164,92,190,57,98,39,64,145,238,207,62,180,142,174,191,203,61,46,61,20,5,250,61,210,98,191,61,67,4,252,61,160,165,11,61,155,226,17,190,245,130,15,61,15,250,72,189,55,41,150,61,113,52,108,61,83,235,253,61,185,215,83,189,147,139,129,190,69,47,23,63,113,89,21,62,238,95,161,62,207,217,98,62,177,168,24,190,79,89,93,62,127,251,178,190,253,135,196,65,161,131,126,191,11,66,29,63,242,82,150,193,27,76,53,192,69,128,55,191,84,196,177,190,253,130,245,62,128,238,123,190,215,96,155,61,137,150,12,62,211,19,54,190,185,51,243,61,46,253,141,186,175,7,115,190,129,34,182,62,33,7,5,190,218,78,96,189,101,28,163,190,21,171,166,190,107,211,56,62,171,31,128,189,183,155,16,62,40,41,176,62,24,207,192,62,95,126,23,191,102,247,186,64,170,241,194,190,46,56,99,62,239,172,181,191,48,108,229,201,122,170,171,63,218,31,232,60,27,113,55,189,162,59,173,188,127,121,210,188,9,192,100,60,236,86,170,60,101,102,48,188,198,207,53,60,202,13,112,61,62,180,207,188,178,134,6,189,121,35,243,61,78,38,94,190,247,62,21,62,230,93,245,61,106,111,187,189,198,21,247,189,41,83,161,189,106,23,19,190,134,89,24,191,188,116,147,191,198,109,160,191,181,224,149,191,42,227,138,64,64,26,110,201,249,102,175,191,204,76,36,189,13,168,87,62,141,239,11,190,159,57,11,62,64,87,86,189,28,28,54,61,199,207,107,60,239,56,135,59,170,27,158,188,226,177,95,62,162,178,225,189,236,163,1,192,165,17,107,63,28,8,29,192,134,3,153,63,184,86,123,189,48,18,246,191,186,192,157,62,172,202,254,62,42,144,105,63,102,75,86,62,147,24,22,192,95,94,12,64,39,20,207,192,144,78,217,63,169,161,57,191,112,218,66,60,77,206,26,61,109,235,98,61,109,130,185,60,243,67,144,189,93,3,246,188,182,124,73,60,72,233,136,187,62,158,140,189,125,64,0,61,219,50,32,61,194,108,186,62,242,165,193,189,126,80,188,60,194,81,50,190,228,218,168,62,44,239,234,61,112,182,153,62,62,33,219,61,18,136,7,62,8,148,185,64,125,118,104,63,80,195,103,191,88,202,86,192,248,56,67,62,207,161,60,62,50,116,44,191,208,94,109,62,213,29,112,189,65,74,108,62,216,101,224,190,240,193,123,62,23,72,48,190,182,123,179,61,121,115,56,191,85,106,38,62,85,187,139,60,143,114,208,61,117,230,198,62,213,38,170,63,2,241,138,63,108,177,111,191,51,167,23,192,66,9,215,192,144,102,92,192,241,215,8,64,116,181,99,65,82,68,157,64,20,203,69,192,16,18,27,193,252,170,68,191,164,228,229,63,75,35,97,61,17,82,39,62,16,59,163,61,253,223,12,61,211,175,99,189,237,178,165,187,217,102,153,60,110,201,5,61,34,162,189,60,175,119,31,62,154,15,67,61,75,120,130,190,151,255,204,63,210,28,77,191,119,132,35,64,65,213,60,63,19,102,174,191,221,9,50,191,71,90,28,192,62,174,221,191,131,250,124,64,205,1,242,63,101,224,248,62,75,89,53,193,128,147,112,74,249,75,195,190,126,29,248,61,94,44,104,191,249,20,60,64,51,196,209,63,231,255,97,63,2,213,95,63,45,207,155,63,46,226,95,191,166,182,164,62,93,249,72,63,160,81,114,63,134,55,19,191,62,203,93,192,34,137,98,63,173,62,189,61,144,131,30,193,116,93,200,62,10,242,35,62,170,43,3,192,240,167,132,64,210,22,140,61,58,60,20,190,123,16,146,190,69,44,194,62,116,70,148,191,167,29,227,188,154,153,29,193,16,93,154,192,51,167,109,64,139,224,119,64,26,163,97,64,126,124,119,109,87,41,19,9,4,2,0,0,126,124,119,109,87,41,19,9,4,2,0,0,255,255,156,110,86,70,59,51,45,40,37,33,31,28,26,25,23,22,21,20,19,18,17,16,16,15,15,14,13,13,12,12,12,12,11,11,11,10,10,10,9,9,9,9,9,9,8,8,8,8,8,7,7,7,7,7,7,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,5,5,5,5,5,5,5,5,5,5,5,5,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,25,0,0,0,15,0,0,0,2,0,0,0,0,255,0,255,0,255,0,255,0,255,0,254,1,0,1,255,0,254,0,253,2,0,1,255,0,254,0,253,3,0,1,255,2,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,68,0,0,0,80,0,0,0,96,0,0,0,120,0,0,0,2,1,0,0,2,1,0,0,0,0,0,0,5,193,35,61,233,125,163,61,37,150,244,61,226,116,34,62,172,28,74,62,221,37,113,62,52,186,139,62,180,119,158,62,228,191,176,62,173,136,194,62,37,201,211,62,24,122,228,62,24,149,244,62,200,10,2,63,28,124,9,63,73,157,16,63,202,109,23,63,192,237,29,63,159,29,36,63,84,254,41,63,46,145,47,63,224,215,52,63,99,212,57,63,240,136,62,63,211,247,66,63,171,35,71,63,23,15,75,63,216,188,78,63,173,47,82,63,106,106,85,63,206,111,88,63,154,66,91,63,142,229,93,63,75,91,96,63,110,166,98,63,100,201,100,63,155,198,102,63,111,160,104,63,247,88,106,63,128,242,107,63,223,110,109,63,11,208,110,63,202,23,112,63,224,71,113,63,225,97,114,63,77,103,115,63,150,89,116,63,12,58,117,63,255,9,118,63,138,202,118,63,187,124,119,63,192,33,120,63,98,186,120,63,157,71,121,63,75,202,121,63,36,67,122,63,242,178,122,63,59,26,123,63,200,121,123,63,32,210,123,63,200,35,124,63,55,111,124,63,242,180,124,63,94,245,124,63,224,48,125,63,236,103,125,63,183,154,125,63,180,201,125,63,6,245,125,63,17,29,126,63,24,66,126,63,78,100,126,63,211,131,126,63,253,160,126,63,237,187,126,63,195,212,126,63,179,235,126,63,239,0,127,63,135,20,127,63,141,38,127,63,67,55,127,63,170,70,127,63,227,84,127,63,15,98,127,63,47,110,127,63,100,121,127,63,190,131,127,63,63,141,127,63,24,150,127,63,56,158,127,63,194,165,127,63,163,172,127,63,16,179,127,63,245,184,127,63,119,190,127,63,114,195,127,63,25,200,127,63,108,204,127,63,91,208,127,63,6,212,127,63,111,215,127,63,131,218,127,63,102,221,127,63,21,224,127,63,130,226,127,63,205,228,127,63,230,230,127,63,205,232,127,63,146,234,127,63,70,236,127,63,200,237,127,63,40,239,127,63,120,240,127,63,166,241,127,63,195,242,127,63,191,243,127,63,186,244,127,63,148,245,127,63,94,246,127,63,39,247,127,63,207,247,127,63,119,248,127,63,253,248,127,63,148,249,127,63,9,250,127,63,127,250,127,63,244,250,127,63,89,251,127,63,173,251,127,63,1,252,127,63,84,252,127,63,152,252,127,63,219,252,127,63,30,253,127,63,80,253,127,63,130,253,127,63,181,253,127,63,231,253,127,63,9,254,127,63,59,254,127,63,93,254,127,63,126,254,127,63,143,254,127,63,176,254,127,63,210,254,127,63,227,254,127,63,244,254,127,63,21,255,127,63,38,255,127,63,55,255,127,63,71,255,127,63,88,255,127,63,88,255,127,63,105,255,127,63,122,255,127,63,122,255,127,63,139,255,127,63,155,255,127,63,155,255,127,63,155,255,127,63,172,255,127,63,172,255,127,63,189,255,127,63,189,255,127,63,189,255,127,63,206,255,127,63,206,255,127,63,206,255,127,63,206,255,127,63,206,255,127,63,222,255,127,63,222,255,127,63,222,255,127,63,222,255,127,63,222,255,127,63,222,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,239,255,127,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,0,0,128,63,248,42,0,0,232,3,0,0,176,54,0,0,232,3,0,0,8,82,0,0,208,7,0,0,0,125,0,0,208,7,0,0,176,54,0,0,232,3,0,0,80,70,0,0,208,7,0,0,192,93,0,0,208,7,0,0,128,187,0,0,208,7,0,0,25,23,2,0,25,23,2,0,2,1,0,0,224,192,160,128,96,64,32,0,213,171,128,85,43,0,0,0,205,154,102,51,0,0,0,0,192,128,64,0,171,85,0,0,230,0,0,0,232,158,10,0,92,202,190,216,182,223,154,226,156,230,120,236,122,244,204,252,52,3,134,11,136,19,100,25,102,29,74,32,66,39,164,53,249,247,246,245,244,234,210,202,201,200,197,174,82,59,56,55,54,46,22,12,11,10,9,7,0,0,0,0,64,0,0,0,254,49,67,77,82,93,99,198,11,18,24,31,36,45,255,46,66,78,87,94,104,208,14,21,32,42,51,66,255,94,104,109,112,115,118,248,53,69,80,88,95,102,0,0,0,0,2,5,9,14,20,27,35,44,54,65,77,90,104,119,135,0,0,0,130,0,200,58,0,231,130,26,0,244,184,76,12,0,249,214,130,43,6,0,252,232,173,87,24,3,0,253,241,203,131,56,14,2,0,254,246,221,167,94,35,8,1,0,254,249,232,193,130,65,23,5,1,0,255,251,239,211,162,99,45,15,4,1,0,255,251,243,223,186,131,74,33,11,3,1,0,255,252,245,230,202,158,105,57,24,8,2,1,0,255,253,247,235,214,179,132,84,44,19,7,2,1,0,255,254,250,240,223,196,159,112,69,36,15,6,2,1,0,255,254,253,245,231,209,176,136,93,55,27,11,3,2,1,0,255,254,253,252,239,221,194,158,117,76,42,18,4,3,2,1,0,129,0,203,54,0,234,129,23,0,245,184,73,10,0,250,215,129,41,5,0,252,232,173,86,24,3,0,253,240,200,129,56,15,2,0,253,244,217,164,94,38,10,1,0,253,245,226,189,132,71,27,7,1,0,253,246,231,203,159,105,56,23,6,1,0,255,248,235,213,179,133,85,47,19,5,1,0,255,254,243,221,194,159,117,70,37,12,2,1,0,255,254,248,234,208,171,128,85,48,22,8,2,1,0,255,254,250,240,220,189,149,107,67,36,16,6,2,1,0,255,254,251,243,227,201,166,128,90,55,29,13,5,2,1,0,255,254,252,246,234,213,183,147,109,73,43,22,10,4,2,1,0,129,0,207,50,0,236,129,20,0,245,185,72,10,0,249,213,129,42,6,0,250,226,169,87,27,4,0,251,233,194,130,62,20,4,0,250,236,207,160,99,47,17,3,0,255,240,217,182,131,81,41,11,1,0,255,254,233,201,159,107,61,20,2,1,0,255,249,233,206,170,128,86,50,23,7,1,0,255,250,238,217,186,148,108,70,39,18,6,1,0,255,252,243,226,200,166,128,90,56,30,13,4,1,0,255,252,245,231,209,180,146,110,76,47,25,11,4,1,0,255,253,248,237,219,194,163,128,93,62,37,19,8,3,1,0,255,254,250,241,226,205,177,145,111,79,51,30,15,6,2,1,0,128,0,214,42,0,235,128,21,0,244,184,72,11,0,248,214,128,42,7,0,248,225,170,80,25,5,0,251,236,198,126,54,18,3,0,250,238,211,159,82,35,15,5,0,250,231,203,168,128,88,53,25,6,0,252,238,216,185,148,108,71,40,18,4,0,253,243,225,199,166,128,90,57,31,13,3,0,254,246,233,212,183,147,109,73,44,23,10,2,0,255,250,240,223,198,166,128,90,58,33,16,6,1,0,255,251,244,231,210,181,146,110,75,46,25,12,5,1,0,255,253,248,238,221,196,164,128,92,60,35,18,8,3,1,0,255,253,249,242,229,208,180,146,110,76,48,27,14,7,3,1,0,189,0,168,253,105,2,103,119,117,0,97,255,210,251,8,116,52,0,221,0,168,246,116,110,252,255,17,2,234,242,229,102,208,255,246,2,140,240,165,93,176,255,137,3,117,239,6,83,157,255,204,3,130,239,102,71,149,255,199,3,139,240,39,59,153,255,128,3,97,242,174,46,165,255,5,3,207,244,94,34,185,255,99,2,161,247,152,22,210,255,169,1,161,250,180,11,241,190,178,132,87,74,41,14,0,223,193,157,140,106,57,39,18,0,0,0,131,74,141,79,80,138,95,104,134,95,99,91,125,93,76,123,115,123,0,0,125,51,26,18,15,12,11,10,9,8,7,6,5,4,3,2,1,0,198,105,45,22,15,12,11,10,9,8,7,6,5,4,3,2,1,0,213,162,116,83,59,43,32,24,18,15,12,9,7,6,5,3,2,0,239,187,116,59,28,16,11,10,9,8,7,6,5,4,3,2,1,0,250,229,188,135,86,51,30,19,13,10,8,6,5,4,3,2,1,0,249,235,213,185,156,128,103,83,66,53,42,33,26,21,17,13,10,0,254,249,235,206,164,118,77,46,27,16,10,7,5,4,3,2,1,0,255,253,249,239,220,191,156,119,85,57,37,23,15,10,6,4,2,0,255,253,251,246,237,223,203,179,152,124,98,75,55,40,29,21,15,0,255,254,253,247,220,162,106,67,42,28,18,12,9,6,4,3,2,0,31,57,107,160,205,205,255,255,255,255,255,255,255,255,255,255,255,255,69,47,67,111,166,205,255,255,255,255,255,255,255,255,255,255,255,255,82,74,79,95,109,128,145,160,173,205,205,205,224,255,255,224,255,224,125,74,59,69,97,141,182,255,255,255,255,255,255,255,255,255,255,255,173,115,85,73,76,92,115,145,173,205,224,224,255,255,255,255,255,255,166,134,113,102,101,102,107,118,125,138,145,155,166,182,192,192,205,150,224,182,134,101,83,79,85,97,120,145,173,205,224,255,255,255,255,255,255,224,192,150,120,101,92,89,93,102,118,134,160,182,192,224,224,224,255,224,224,182,155,134,118,109,104,102,106,111,118,131,145,160,173,131,0,0,253,250,244,233,212,182,150,131,120,110,98,85,72,60,49,40,32,25,19,15,13,11,9,8,7,6,5,4,3,2,1,0,210,208,206,203,199,193,183,168,142,104,74,52,37,27,20,14,10,6,4,2,0,0,0,0,223,201,183,167,152,138,124,111,98,88,79,70,62,56,50,44,39,35,31,27,24,21,18,16,14,12,10,8,6,4,3,2,1,0,0,0,188,176,155,138,119,97,67,43,26,10,0,0,165,119,80,61,47,35,27,20,14,9,4,0,113,63,0,0,120,0,0,0,224,112,44,15,3,2,1,0,254,237,192,132,70,23,4,0,255,252,226,155,61,11,2,0,250,245,234,203,71,50,42,38,35,33,31,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,0,0,0,0,0,0,0,4,41,0,0,176,54,0,0,104,66,0,0,252,83,0,0,84,111,0,0,16,164,0,0,128,56,1,0,0,0,0,0,64,31,0,0,184,36,0,0,236,44,0,0,188,52,0,0,92,68,0,0,168,97,0,0,128,56,1,0,0,0,0,0,40,35,0,0,224,46,0,0,164,56,0,0,68,72,0,0,180,95,0,0,172,138,0,0,128,56,1,0,18,0,29,0,38,0,40,0,46,0,52,0,62,0,84,0,42,175,213,201,207,255,64,0,17,0,99,255,97,1,16,254,163,0,39,43,189,86,217,255,6,0,91,0,86,255,186,0,23,0,128,252,192,24,216,77,237,255,220,255,102,0,167,255,232,255,72,1,73,252,8,10,37,62,0,0,135,199,61,201,64,0,128,0,134,255,36,0,54,1,0,253,72,2,51,36,69,69,12,0,128,0,18,0,114,255,32,1,139,255,159,252,27,16,123,56,148,107,103,196,17,0,12,0,8,0,1,0,246,255,234,255,226,255,224,255,234,255,3,0,44,0,100,0,168,0,243,0,61,1,125,1,173,1,199,1,228,87,5,197,3,0,242,255,236,255,241,255,2,0,25,0,37,0,25,0,240,255,185,255,149,255,177,255,50,0,36,1,111,2,214,3,8,5,184,5,230,62,198,196,243,255,0,0,20,0,26,0,5,0,225,255,213,255,252,255,65,0,90,0,7,0,99,255,8,255,212,255,81,2,47,6,52,10,199,12,104,2,13,200,246,255,39,0,58,0,210,255,172,255,120,0,184,0,197,254,227,253,4,5,4,21,64,35,100,0,240,0,32,0,100,0,243,221,192,181,0,0,0,0,175,148,160,176,178,173,174,164,177,174,196,182,198,192,182,68,62,66,60,72,117,85,90,118,136,151,142,160,142,155,0,0,179,138,140,148,151,149,153,151,163,116,67,82,59,92,72,100,89,92,0,0,100,40,16,7,3,1,0,0,100,0,3,0,40,0,3,0,3,0,3,0,5,0,14,0,14,0,10,0,11,0,3,0,8,0,9,0,7,0,3,0,91,1,0,0,250,0,3,0,6,0,3,0,3,0,3,0,4,0,3,0,3,0,3,0,205,1,0,0,32,0,16,0,102,38,171,1,32,24,80,0,160,23,80,0,32,20,80,0,112,21,80,0,224,20,80,0,16,23,80,0,92,20,80,0,32,0,10,0,20,46,100,1,32,26,80,0,224,23,80,0,64,20,80,0,112,22,80,0,40,21,80,0,88,23,80,0,128,20,80,0,255,254,253,244,12,3,2,1,0,255,254,252,224,38,3,2,1,0,255,254,251,209,57,4,2,1,0,255,254,244,195,69,4,2,1,0,255,251,232,184,84,7,2,1,0,255,254,240,186,86,14,2,1,0,255,254,239,178,91,30,5,1,0,255,248,227,177,100,19,2,1,0,255,254,253,238,14,3,2,1,0,255,254,252,218,35,3,2,1,0,255,254,250,208,59,4,2,1,0,255,254,246,194,71,10,2,1,0,255,252,236,183,82,8,2,1,0,255,252,235,180,90,17,2,1,0,255,248,224,171,97,30,4,1,0,255,254,236,173,95,37,7,1,0,0,0,0,0,0,0,0,1,100,102,102,68,68,36,34,96,164,107,158,185,180,185,139,102,64,66,36,34,34,0,1,32,208,139,141,191,152,185,155,104,96,171,104,166,102,102,102,132,1,0,0,0,0,16,16,0,80,109,78,107,185,139,103,101,208,212,141,139,173,153,123,103,36,0,0,0,0,0,0,1,48,0,0,0,0,0,0,32,68,135,123,119,119,103,69,98,68,103,120,118,118,102,71,98,134,136,157,184,182,153,139,134,208,168,248,75,189,143,121,107,32,49,34,34,34,0,17,2,210,235,139,123,185,137,105,134,98,135,104,182,100,183,171,134,100,70,68,70,66,66,34,131,64,166,102,68,36,2,1,0,134,166,102,68,34,34,66,132,212,246,158,139,107,107,87,102,100,219,125,122,137,118,103,132,114,135,137,105,171,106,50,34,164,214,141,143,185,151,121,103,192,34,0,0,0,0,0,1,208,109,74,187,134,249,159,137,102,110,154,118,87,101,119,101,0,2,0,36,36,66,68,35,96,164,102,100,36,0,2,33,167,138,174,102,100,84,2,2,100,107,120,119,36,197,24,0,16,0,0,0,0,99,66,36,36,34,36,34,34,34,34,83,69,36,52,34,116,102,70,68,68,176,102,68,68,34,65,85,68,84,36,116,141,152,139,170,132,187,184,216,137,132,249,168,185,139,104,102,100,68,68,178,218,185,185,170,244,216,187,187,170,244,187,187,219,138,103,155,184,185,137,116,183,155,152,136,132,217,184,184,170,164,217,171,155,139,244,169,184,185,170,164,216,223,218,138,214,143,188,218,168,244,141,136,155,170,168,138,220,219,139,164,219,202,216,137,168,186,246,185,139,116,185,219,185,138,100,100,134,100,102,34,68,68,100,68,168,203,221,218,168,167,154,136,104,70,164,246,171,137,139,137,155,218,219,139,255,255,255,156,4,154,255,255,255,255,255,227,102,15,92,255,255,255,255,255,213,83,24,72,236,255,255,255,255,150,76,33,63,214,255,255,255,190,121,77,43,55,185,255,255,255,245,137,71,43,59,139,255,255,255,255,131,66,50,66,107,194,255,255,166,116,76,55,53,125,255,255,255,255,255,131,6,145,255,255,255,255,255,236,93,15,96,255,255,255,255,255,194,83,25,71,221,255,255,255,255,162,73,34,66,162,255,255,255,210,126,73,43,57,173,255,255,255,201,125,71,48,58,130,255,255,255,166,110,73,57,62,104,210,255,255,251,123,65,55,68,100,171,255,225,204,201,184,183,175,158,154,153,135,119,115,113,110,109,99,98,95,79,68,52,50,48,45,43,32,31,27,18,10,3,0,255,251,235,230,212,201,196,182,167,166,163,151,138,124,110,104,90,78,76,70,69,57,45,34,24,21,11,6,5,4,3,0,212,178,148,129,108,96,85,82,79,77,61,59,57,56,51,49,48,45,42,41,40,38,36,34,31,30,21,12,10,3,1,0,255,245,244,236,233,225,217,203,190,176,175,161,149,136,125,114,102,91,81,71,60,52,43,35,28,20,19,18,12,11,5,0,7,23,38,54,69,85,100,116,131,147,162,178,193,208,223,239,13,25,41,55,69,83,98,112,127,142,157,171,187,203,220,236,15,21,34,51,61,78,92,106,126,136,152,167,185,205,225,240,10,21,36,50,63,79,95,110,126,141,157,173,189,205,221,237,17,20,37,51,59,78,89,107,123,134,150,164,184,205,224,240,10,15,32,51,67,81,96,112,129,142,158,173,189,204,220,236,8,21,37,51,65,79,98,113,126,138,155,168,179,192,209,218,12,15,34,55,63,78,87,108,118,131,148,167,185,203,219,236,16,19,32,36,56,79,91,108,118,136,154,171,186,204,220,237,11,28,43,58,74,89,105,120,135,150,165,180,196,211,226,241,6,16,33,46,60,75,92,107,123,137,156,169,185,199,214,225,11,19,30,44,57,74,89,105,121,135,152,169,186,202,218,234,12,19,29,46,57,71,88,100,120,132,148,165,182,199,216,233,17,23,35,46,56,77,92,106,123,134,152,167,185,204,222,237,14,17,45,53,63,75,89,107,115,132,151,171,188,206,221,240,9,16,29,40,56,71,88,103,119,137,154,171,189,205,222,237,16,19,36,48,57,76,87,105,118,132,150,167,185,202,218,236,12,17,29,54,71,81,94,104,126,136,149,164,182,201,221,237,15,28,47,62,79,97,115,129,142,155,168,180,194,208,223,238,8,14,30,45,62,78,94,111,127,143,159,175,192,207,223,239,17,30,49,62,79,92,107,119,132,145,160,174,190,204,220,235,14,19,36,45,61,76,91,108,121,138,154,172,189,205,222,238,12,18,31,45,60,76,91,107,123,138,154,171,187,204,221,236,13,17,31,43,53,70,83,103,114,131,149,167,185,203,220,237,17,22,35,42,58,78,93,110,125,139,155,170,188,206,224,240,8,15,34,50,67,83,99,115,131,146,162,178,193,209,224,239,13,16,41,66,73,86,95,111,128,137,150,163,183,206,225,241,17,25,37,52,63,75,92,102,119,132,144,160,175,191,212,231,19,31,49,65,83,100,117,133,147,161,174,187,200,213,227,242,18,31,52,68,88,103,117,126,138,149,163,177,192,207,223,239,16,29,47,61,76,90,106,119,133,147,161,176,193,209,224,240,15,21,35,50,61,73,86,97,110,119,129,141,175,198,218,237,12,35,60,83,108,132,157,180,206,228,15,32,55,77,101,125,151,175,201,225,19,42,66,89,114,137,162,184,209,230,12,25,50,72,97,120,147,172,200,223,26,44,69,90,114,135,159,180,205,225,13,22,53,80,106,130,156,180,205,228,15,25,44,64,90,115,142,168,196,222,19,24,62,82,100,120,145,168,190,214,22,31,50,79,103,120,151,170,203,227,21,29,45,65,106,124,150,171,196,224,30,49,75,97,121,142,165,186,209,229,19,25,52,70,93,116,143,166,192,219,26,34,62,75,97,118,145,167,194,217,25,33,56,70,91,113,143,165,196,223,21,34,51,72,97,117,145,171,196,222,20,29,50,67,90,117,144,168,197,221,22,31,48,66,95,117,146,168,196,222,24,33,51,77,116,134,158,180,200,224,21,28,70,87,106,124,149,170,194,217,26,33,53,64,83,117,152,173,204,225,27,34,65,95,108,129,155,174,210,225,20,26,72,99,113,131,154,176,200,219,34,43,61,78,93,114,155,177,205,229,23,29,54,97,124,138,163,179,209,229,30,38,56,89,118,129,158,178,200,231,21,29,49,63,85,111,142,163,193,222,27,48,77,103,133,158,179,196,215,232,29,47,74,99,124,151,176,198,220,237,33,42,61,76,93,121,155,174,207,225,29,53,87,112,136,154,170,188,208,227,24,30,52,84,131,150,166,186,203,229,37,48,64,84,104,118,156,177,201,230,0,15,8,7,4,11,12,3,2,13,10,5,6,9,14,1,0,9,6,3,4,5,8,1,2,7,0,0,128,64,0,0,128,28,80,0,48,28,80,0,144,27,80,0,179,99,0,0,250,27,61,39,5,245,42,88,4,1,254,60,65,6,252,255,251,73,56,1,247,19,94,29,247,0,12,99,6,4,8,237,102,46,243,3,2,13,3,2,9,235,84,72,238,245,46,104,234,8,18,38,48,23,0,240,70,83,235,11,5,245,117,22,248,250,23,117,244,3,3,248,95,28,4,246,15,77,60,241,255,4,124,2,252,3,38,84,24,231,2,13,42,13,31,21,252,56,46,255,255,35,79,243,19,249,65,88,247,242,20,4,81,49,227,20,0,75,3,239,5,247,44,92,248,1,253,22,69,31,250,95,41,244,5,39,67,16,252,1,0,250,120,55,220,243,44,122,4,232,81,5,11,3,7,2,0,9,10,88,13,22,39,23,12,255,36,64,27,250,249,10,55,43,17,1,1,8,1,1,6,245,74,53,247,244,55,76,244,8,253,3,93,27,252,26,39,59,3,248,2,0,77,11,9,248,22,44,250,7,40,9,26,3,9,249,20,101,249,4,3,248,42,26,0,241,33,68,2,23,254,55,46,254,15,3,255,21,16,41,4,6,24,7,5,0,0,2,0,0,12,28,41,13,252,247,15,42,25,14,1,254,62,41,247,246,37,65,252,3,250,4,66,7,248,16,14,38,253,33,228,28,80,0,212,28,80,0,180,28,80,0,241,225,211,199,187,175,164,153,142,132,123,114,105,96,88,80,72,64,57,50,44,38,33,29,24,20,16,12,9,5,2,0,199,165,144,124,109,96,84,71,61,51,42,32,23,15,8,0,71,56,43,30,21,12,6,0,205,60,0,48,0,32,0,0,0,32,254,31,246,31,234,31,216,31,194,31,168,31,136,31,98,31,58,31,10,31,216,30,160,30,98,30,34,30,220,29,144,29,66,29,238,28,150,28,58,28,216,27,114,27,10,27,156,26,42,26,180,25,58,25,188,24,60,24,182,23,46,23,160,22,16,22,126,21,232,20,78,20,176,19,16,19,110,18,200,17,30,17,116,16,198,15,22,15,100,14,174,13,248,12,64,12,132,11,200,10,10,10,74,9,138,8,198,7,2,7,62,6,120,5,178,4,234,3,34,3,90,2,146,1,202,0,0,0,54,255,110,254,166,253,222,252,22,252,78,251,136,250,194,249,254,248,58,248,118,247,182,246,246,245,56,245,124,244,192,243,8,243,82,242,156,241,234,240,58,240,140,239,226,238,56,238,146,237,240,236,80,236,178,235,24,235,130,234,240,233,96,233,210,232,74,232,196,231,68,231,198,230,76,230,214,229,100,229,246,228,142,228,40,228,198,227,106,227,18,227,190,226,112,226,36,226,222,225,158,225,96,225,40,225,246,224,198,224,158,224,120,224,88,224,62,224,40,224,22,224,10,224,2,224,0,224,0,0,8,30,80,0,0,30,80,0,215,195,166,125,110,82,0,0,203,150,0,0,6,0,0,0,4,0,0,0,3,0,0,0,0,0,1,255,1,255,2,254,2,254,3,253,0,1,0,1,255,2,255,2,254,3,254,3,0,0,1,255,0,1,255,0,255,1,254,2,254,254,2,253,2,3,253,252,3,252,4,4,251,5,250,251,6,249,6,5,8,247,0,0,1,0,0,0,0,0,0,0,255,1,0,0,1,255,0,1,255,255,1,255,2,1,255,2,254,254,2,254,2,2,3,253,0,1,0,0,0,0,0,0,1,0,1,0,0,1,255,1,0,0,2,1,255,2,255,255,2,255,2,2,255,3,254,254,254,3,0,1,0,0,1,0,1,255,2,255,2,255,2,3,254,3,254,254,4,4,253,5,253,252,6,252,6,5,251,8,250,251,249,9,0,1,0,0,0,1,0,0,0,2,255,255,255,0,0,1,1,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,255,2,1,0,1,1,0,0,255,255,0,0,0,0,0,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,5,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,5,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,0,1,1,1,2,3,3,3,2,3,3,3,2,3,3,3,0,3,12,15,48,51,60,63,192,195,204,207,240,243,252,255,0,0,102,63,0,0,76,63,0,0,38,63,0,0,0,63,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,7,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,6,0,0,0,1,0,0,0,5,0,0,0,2,0,0,0,15,0,0,0,0,0,0,0,8,0,0,0,7,0,0,0,12,0,0,0,3,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,1,0,0,0,9,0,0,0,6,0,0,0,13,0,0,0,2,0,0,0,10,0,0,0,5,0,0,0,8,77,80,0,244,76,80,0,224,76,80,0,208,76,80,0,188,76,80,0,164,76,80,0,148,76,80,0,120,76,80,0,3,0,0,0,16,9,80,0,224,1,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,42,0,0,232,3,0,0,176,54,0,0,232,3,0,0,104,66,0,0,232,3,0,0,32,78,0,0,232,3,0,0,176,54,0,0,232,3,0,0,80,70,0,0,208,7,0,0,192,93,0,0,208,7,0,0,232,128,0,0,208,7,0,0,128,187,0,0,120,0,0,0,21,0,0,0,21,0,0,0,0,154,89,63,0,0,0,0,0,0,128,63,0,0,128,63,176,63,80,0,3,0,0,0,8,0,0,0,120,0,0,0,11,0,0,0,160,71,80,0,72,40,80,0,0,0,80,0,128,7,0,0,3,0,0,0,16,56,80,0,220,55,80,0,168,55,80,0,116,55,80,0,196,32,80,0,136,1,0,0,140,68,80,0,8,70,80,0,96,69,80,0,0,0,128,63,166,255,127,63,153,254,127,63,216,252,127,63,99,250,127,63,58,247,127,63,94,243,127,63,206,238,127,63,139,233,127,63,148,227,127,63,233,220,127,63,139,213,127,63,121,205,127,63,180,196,127,63,59,187,127,63,15,177,127,63,47,166,127,63,156,154,127,63,86,142,127,63,92,129,127,63,175,115,127,63,78,101,127,63,58,86,127,63,116,70,127,63,249,53,127,63,204,36,127,63,236,18,127,63,89,0,127,63,18,237,126,63,25,217,126,63,109,196,126,63,14,175,126,63,253,152,126,63,56,130,126,63,193,106,126,63,152,82,126,63,188,57,126,63,46,32,126,63,237,5,126,63,250,234,125,63,85,207,125,63,253,178,125,63,244,149,125,63,56,120,125,63,203,89,125,63,172,58,125,63,219,26,125,63,89,250,124,63,37,217,124,63,63,183,124,63,168,148,124,63,96,113,124,63,103,77,124,63,189,40,124,63,97,3,124,63,85,221,123,63,152,182,123,63,42,143,123,63,12,103,123,63,61,62,123,63,190,20,123,63,143,234,122,63,176,191,122,63,33,148,122,63,226,103,122,63,243,58,122,63,84,13,122,63,6,223,121,63,9,176,121,63,92,128,121,63,0,80,121,63,246,30,121,63,60,237,120,63,212,186,120,63,189,135,120,63,248,83,120,63,132,31,120,63,99,234,119,63,147,180,119,63,22,126,119,63,234,70,119,63,17,15,119,63,139,214,118,63,88,157,118,63,119,99,118,63,234,40,118,63,176,237,117,63,201,177,117,63,54,117,117,63,246,55,117,63,11,250,116,63,115,187,116,63,48,124,116,63,65,60,116,63,167,251,115,63,97,186,115,63,112,120,115,63,213,53,115,63,143,242,114,63,158,174,114,63,3,106,114,63,190,36,114,63,207,222,113,63,54,152,113,63,244,80,113,63,8,9,113,63,115,192,112,63,53,119,112,63,79,45,112,63,191,226,111,63,136,151,111,63,168,75,111,63,32,255,110,63,241,177,110,63,26,100,110,63,156,21,110,63,118,198,109,63,170,118,109,63,55,38,109,63,30,213,108,63,94,131,108,63,249,48,108,63,237,221,107,63,61,138,107,63,231,53,107,63,235,224,106,63,75,139,106,63,7,53,106,63,29,222,105,63,144,134,105,63,95,46,105,63,138,213,104,63,18,124,104,63,247,33,104,63,57,199,103,63,216,107,103,63,212,15,103,63,47,179,102,63,231,85,102,63,254,247,101,63,116,153,101,63,72,58,101,63,123,218,100,63,14,122,100,63,1,25,100,63,83,183,99,63,6,85,99,63,25,242,98,63,141,142,98,63,97,42,98,63,151,197,97,63,47,96,97,63,40,250,96,63,132,147,96,63,66,44,96,63,99,196,95,63,230,91,95,63,205,242,94,63,23,137,94,63,197,30,94,63,215,179,93,63,78,72,93,63,41,220,92,63,106,111,92,63,15,2,92,63,26,148,91,63,139,37,91,63,98,182,90,63,160,70,90,63,69,214,89,63,80,101,89,63,196,243,88,63,158,129,88,63,225,14,88,63,140,155,87,63,160,39,87,63,29,179,86,63,3,62,86,63,84,200,85,63,13,82,85,63,49,219,84,63,192,99,84,63,185,235,83,63,30,115,83,63,239,249,82,63,43,128,82,63,212,5,82,63,234,138,81,63,108,15,81,63,91,147,80,63,184,22,80,63,132,153,79,63,189,27,79,63,101,157,78,63,123,30,78,63,2,159,77,63,248,30,77,63,94,158,76,63,53,29,76,63,124,155,75,63,53,25,75,63,94,150,74,63,250,18,74,63,7,143,73,63,135,10,73,63,123,133,72,63,225,255,71,63,187,121,71,63,9,243,70,63,204,107,70,63,3,228,69,63,175,91,69,63,209,210,68,63,105,73,68,63,119,191,67,63,252,52,67,63,247,169,66,63,106,30,66,63,85,146,65,63,184,5,65,63,146,120,64,63,231,234,63,63,181,92,63,63,251,205,62,63,189,62,62,63,249,174,61,63,176,30,61,63,225,141,60,63,143,252,59,63,185,106,59,63,95,216,58,63,129,69,58,63,35,178,57,63,65,30,57,63,220,137,56,63,247,244,55,63,144,95,55,63,169,201,54,63,65,51,54,63,90,156,53,63,243,4,53,63,13,109,52,63,168,212,51,63,197,59,51,63,100,162,50,63,135,8,50,63,45,110,49,63,85,211,48,63,1,56,48,63,50,156,47,63,232,255,46,63,34,99,46,63,226,197,45,63,41,40,45,63,246,137,44,63,73,235,43,63,36,76,43,63,136,172,42,63,114,12,42,63,230,107,41,63,227,202,40,63,106,41,40,63,121,135,39,63,20,229,38,63,58,66,38,63,235,158,37,63,39,251,36,63,241,86,36,63,71,178,35,63,41,13,35,63,153,103,34,63,151,193,33,63,36,27,33,63,63,116,32,63,235,204,31,63,37,37,31,63,241,124,30,63,76,212,29,63,58,43,29,63,184,129,28,63,201,215,27,63,110,45,27,63,164,130,26,63,111,215,25,63,205,43,25,63,192,127,24,63,71,211,23,63,100,38,23,63,24,121,22,63,98,203,21,63,66,29,21,63,185,110,20,63,201,191,19,63,113,16,19,63,178,96,18,63,140,176,17,63,0,0,17,63,13,79,16,63,182,157,15,63,249,235,14,63,217,57,14,63,85,135,13,63,110,212,12,63,36,33,12,63,118,109,11,63,104,185,10,63,247,4,10,63,38,80,9,63,246,154,8,63,100,229,7,63,117,47,7,63,37,121,6,63,119,194,5,63,106,11,5,63,2,84,4,63,62,156,3,63,27,228,2,63,156,43,2,63,194,114,1,63,143,185,0,63,255,255,255,62,45,140,254,62,172,23,253,62,117,162,251,62,142,44,250,62,251,181,248,62,185,62,247,62,198,198,245,62,39,78,244,62,220,212,242,62,235,90,241,62,76,224,239,62,5,101,238,62,23,233,236,62,134,108,235,62,76,239,233,62,111,113,232,62,237,242,230,62,206,115,229,62,10,244,227,62,169,115,226,62,170,242,224,62,9,113,223,62,203,238,221,62,241,107,220,62,129,232,218,62,115,100,217,62,204,223,215,62,142,90,214,62,190,212,212,62,84,78,211,62,86,199,209,62,200,63,208,62,168,183,206,62,244,46,205,62,175,165,203,62,223,27,202,62,126,145,200,62,144,6,199,62,22,123,197,62,21,239,195,62,135,98,194,62,113,213,192,62,215,71,191,62,179,185,189,62,10,43,188,62,221,155,186,62,52,12,185,62,2,124,183,62,79,235,181,62,29,90,180,62,111,200,178,62,65,54,177,62,150,163,175,62,115,16,174,62,211,124,172,62,186,232,170,62,40,84,169,62,36,191,167,62,166,41,166,62,179,147,164,62,81,253,162,62,124,102,161,62,51,207,159,62,121,55,158,62,83,159,156,62,189,6,155,62,185,109,153,62,74,212,151,62,116,58,150,62,48,160,148,62,132,5,147,62,113,106,145,62,252,206,143,62,31,51,142,62,225,150,140,62,64,250,138,62,58,93,137,62,212,191,135,62,15,34,134,62,239,131,132,62,110,229,130,62,146,70,129,62,180,78,127,62,154,15,124,62,200,207,120,62,70,143,117,62,25,78,114,62,73,12,111,62,209,201,107,62,172,134,104,62,235,66,101,62,130,254,97,62,123,185,94,62,215,115,91,62,161,45,88,62,203,230,84,62,96,159,81,62,97,87,78,62,218,14,75,62,188,197,71,62,19,124,68,62,231,49,65,62,51,231,61,62,243,155,58,62,47,80,55,62,243,3,52,62,48,183,48,62,241,105,45,62,57,28,42,62,17,206,38,62,108,127,35,62,85,48,32,62,213,224,28,62,222,144,25,62,124,64,22,62,185,239,18,62,143,158,15,62,247,76,12,62,253,250,8,62,164,168,5,62,244,85,2,62,194,5,254,61,234,94,247,61,115,183,240,61,68,15,234,61,112,102,227,61,253,188,220,61,255,18,214,61,91,104,207,61,53,189,200,61,115,17,194,61,56,101,187,61,105,184,180,61,28,11,174,61,101,93,167,61,40,175,160,61,122,0,154,61,97,81,147,61,240,161,140,61,12,242,133,61,148,131,126,61,94,34,113,61].concat([158,192,99,61,63,94,86,61,41,251,72,61,166,151,59,61,128,51,46,61,223,206,32,61,205,105,19,61,116,4,6,61,59,61,241,60,227,112,214,60,245,163,187,60,195,214,160,60,225,8,134,60,64,117,86,60,40,216,32,60,62,119,214,59,43,119,86,59,46,189,59,179,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,8,0,8,0,8,0,16,0,16,0,16,0,21,0,21,0,24,0,29,0,34,0,36,0,0,0,0,0,128,63,0,0,0,0,99,250,127,63,191,117,86,188,139,233,127,63,10,113,214,188,121,205,127,63,231,206,32,189,47,166,127,63,58,94,86,189,175,115,127,63,19,242,133,189,249,53,127,63,42,175,160,189,18,237,126,63,51,101,187,189,253,152,126,63,4,19,214,189,188,57,126,63,115,183,240,189,85,207,125,63,168,168,5,190,203,89,125,63,187,239,18,190,37,217,124,63,92,48,32,190,103,77,124,63,245,105,45,190,152,182,123,63,243,155,58,190,190,20,123,63,194,197,71,190,226,103,122,63,205,230,84,190,9,176,121,63,130,254,97,190,60,237,120,63,77,12,111,190,132,31,120,63,156,15,124,190,234,70,119,63,238,131,132,190,119,99,118,63,62,250,138,190,54,117,117,63,117,106,145,190,48,124,116,63,76,212,151,190,113,120,115,63,122,55,158,190,3,106,114,63,183,147,164,190,244,80,113,63,188,232,170,190,79,45,112,63,65,54,177,190,33,255,110,63,1,124,183,190,118,198,109,63,180,185,189,190,94,131,108,63,21,239,195,190,231,53,107,63,222,27,202,190,30,222,105,63,201,63,208,190,18,124,104,63,146,90,214,190,212,15,103,63,243,107,220,190,116,153,101,63,170,115,226,190,1,25,100,63,113,113,232,190,141,142,98,63,7,101,238,190,40,250,96,63,39,78,244,190,230,91,95,63,144,44,250,190,215,179,93,63,0,0,0,191,15,2,92,63,27,228,2,191,160,70,90,63,119,194,5,191,158,129,88,63,246,154,8,191,29,179,86,63,119,109,11,191,49,219,84,63,218,57,14,191,239,249,82,63,0,0,17,191,108,15,81,63,202,191,19,191,189,27,79,63,24,121,22,191,248,30,77,63,205,43,25,191,52,25,75,63,202,215,27,191,136,10,73,63,241,124,30,191,10,243,70,63,36,27,33,191,209,210,68,63,70,178,35,191,247,169,66,63,58,66,38,191,147,120,64,63,227,202,40,191,189,62,62,63,37,76,43,191,143,252,59,63,227,197,45,191,34,178,57,63,1,56,48,191,144,95,55,63,101,162,50,191,243,4,53,63,243,4,53,191,101,162,50,63,144,95,55,191,1,56,48,63,34,178,57,191,227,197,45,63,143,252,59,191,37,76,43,63,189,62,62,191,227,202,40,63,147,120,64,191,58,66,38,63,247,169,66,191,70,178,35,63,209,210,68,191,36,27,33,63,10,243,70,191,241,124,30,63,136,10,73,191,202,215,27,63,52,25,75,191,205,43,25,63,248,30,77,191,24,121,22,63,189,27,79,191,202,191,19,63,108,15,81,191,0,0,17,63,239,249,82,191,218,57,14,63,49,219,84,191,119,109,11,63,29,179,86,191,246,154,8,63,158,129,88,191,119,194,5,63,160,70,90,191,27,228,2,63,15,2,92,191,0,0,0,63,215,179,93,191,144,44,250,62,230,91,95,191,39,78,244,62,40,250,96,191,7,101,238,62,141,142,98,191,113,113,232,62,1,25,100,191,170,115,226,62,116,153,101,191,243,107,220,62,212,15,103,191,146,90,214,62,18,124,104,191,201,63,208,62,30,222,105,191,222,27,202,62,231,53,107,191,21,239,195,62,94,131,108,191,180,185,189,62,118,198,109,191,1,124,183,62,33,255,110,191,65,54,177,62,79,45,112,191,188,232,170,62,244,80,113,191,183,147,164,62,3,106,114,191,122,55,158,62,113,120,115,191,76,212,151,62,48,124,116,191,117,106,145,62,54,117,117,191,62,250,138,62,119,99,118,191,238,131,132,62,234,70,119,191,156,15,124,62,132,31,120,191,77,12,111,62,60,237,120,191,130,254,97,62,9,176,121,191,205,230,84,62,226,103,122,191,194,197,71,62,190,20,123,191,243,155,58,62,152,182,123,191,245,105,45,62,103,77,124,191,92,48,32,62,37,217,124,191,187,239,18,62,203,89,125,191,168,168,5,62,85,207,125,191,115,183,240,61,188,57,126,191,4,19,214,61,253,152,126,191,51,101,187,61,18,237,126,191,42,175,160,61,249,53,127,191,19,242,133,61,175,115,127,191,58,94,86,61,47,166,127,191,231,206,32,61,121,205,127,191,10,113,214,60,139,233,127,191,191,117,86,60,99,250,127,191,0,48,141,36,0,0,128,191,191,117,86,188,99,250,127,191,10,113,214,188,139,233,127,191,231,206,32,189,121,205,127,191,58,94,86,189,47,166,127,191,19,242,133,189,175,115,127,191,42,175,160,189,249,53,127,191,51,101,187,189,18,237,126,191,4,19,214,189,253,152,126,191,115,183,240,189,188,57,126,191,168,168,5,190,85,207,125,191,187,239,18,190,203,89,125,191,92,48,32,190,37,217,124,191,245,105,45,190,103,77,124,191,243,155,58,190,152,182,123,191,194,197,71,190,190,20,123,191,205,230,84,190,226,103,122,191,130,254,97,190,9,176,121,191,77,12,111,190,60,237,120,191,156,15,124,190,132,31,120,191,238,131,132,190,234,70,119,191,62,250,138,190,119,99,118,191,117,106,145,190,54,117,117,191,76,212,151,190,48,124,116,191,122,55,158,190,113,120,115,191,183,147,164,190,3,106,114,191,188,232,170,190,244,80,113,191,65,54,177,190,79,45,112,191,1,124,183,190,33,255,110,191,180,185,189,190,118,198,109,191,21,239,195,190,94,131,108,191,222,27,202,190,231,53,107,191,201,63,208,190,30,222,105,191,146,90,214,190,18,124,104,191,243,107,220,190,212,15,103,191,170,115,226,190,116,153,101,191,113,113,232,190,1,25,100,191,7,101,238,190,141,142,98,191,39,78,244,190,40,250,96,191,144,44,250,190,230,91,95,191,0,0,0,191,215,179,93,191,27,228,2,191,15,2,92,191,119,194,5,191,160,70,90,191,246,154,8,191,158,129,88,191,119,109,11,191,29,179,86,191,218,57,14,191,49,219,84,191,0,0,17,191,239,249,82,191,202,191,19,191,108,15,81,191,24,121,22,191,189,27,79,191,205,43,25,191,248,30,77,191,202,215,27,191,52,25,75,191,241,124,30,191,136,10,73,191,36,27,33,191,10,243,70,191,70,178,35,191,209,210,68,191,58,66,38,191,247,169,66,191,227,202,40,191,147,120,64,191,37,76,43,191,189,62,62,191,227,197,45,191,143,252,59,191,1,56,48,191,34,178,57,191,101,162,50,191,144,95,55,191,243,4,53,191,243,4,53,191,144,95,55,191,101,162,50,191,34,178,57,191,1,56,48,191,143,252,59,191,227,197,45,191,189,62,62,191,37,76,43,191,147,120,64,191,227,202,40,191,247,169,66,191,58,66,38,191,209,210,68,191,70,178,35,191,10,243,70,191,36,27,33,191,136,10,73,191,241,124,30,191,52,25,75,191,202,215,27,191,248,30,77,191,205,43,25,191,189,27,79,191,24,121,22,191,108,15,81,191,202,191,19,191,239,249,82,191,0,0,17,191,49,219,84,191,218,57,14,191,29,179,86,191,119,109,11,191,158,129,88,191,246,154,8,191,160,70,90,191,119,194,5,191,15,2,92,191,27,228,2,191,215,179,93,191,0,0,0,191,230,91,95,191,144,44,250,190,40,250,96,191,39,78,244,190,141,142,98,191,7,101,238,190,1,25,100,191,113,113,232,190,116,153,101,191,170,115,226,190,212,15,103,191,243,107,220,190,18,124,104,191,146,90,214,190,30,222,105,191,201,63,208,190,231,53,107,191,222,27,202,190,94,131,108,191,21,239,195,190,118,198,109,191,180,185,189,190,33,255,110,191,1,124,183,190,79,45,112,191,65,54,177,190,244,80,113,191,188,232,170,190,3,106,114,191,183,147,164,190,113,120,115,191,122,55,158,190,48,124,116,191,76,212,151,190,54,117,117,191,117,106,145,190,119,99,118,191,62,250,138,190,234,70,119,191,238,131,132,190,132,31,120,191,156,15,124,190,60,237,120,191,77,12,111,190,9,176,121,191,130,254,97,190,226,103,122,191,205,230,84,190,190,20,123,191,194,197,71,190,152,182,123,191,243,155,58,190,103,77,124,191,245,105,45,190,37,217,124,191,92,48,32,190,203,89,125,191,187,239,18,190,85,207,125,191,168,168,5,190,188,57,126,191,115,183,240,189,253,152,126,191,4,19,214,189,18,237,126,191,51,101,187,189,249,53,127,191,42,175,160,189,175,115,127,191,19,242,133,189,47,166,127,191,58,94,86,189,121,205,127,191,231,206,32,189,139,233,127,191,10,113,214,188,99,250,127,191,191,117,86,188,0,0,128,191,0,48,13,165,99,250,127,191,191,117,86,60,139,233,127,191,10,113,214,60,121,205,127,191,231,206,32,61,47,166,127,191,58,94,86,61,175,115,127,191,19,242,133,61,249,53,127,191,42,175,160,61,18,237,126,191,51,101,187,61,253,152,126,191,4,19,214,61,188,57,126,191,115,183,240,61,85,207,125,191,168,168,5,62,203,89,125,191,187,239,18,62,37,217,124,191,92,48,32,62,103,77,124,191,245,105,45,62,152,182,123,191,243,155,58,62,190,20,123,191,194,197,71,62,226,103,122,191,205,230,84,62,9,176,121,191,130,254,97,62,60,237,120,191,77,12,111,62,132,31,120,191,156,15,124,62,234,70,119,191,238,131,132,62,119,99,118,191,62,250,138,62,54,117,117,191,117,106,145,62,48,124,116,191,76,212,151,62,113,120,115,191,122,55,158,62,3,106,114,191,183,147,164,62,244,80,113,191,188,232,170,62,79,45,112,191,65,54,177,62,33,255,110,191,1,124,183,62,118,198,109,191,180,185,189,62,94,131,108,191,21,239,195,62,231,53,107,191,222,27,202,62,30,222,105,191,201,63,208,62,18,124,104,191,146,90,214,62,212,15,103,191,243,107,220,62,116,153,101,191,170,115,226,62,1,25,100,191,113,113,232,62,141,142,98,191,7,101,238,62,40,250,96,191,39,78,244,62,230,91,95,191,144,44,250,62,215,179,93,191,0,0,0,63,15,2,92,191,27,228,2,63,160,70,90,191,119,194,5,63,158,129,88,191,246,154,8,63,29,179,86,191,119,109,11,63,49,219,84,191,218,57,14,63,239,249,82,191,0,0,17,63,108,15,81,191,202,191,19,63,189,27,79,191,24,121,22,63,248,30,77,191,205,43,25,63,52,25,75,191,202,215,27,63,136,10,73,191,241,124,30,63,10,243,70,191,36,27,33,63,209,210,68,191,70,178,35,63,247,169,66,191,58,66,38,63,147,120,64,191,227,202,40,63,189,62,62,191,37,76,43,63,143,252,59,191,227,197,45,63,34,178,57,191,1,56,48,63,144,95,55,191,101,162,50,63,243,4,53,191,243,4,53,63,101,162,50,191,144,95,55,63,1,56,48,191,34,178,57,63,227,197,45,191,143,252,59,63,37,76,43,191,189,62,62,63,227,202,40,191,147,120,64,63,58,66,38,191,247,169,66,63,70,178,35,191,209,210,68,63,36,27,33,191,10,243,70,63,241,124,30,191,136,10,73,63,202,215,27,191,52,25,75,63,205,43,25,191,248,30,77,63,24,121,22,191,189,27,79,63,202,191,19,191,108,15,81,63,0,0,17,191,239,249,82,63,218,57,14,191,49,219,84,63,119,109,11,191,29,179,86,63,246,154,8,191,158,129,88,63,119,194,5,191,160,70,90,63,27,228,2,191,15,2,92,63,0,0,0,191,215,179,93,63,144,44,250,190,230,91,95,63,39,78,244,190,40,250,96,63,7,101,238,190,141,142,98,63,113,113,232,190,1,25,100,63,170,115,226,190,116,153,101,63,243,107,220,190,212,15,103,63,146,90,214,190,18,124,104,63,201,63,208,190,30,222,105,63,222,27,202,190,231,53,107,63,21,239,195,190,94,131,108,63,180,185,189,190,118,198,109,63,1,124,183,190,33,255,110,63,65,54,177,190,79,45,112,63,188,232,170,190,244,80,113,63,183,147,164,190,3,106,114,63,122,55,158,190,113,120,115,63,76,212,151,190,48,124,116,63,117,106,145,190,54,117,117,63,62,250,138,190,119,99,118,63,238,131,132,190,234,70,119,63,156,15,124,190,132,31,120,63,77,12,111,190,60,237,120,63,130,254,97,190,9,176,121,63,205,230,84,190,226,103,122,63,194,197,71,190,190,20,123,63,243,155,58,190,152,182,123,63,245,105,45,190,103,77,124,63,92,48,32,190,37,217,124,63,187,239,18,190,203,89,125,63,168,168,5,190,85,207,125,63,115,183,240,189,188,57,126,63,4,19,214,189,253,152,126,63,51,101,187,189,18,237,126,63,42,175,160,189,249,53,127,63,19,242,133,189,175,115,127,63,58,94,86,189,47,166,127,63,231,206,32,189,121,205,127,63,10,113,214,188,139,233,127,63,191,117,86,188,99,250,127,63,0,200,83,165,0,0,128,63,191,117,86,60,99,250,127,63,10,113,214,60,139,233,127,63,231,206,32,61,121,205,127,63,58,94,86,61,47,166,127,63,19,242,133,61,175,115,127,63,42,175,160,61,249,53,127,63,51,101,187,61,18,237,126,63,4,19,214,61,253,152,126,63,115,183,240,61,188,57,126,63,168,168,5,62,85,207,125,63,187,239,18,62,203,89,125,63,92,48,32,62,37,217,124,63,245,105,45,62,103,77,124,63,243,155,58,62,152,182,123,63,194,197,71,62,190,20,123,63,205,230,84,62,226,103,122,63,130,254,97,62,9,176,121,63,77,12,111,62,60,237,120,63,156,15,124,62,132,31,120,63,238,131,132,62,234,70,119,63,62,250,138,62,119,99,118,63,117,106,145,62,54,117,117,63,76,212,151,62,48,124,116,63,122,55,158,62,113,120,115,63,183,147,164,62,3,106,114,63,188,232,170,62,244,80,113,63,65,54,177,62,79,45,112,63,1,124,183,62,33,255,110,63,180,185,189,62,118,198,109,63,21,239,195,62,94,131,108,63,222,27,202,62,231,53,107,63,201,63,208,62,30,222,105,63,146,90,214,62,18,124,104,63,243,107,220,62,212,15,103,63,170,115,226,62,116,153,101,63,113,113,232,62,1,25,100,63,7,101,238,62,141,142,98,63,39,78,244,62,40,250,96,63,144,44,250,62,230,91,95,63,0,0,0,63,215,179,93,63,27,228,2,63,15,2,92,63,119,194,5,63,160,70,90,63,246,154,8,63,158,129,88,63,119,109,11,63,29,179,86,63,218,57,14,63,49,219,84,63,0,0,17,63,239,249,82,63,202,191,19,63,108,15,81,63,24,121,22,63,189,27,79,63,205,43,25,63,248,30,77,63,202,215,27,63,52,25,75,63,241,124,30,63,136,10,73,63,36,27,33,63,10,243,70,63,70,178,35,63,209,210,68,63,58,66,38,63,247,169,66,63,227,202,40,63,147,120,64,63,37,76,43,63,189,62,62,63,227,197,45,63,143,252,59,63,1,56,48,63,34,178,57,63,101,162,50,63,144,95,55,63,243,4,53,63,243,4,53,63,144,95,55,63,101,162,50,63,34,178,57,63,1,56,48,63,143,252,59,63,227,197,45,63,189,62,62,63,37,76,43,63,147,120,64,63,227,202,40,63,247,169,66,63,58,66,38,63,209,210,68,63,70,178,35,63,10,243,70,63,36,27,33,63,136,10,73,63,241,124,30,63,52,25,75,63,202,215,27,63,248,30,77,63,205,43,25,63,189,27,79,63,24,121,22,63,108,15,81,63,202,191,19,63,239,249,82,63,0,0,17,63,49,219,84,63,218,57,14,63,29,179,86,63,119,109,11,63,158,129,88,63,246,154,8,63,160,70,90,63,119,194,5,63,15,2,92,63,27,228,2,63,215,179,93,63,0,0,0,63,230,91,95,63,144,44,250,62,40,250,96,63,39,78,244,62,141,142,98,63,7,101,238,62,1,25,100,63,113,113,232,62,116,153,101,63,170,115,226,62,212,15,103,63,243,107,220,62,18,124,104,63,146,90,214,62,30,222,105,63,201,63,208,62,231,53,107,63,222,27,202,62,94,131,108,63,21,239,195,62,118,198,109,63,180,185,189,62,33,255,110,63,1,124,183,62,79,45,112,63,65,54,177,62,244,80,113,63,188,232,170,62,3,106,114,63,183,147,164,62,113,120,115,63,122,55,158,62,48,124,116,63,76,212,151,62,54,117,117,63,117,106,145,62,119,99,118,63,62,250,138,62,234,70,119,63,238,131,132,62,132,31,120,63,156,15,124,62,60,237,120,63,77,12,111,62,9,176,121,63,130,254,97,62,226,103,122,63,205,230,84,62,190,20,123,63,194,197,71,62,152,182,123,63,243,155,58,62,103,77,124,63,245,105,45,62,37,217,124,63,92,48,32,62,203,89,125,63,187,239,18,62,85,207,125,63,168,168,5,62,188,57,126,63,115,183,240,61,253,152,126,63,4,19,214,61,18,237,126,63,51,101,187,61,249,53,127,63,42,175,160,61,175,115,127,63,19,242,133,61,47,166,127,63,58,94,86,61,121,205,127,63,231,206,32,61,139,233,127,63,10,113,214,60,99,250,127,63,191,117,86,60,60,0,0,0,137,136,136,60,3,0,0,0,4,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,56,80,0,116,40,80,0,120,0,0,0,136,136,8,60,2,0,0,0,4,0,30,0,2,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,62,80,0,116,40,80,0,240,0,0,0,137,136,136,59,1,0,0,0,4,0,60,0,4,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,124,60,80,0,116,40,80,0,224,1,0,0,135,136,8,59,255,255,255,255,4,0,120,0,4,0,30,0,2,0,15,0,3,0,5,0,5,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,188,56,80,0,116,40,80,0,0,0,15,0,30,0,45,0,5,0,20,0,35,0,50,0,10,0,25,0,40,0,55,0,1,0,16,0,31,0,46,0,6,0,21,0,36,0,51,0,11,0,26,0,41,0,56,0,2,0,17,0,32,0,47,0,7,0,22,0,37,0,52,0,12,0,27,0,42,0,57,0,3,0,18,0,33,0,48,0,8,0,23,0,38,0,53,0,13,0,28,0,43,0,58,0,4,0,19,0,34,0,49,0,9,0,24,0,39,0,54,0,14,0,29,0,44,0,59,0,0,0,120,0,240,0,104,1,30,0,150,0,14,1,134,1,60,0,180,0,44,1,164,1,90,0,210,0,74,1,194,1,15,0,135,0,255,0,119,1,45,0,165,0,29,1,149,1,75,0,195,0,59,1,179,1,105,0,225,0,89,1,209,1,5,0,125,0,245,0,109,1,35,0,155,0,19,1,139,1,65,0,185,0,49,1,169,1,95,0,215,0,79,1,199,1,20,0,140,0,4,1,124,1,50,0,170,0,34,1,154,1,80,0,200,0,64,1,184,1,110,0,230,0,94,1,214,1,10,0,130,0,250,0,114,1,40,0,160,0,24,1,144,1,70,0,190,0,54,1,174,1,100,0,220,0,84,1,204,1,25,0,145,0,9,1,129,1,55,0,175,0,39,1,159,1,85,0,205,0,69,1,189,1,115,0,235,0,99,1,219,1,1,0,121,0,241,0,105,1,31,0,151,0,15,1,135,1,61,0,181,0,45,1,165,1,91,0,211,0,75,1,195,1,16,0,136,0,0,1,120,1,46,0,166,0,30,1,150,1,76,0,196,0,60,1,180,1,106,0,226,0,90,1,210,1,6,0,126,0,246,0,110,1,36,0,156,0,20,1,140,1,66,0,186,0,50,1,170,1,96,0,216,0,80,1,200,1,21,0,141,0,5,1,125,1,51,0,171,0,35,1,155,1,81,0,201,0,65,1,185,1,111,0,231,0,95,1,215,1,11,0,131,0,251,0,115,1,41,0,161,0,25,1,145,1,71,0,191,0,55,1,175,1,101,0,221,0,85,1,205,1,26,0,146,0,10,1,130,1,56,0,176,0,40,1,160,1,86,0,206,0,70,1,190,1,116,0,236,0,100,1,220,1,2,0,122,0,242,0,106,1,32,0,152,0,16,1,136,1,62,0,182,0,46,1,166,1,92,0,212,0,76,1,196,1,17,0,137,0,1,1,121,1,47,0,167,0,31,1,151,1,77,0,197,0,61,1,181,1,107,0,227,0,91,1,211,1,7,0,127,0,247,0,111,1,37,0,157,0,21,1,141,1,67,0,187,0,51,1,171,1,97,0,217,0,81,1,201,1,22,0,142,0,6,1,126,1,52,0,172,0,36,1,156,1,82,0,202,0,66,1,186,1,112,0,232,0,96,1,216,1,12,0,132,0,252,0,116,1,42,0,162,0,26,1,146,1,72,0,192,0,56,1,176,1,102,0,222,0,86,1,206,1,27,0,147,0,11,1,131,1,57,0,177,0,41,1,161,1,87,0,207,0,71,1,191,1,117,0,237,0,101,1,221,1,3,0,123,0,243,0,107,1,33,0,153,0,17,1,137,1,63,0,183,0,47,1,167,1,93,0,213,0,77,1,197,1,18,0,138,0,2,1,122,1,48,0,168,0,32,1,152,1,78,0,198,0,62,1,182,1,108,0,228,0,92,1,212,1,8,0,128,0,248,0,112,1,38,0,158,0,22,1,142,1,68,0,188,0,52,1,172,1,98,0,218,0,82,1,202,1,23,0,143,0,7,1,127,1,53,0,173,0,37,1,157,1,83,0,203,0,67,1,187,1,113,0,233,0,97,1,217,1,13,0,133,0,253,0,117,1,43,0,163,0,27,1,147,1,73,0,193,0,57,1,177,1,103,0,223,0,87,1,207,1,28,0,148,0,12,1,132,1,58,0,178,0,42,1,162,1,88,0,208,0,72,1,192,1,118,0,238,0,102,1,222,1,4,0,124,0,244,0,108,1,34,0,154,0,18,1,138,1,64,0,184,0,48,1,168,1,94,0,214,0,78,1,198,1,19,0,139,0,3,1,123,1,49,0,169,0,33,1,153,1,79,0,199,0,63,1,183,1,109,0,229,0,93,1,213,1,9,0,129,0,249,0,113,1,39,0,159,0,23,1,143,1,69,0,189,0,53,1,173,1,99,0,219,0,83,1,203,1,24,0,144,0,8,1,128,1,54,0,174,0,38,1,158,1,84,0,204,0,68,1,188,1,114,0,234,0,98,1,218,1,14,0,134,0,254,0,118,1,44,0,164,0,28,1,148,1,74,0,194,0,58,1,178,1,104,0,224,0,88,1,208,1,29,0,149,0,13,1,133,1,59,0,179,0,43,1,163,1,89,0,209,0,73,1,193,1,119,0,239,0,103,1,223,1,0,0,60,0,120,0,180,0,15,0,75,0,135,0,195,0,30,0,90,0,150,0,210,0,45,0,105,0,165,0,225,0,5,0,65,0,125,0,185,0,20,0,80,0,140,0,200,0,35,0,95,0,155,0,215,0,50,0,110,0,170,0,230,0,10,0,70,0,130,0,190,0,25,0,85,0,145,0,205,0,40,0,100,0,160,0,220,0,55,0,115,0,175,0,235,0,1,0,61,0,121,0,181,0,16,0,76,0,136,0,196,0,31,0,91,0,151,0,211,0,46,0,106,0,166,0,226,0,6,0,66,0,126,0,186,0,21,0,81,0,141,0,201,0,36,0,96,0,156,0,216,0,51,0,111,0,171,0,231,0,11,0,71,0,131,0,191,0,26,0,86,0,146,0,206,0,41,0,101,0,161,0,221,0,56,0,116,0,176,0,236,0,2,0,62,0,122,0,182,0,17,0,77,0,137,0,197,0,32,0,92,0,152,0,212,0,47,0,107,0,167,0,227,0,7,0,67,0,127,0,187,0,22,0,82,0,142,0,202,0,37,0,97,0,157,0,217,0,52,0,112,0,172,0,232,0,12,0,72,0,132,0,192,0,27,0,87,0,147,0,207,0,42,0,102,0,162,0,222,0,57,0,117,0,177,0,237,0,3,0,63,0,123,0,183,0,18,0,78,0,138,0,198,0,33,0,93,0,153,0,213,0,48,0,108,0,168,0,228,0,8,0,68,0,128,0,188,0,23,0,83,0,143,0,203,0,38,0,98,0,158,0,218,0,53,0,113,0,173,0,233,0,13,0,73,0,133,0,193,0,28,0,88,0,148,0,208,0,43,0,103,0,163,0,223,0,58,0,118,0,178,0,238,0,4,0,64,0,124,0,184,0,19,0,79,0,139,0,199,0,34,0,94,0,154,0,214,0,49,0,109,0,169,0,229,0,9,0,69,0,129,0,189,0,24,0,84,0,144,0,204,0,39,0,99,0,159,0,219,0,54,0,114,0,174,0,234,0,14,0,74,0,134,0,194,0,29,0,89,0,149,0,209,0,44,0,104,0,164,0,224,0,59,0,119,0,179,0,239,0,0,0,30,0,60,0,90,0,15,0,45,0,75,0,105,0,5,0,35,0,65,0,95,0,20,0,50,0,80,0,110,0,10,0,40,0,70,0,100,0,25,0,55,0,85,0,115,0,1,0,31,0,61,0,91,0,16,0,46,0,76,0,106,0,6,0,36,0,66,0,96,0,21,0,51,0,81,0,111,0,11,0,41,0,71,0,101,0,26,0,56,0,86,0,116,0,2,0,32,0,62,0,92,0,17,0,47,0,77,0,107,0,7,0,37,0,67,0,97,0,22,0,52,0,82,0,112,0,12,0,42,0,72,0,102,0,27,0,57,0,87,0,117,0,3,0,33,0,63,0,93,0,18,0,48,0,78,0,108,0,8,0,38,0,68,0,98,0,23,0,53,0,83,0,113,0,13,0,43,0,73,0,103,0,28,0,58,0,88,0,118,0,4,0,34,0,64,0,94,0,19,0,49,0,79,0,109,0,9,0,39,0,69,0,99,0,24,0,54,0,84,0,114,0,14,0,44,0,74,0,104,0,29,0,59,0,89,0,119,0,1,0,0,0,2,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,68,0,0,0,80,0,0,0,96,0,0,0,120,0,0,0,160,0,0,0,200,0,0,0,15,0,0,0,10,0,0,0,5,0,0,0,0,0,1,0,2,0,3,0,4,0,5,0,6,0,7,0,8,0,10,0,12,0,14,0,16,0,20,0,24,0,28,0,34,0,40,0,48,0,60,0,78,0,100,0,72,127,65,129,66,128,65,128,64,128,62,128,64,128,64,128,92,78,92,79,92,78,90,79,116,41,115,40,114,40,132,26,132,26,145,17,161,12,176,10,177,11,24,179,48,138,54,135,54,132,53,134,56,133,55,132,55,132,61,114,70,96,74,88,75,88,87,74,89,66,91,67,100,59,108,50,120,40,122,37,97,43,78,50,83,78,84,81,88,75,86,74,87,71,90,73,93,74,93,74,109,40,114,36,117,34,117,34,143,17,145,18,146,19,162,12,165,10,178,7,189,6,190,8,177,9,23,178,54,115,63,102,66,98,69,99,74,89,71,91,73,91,78,89,86,80,92,66,93,64,102,59,103,60,104,60,117,52,123,44,138,35,133,31,97,38,77,45,61,90,93,60,105,42,107,41,110,45,116,38,113,38,112,38,124,26,132,27,136,19,140,20,155,14,159,16,158,18,170,13,177,10,187,8,192,6,175,9,159,10,21,178,59,110,71,86,75,85,84,83,91,66,88,73,87,72,92,75,98,72,105,58,107,54,115,52,114,55,112,56,129,51,132,40,150,33,140,29,98,35,77,42,42,121,96,66,108,43,111,40,117,44,123,32,120,36,119,33,127,33,134,34,139,21,147,23,152,20,158,25,154,26,166,21,173,16,184,13,184,10,150,13,139,15,22,178,63,114,74,82,84,83,92,82,103,62,96,72,96,67,101,73,107,72,113,55,118,52,125,52,118,52,117,55,135,49,137,39,157,32,145,29,97,33,77,40,0,0,206,64,0,0,200,64,0,0,184,64,0,0,170,64,0,0,162,64,0,0,154,64,0,0,144,64,0,0,140,64,0,0,156,64,0,0,150,64,0,0,146,64,0,0,142,64,0,0,156,64,0,0,148,64,0,0,138,64,0,0,144,64,0,0,140,64,0,0,148,64,0,0,152,64,0,0,142,64,0,0,112,64,0,0,112,64,0,0,112,64,0,0,112,64,0,0,112,64,6,0,3,0,7,3,0,1,10,0,2,6,18,10,12,0,4,0,2,0,0,0,9,4,7,4,0,3,12,7,7,0,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,0,0,128,62,208,37,180,62,151,57,173,62,9,165,159,62,250,237,139,62,205,172,101,62,248,169,42,62,52,48,210,61,90,241,13,61,90,241,13,189,52,48,210,189,248,169,42,190,205,172,101,190,250,237,139,190,9,165,159,190,151,57,173,190,208,37,180,190,135,138,177,62,27,131,150,62,96,35,73,62,196,66,141,61,196,66,141,189,96,35,73,190,27,131,150,190,135,138,177,190,135,138,177,190,27,131,150,190,96,35,73,190,196,66,141,189,196,66,141,61,96,35,73,62,27,131,150,62,135,138,177,62,151,57,173,62,205,172,101,62,90,241,13,61,248,169,42,190,9,165,159,190,208,37,180,190,250,237,139,190,52,48,210,189,52,48,210,61,250,237,139,62,208,37,180,62,9,165,159,62,248,169,42,62,90,241,13,189,205,172,101,190,151,57,173,190,125,61,167,62,210,139,10,62,210,139,10,190,125,61,167,190,125,61,167,190,210,139,10,190,210,139,10,62,125,61,167,62,125,61,167,62,210,139,10,62,210,139,10,190,125,61,167,190,125,61,167,190,210,139,10,190,210,139,10,62,125,61,167,62,9,165,159,62,90,241,13,61,250,237,139,190,151,57,173,190,52,48,210,189,205,172,101,62,208,37,180,62,248,169,42,62,248,169,42,190,208,37,180,190,205,172,101,190,52,48,210,61,151,57,173,62,250,237,139,62,90,241,13,189,9,165,159,190,27,131,150,62,196,66,141,189,135,138,177,190,96,35,73,190,96,35,73,62,135,138,177,62,196,66,141,61,27,131,150,190,27,131,150,190,196,66,141,61,135,138,177,62,96,35,73,62,96,35,73,190,135,138,177,190,196,66,141,189,27,131,150,62,250,237,139,62,248,169,42,190,151,57,173,190,90,241,13,61,208,37,180,62,52,48,210,61,9,165,159,190,205,172,101,190,205,172,101,62,9,165,159,62,52,48,210,189,208,37,180,190,90,241,13,189,151,57,173,62,248,169,42,62,250,237,139,190,0,64,202,69,27,76,255,82,130,90,179,98,162,107,96,117,0,0,157,62,0,64,94,62,0,192,4,62,0,128,237,62,0,64,137,62,0,0,0,0,0,192,76,63,0,0,205,61,0,0,0,0,0,0,128,65,0,0,168,65,0,0,184,65,0,0,200,65,0,0,216,65,0,0,232,65,0,0,248,65,0,0,4,66,0,0,12,66,0,0,24,66,0,0,40,66,0,0,56,66,0,0,72,66,0,0,88,66,0,0,104,66,0,0,124,66,0,0,136,66,0,0,150,66,0,0,168,66,0,0,204,66,0,0,2,67,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,0,64,0,0,64,64,0,0,128,64,0,0,160,64,0,0,192,64,0,0,0,65,0,0,64,65,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,41,0,41,0,41,0,82,0,82,0,123,0,164,0,200,0,222,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,0,41,0,41,0,41,0,123,0,123,0,123,0,164,0,164,0,240,0,10,1,27,1,39,1,41,0,41,0,41,0,41,0,41,0,41,0,41,0,41,0,123,0,123,0,123,0,123,0,240,0,240,0,240,0,10,1,10,1,49,1,62,1,72,1,80,1,123,0,123,0,123,0,123,0,123,0,123,0,123,0,123,0,240,0,240,0,240,0,240,0,49,1,49,1,49,1,62,1,62,1,87,1,95,1,102,1,108,1,240,0,240,0,240,0,240,0,240,0,240,0,240,0,240,0,49,1,49,1,49,1,49,1,87,1,87,1,87,1,95,1,95,1,114,1,120,1,126,1,131,1,0,0,224,224,224,224,224,224,224,224,160,160,160,160,185,185,185,178,178,168,134,61,37,224,224,224,224,224,224,224,224,240,240,240,240,207,207,207,198,198,183,144,66,40,160,160,160,160,160,160,160,160,185,185,185,185,193,193,193,183,183,172,138,64,38,240,240,240,240,240,240,240,240,207,207,207,207,204,204,204,193,193,180,143,66,40,185,185,185,185,185,185,185,185,193,193,193,193,193,193,193,183,183,172,138,65,39,207,207,207,207,207,207,207,207,204,204,204,204,201,201,201,188,188,176,141,66,40,193,193,193,193,193,193,193,193,193,193,193,193,194,194,194,184,184,173,139,65,39,204,204,204,204,204,204,204,204,201,201,201,201,198,198,198,187,187,175,140,66,40,40,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,40,15,23,28,31,34,36,38,39,41,42,43,44,45,46,47,47,49,50,51,52,53,54,55,55,57,58,59,60,61,62,63,63,65,66,67,68,69,70,71,71,40,20,33,41,48,53,57,61,64,66,69,71,73,75,76,78,80,82,85,87,89,91,92,94,96,98,101,103,105,107,108,110,112,114,117,119,121,123,124,126,128,40,23,39,51,60,67,73,79,83,87,91,94,97,100,102,105,107,111,115,118,121,124,126,129,131,135,139,142,145,148,150,153,155,159,163,166,169,172,174,177,179,35,28,49,65,78,89,99,107,114,120,126,132,136,141,145,149,153,159,165,171,176,180,185,189,192,199,205,211,216,220,225,229,232,239,245,251,21,33,58,79,97,112,125,137,148,157,166,174,182,189,195,201,207,217,227,235,243,251,17,35,63,86,106,123,139,152,165,177,187,197,206,214,222,230,237,250,25,31,55,75,91,105,117,128,138,146,154,161,168,174,180,185,190,200,208,215,222,229,235,240,245,255,16,36,65,89,110,128,144,159,173,185,196,207,217,226,234,242,250,11,41,74,103,128,151,172,191,209,225,241,255,9,43,79,110,138,163,186,207,227,246,12,39,71,99,123,144,164,182,198,214,228,241,253,9,44,81,113,142,168,192,214,235,255,7,49,90,127,160,191,220,247,6,51,95,134,170,203,234,7,47,87,123,155,184,212,237,6,52,97,137,174,208,240,5,57,106,151,192,231,5,59,111,158,202,243,5,55,103,147,187,224,5,60,113,161,206,248,4,65,122,175,224,4,67,127,182,234,0,134,107,63,0,20,46,63,0,112,189,62,0,208,76,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,90,80,75,69,63,56,49,40,34,29,20,18,10,0,0,0,0,0,0,0,0,110,100,90,84,78,71,65,58,51,45,39,32,26,20,12,0,0,0,0,0,0,118,110,103,93,86,80,75,70,65,59,53,47,40,31,23,15,4,0,0,0,0,126,119,112,104,95,89,83,78,72,66,60,54,47,39,32,25,17,12,1,0,0,134,127,120,114,103,97,91,85,78,72,66,60,54,47,41,35,29,23,16,10,1,144,137,130,124,113,107,101,95,88,82,76,70,64,57,51,45,39,33,26,15,1,152,145,138,132,123,117,111,105,98,92,86,80,74,67,61,55,49,43,36,20,1,162,155,148,142,133,127,121,115,108,102,96,90,84,77,71,65,59,53,46,30,1,172,165,158,152,143,137,131,125,118,112,106,100,94,87,81,75,69,63,56,45,20,200,200,200,200,200,200,200,200,198,193,188,183,178,173,168,163,158,153,148,129,104,0,230,90,52,56,119,78,51,57,211,217,201,57,146,145,51,58,204,96,140,58,97,251,201,58,153,126,9,59,203,128,51,59,213,37,99,59,119,46,140,59,168,138,169,59,69,184,201,59,135,166,236,59,232,46,9,60,174,102,29,60,247,2,51,60,147,255,73,60,79,88,98,60,94,17,124,60,46,145,139,60,189,199,153,60,92,172,168,60,243,60,184,60,129,121,200,60,238,95,217,60,57,240,234,60,99,42,253,60,53,7,8,61,16,204,17,61,205,228,27,61,97,80,38,61,203,14,49,61,0,31,60,61,254,128,71,61,198,52,83,61,63,56,95,61,105,139,107,61,69,46,120,61,105,144,130,61,123,48,137,61,224,247,143,61,138,229,150,61,123,249,157,61,177,51,165,61,33,147,172,61,80,24,180,61,51,194,187,61,79,145,195,61,18,132,203,61,2,155,211,61,31,214,219,61,215,51,228,61,175,180,236,61,33,88,245,61,168,29,254,61,161,130,3,62,242,6,8,62,199,155,12,62,221,64,17,62,52,246,21,62,69,187,26,62,17,144,31,62,84,116,36,62,203,103,41,62,51,106,46,62,141,123,51,62,82,155,56,62,197,201,61,62,28,6,67,62,89,80,72,62,122,168,77,62,183,13,83,62,82,128,88,62,8,0,94,62,84,140,99,62,242,36,105,62,37,202,110,62,36,123,116,62,172,55,122,62,0,0,128,62,171,233,130,62,249,216,133,62,133,205,136,62,80,199,139,62,55,198,142,62,247,201,145,62,179,210,148,62,38,224,151,62,15,242,154,62,108,8,158,62,28,35,161,62,255,65,164,62,208,100,167,62,177,139,170,62,28,182,173,62,84,228,176,62,211,21,180,62,186,74,183,62,232,130,186,62,249,189,189,62,13,252,192,62,226,60,196,62,86,128,199,62,71,198,202,62,149,14,206,62,251,88,209,62,122,165,212,62,241,243,215,62,28,68,219,62,217,149,222,62,8,233,225,62,167,61,229,62,83,147,232,62,12,234,235,62,175,65,239,62,28,154,242,62,14,243,245,62,136,76,249,62,34,166,252,62,0,0,0,63,239,172,1,63,188,89,3,63,121,6,5,63,242,178,6,63,41,95,8,63,250,10,10,63,86,182,11,63,44,97,13,63,124,11,15,63,19,181,16,63,242,93,18,63,8,6,20,63,67,173,21,63,130,83,23,63,182,248,24,63,220,156,26,63,213,63,28,63,143,225,29,63,249,129,31,63,4,33,33,63,140,190,34,63,163,90,36,63,23,245,37,63,214,141,39,63,242,36,41,63,40,186,42,63,152,77,44,63,1,223,45,63,114,110,47,63,202,251,48,63,249,134,50,63,237,15,52,63,167,150,53,63,4,27,55,63,229,156,56,63,88,28,58,63,61,153,59,63,131,19,61,63,42,139,62,63,0,0,64,63,21,114,65,63,55,225,66,63,119,77,68,63,195,182,69,63,235,28,71,63,254,127,72,63,236,223,73,63,146,60,75,63,225,149,76,63,234,235,77,63,121,62,79,63,143,141,80,63,43,217,81,63,29,33,83,63,115,101,84,63,13,166,85,63,235,226,86,63,252,27,88,63,47,81,89,63,115,130,90,63,201,175,91,63,14,217,92,63,67,254,93,63,88,31,95,63,75,60,96,63,252,84,97,63,106,105,98,63,133,121,99,63,60,133,100,63,160,140,101,63,126,143,102,63,214,141,103,63,186,135,104,63,246,124,105,63,156,109,106,63,138,89,107,63,209,64,108,63,79,35,109,63,4,1,110,63,241,217,110,63,243,173,111,63,28,125,112,63,73,71,113,63,124,12,114,63,180,204,114,63,240,135,115,63,16,62,116,63,19,239,116,63,250,154,117,63,179,65,118,63,63,227,118,63,141,127,119,63,173,22,120,63,126,168,120,63,1,53,121,63,52,188,121,63,24,62,122,63,157,186,122,63,194,49,123,63,119,163,123,63,187,15,124,63,159,118,124,63,2,216,124,63,244,51,125,63,101,138,125,63,68,219,125,63,179,38,126,63,143,108,126,63,235,172,126,63,163,231,126,63,218,28,127,63,127,76,127,63,129,118,127,63,2,155,127,63,208,185,127,63,28,211,127,63,197,230,127,63,203,244,127,63,47,253,127,63,0,0,128,63,108,105,98,111,112,117,115,32,49,46,49,45,97,108,112,104,97,45,55,52,45,103,99,52,49,97,56,49,54,0,0,0,117,110,107,110,111,119,110,32,101,114,114,111,114,0,0,0,109,101,109,111,114,121,32,97,108,108,111,99,97,116,105,111,110,32,102,97,105,108,101,100,0,0,0,0,105,110,118,97,108,105,100,32,115,116,97,116,101,0,0,0,114,101,113,117,101,115,116,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,99,111,114,114,117,112,116,101,100,32,115,116,114,101,97,109,0,0,0,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,0,0,98,117,102,102,101,114,32,116,111,111,32,115,109,97,108,108,0,0,0,0,105,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,0,0,0,0,115,117,99,99,101,115,115,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,154,121,102,102,184,126,51,115,0,8,13,16,19,21,23,24,26,27,28,29,30,31,32,32,33,34,34,35,36,36,37,37,1,0,0,0,171,170,170,170,205,204,204,204,183,109,219,182,57,142,227,56,163,139,46,186,197,78,236,196,239,238,238,238,241,240,240,240,27,202,107,40,61,207,243,60,167,55,189,233,41,92,143,194,19,218,75,104,53,194,114,79,223,123,239,189,225,131,15,62,139,175,248,138,173,27,76,145,151,111,249,150,25,156,143,193,131,190,160,47,165,79,250,164,207,70,125,103,209,88,31,26,251,250,250,250,29,82,19,140,135,181,111,88,9,238,35,184,243,216,138,160,21,151,12,193,191,239,251,190,193,15,252,192,107,76,164,7,141,18,63,163,119,169,39,227,249,241,227,199,99,201,47,150,133,56,43,63,175,22,55,97,177,72,25,120,219,67,46,43,253,252,252,252,103,235,208,111,233,71,63,250,211,47,253,210,245,211,79,63,159,91,226,212,161,163,2,95,75,129,90,191,109,177,50,124,87,27,67,211,217,143,253,216,184,126,154,121])
, "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
  var _sqrt=Math.sqrt;
  var _exp=Math.exp;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }
  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      Runtime.stackRestore(ret);
    }
  var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STACK); 
  Module["_llvm_ctlz_i32"] = _llvm_ctlz_i32;
  Module["_memcpy"] = _memcpy; 
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _llvm_va_start=undefined;
  var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _llvm_va_end() {}
  var _log=Math.log;
  var _floor=Math.floor;
  var _atan2=Math.atan2;
  var _cos=Math.cos;
  function _silk_encode_do_VAD_FLP() {
  Module['printErr']('missing function: silk_encode_do_VAD_FLP'); abort(-1);
  }
  function _silk_encode_frame_FLP() {
  Module['printErr']('missing function: silk_encode_frame_FLP'); abort(-1);
  }
  function _rint(x) {
      return (x > 0) ? -Math.round(-x) : Math.round(x);
    }var _lrintf=_rint;
  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }
  var _llvm_pow_f64=Math.pow;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOPNOTSUPP:45,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  var _sqrtf=Math.sqrt;
  var _floorf=Math.floor;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var _llvm_memset_p0i8_i64=_memset;
  Module["_strlen"] = _strlen;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
___setErrNo(0);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_STACK);
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module.dynCall_viiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module.dynCall_vi(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module.dynCall_ii(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_v(index) {
  try {
    Module.dynCall_v(index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module.dynCall_viiiiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module.dynCall_iii(index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.copyTempDouble;var af=env.copyTempFloat;var ag=env.min;var ah=env.invoke_viiiii;var ai=env.invoke_vi;var aj=env.invoke_ii;var ak=env.invoke_v;var al=env.invoke_viiiiii;var am=env.invoke_iii;var an=env._llvm_va_end;var ao=env._llvm_lifetime_end;var ap=env._sysconf;var aq=env._rint;var ar=env._abort;var as=env._sqrtf;var at=env._llvm_stacksave;var au=env._llvm_stackrestore;var av=env._atan2;var aw=env.___setErrNo;var ax=env._sqrt;var ay=env._log10;var az=env._silk_encode_do_VAD_FLP;var aA=env._floorf;var aB=env._log;var aC=env._cos;var aD=env._llvm_pow_f64;var aE=env._sbrk;var aF=env._floor;var aG=env.___errno_location;var aH=env._silk_encode_frame_FLP;var aI=env._exp;var aJ=env._time;var aK=env._llvm_lifetime_start;
// EMSCRIPTEN_START_FUNCS
function aR(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function aS(){return i|0}function aT(a){a=a|0;i=a}function aU(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function aV(a){a=a|0;D=a}function aW(a){a=a|0;E=a}function aX(a){a=a|0;F=a}function aY(a){a=a|0;G=a}function aZ(a){a=a|0;H=a}function a_(a){a=a|0;I=a}function a$(a){a=a|0;J=a}function a0(a){a=a|0;K=a}function a1(a){a=a|0;L=a}function a2(a){a=a|0;M=a}function a3(a,d,e,f,h,i,j,k,l,m){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0.0,K=0.0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;n=c[a+32>>2]|0;o=c[a+44>>2]|0;if(($((b[n+(k<<1)>>1]|0)-(b[n+(k-1<<1)>>1]|0)|0,m)|0)<9){p=0;return p|0}q=a+8|0;a=0;r=0;s=0;t=0;while(1){u=$(a,o);v=0;w=r;x=s;y=t;L6:while(1){z=v;while(1){if((z|0)>=(k|0)){break L6}A=b[n+(z<<1)>>1]|0;B=z+1|0;C=$((b[n+(B<<1)>>1]|0)-A|0,m);if((C|0)<9){z=B}else{break}}D=$(A+u|0,m);E=+(C|0);F=0;G=0;H=0;I=0;while(1){J=+g[d+(D+F<<2)>>2];K=E*J*J;L=(K<.25&1)+I|0;M=(K<.0625&1)+H|0;N=(K<.015625&1)+G|0;O=F+1|0;if((O|0)==(C|0)){break}else{F=O;G=N;H=M;I=L}}if((z|0)>((c[q>>2]|0)-4|0)){P=((L+M<<5|0)/(C|0)&-1)+w|0}else{P=w}v=B;w=P;x=((((M<<1|0)>=(C|0)&1)+((N<<1|0)>=(C|0)&1)|0)+((L<<1|0)>=(C|0)&1)<<8)+x|0;y=y+1|0}v=a+1|0;if((v|0)<(l|0)){a=v;r=w;s=x;t=y}else{break}}do{if((j|0)!=0){if((w|0)==0){Q=0}else{Q=(w|0)/($((k+4|0)-(c[q>>2]|0)|0,l)|0)&-1}t=(c[h>>2]|0)+Q>>1;c[h>>2]=t;s=c[i>>2]|0;if((s|0)==2){R=t+4|0}else if((s|0)==0){R=t-4|0}else{R=t}if((R|0)>22){c[i>>2]=2;break}if((R|0)>18){c[i>>2]=1;break}else{c[i>>2]=0;break}}}while(0);i=(c[e>>2]|0)+((x|0)/(y|0)&-1)>>1;c[e>>2]=i;e=(3-f<<7|66)+(i*3&-1)>>2;if((e|0)<80){p=3;return p|0}if((e|0)<256){p=2;return p|0}p=(e|0)<384&1;return p|0}function a4(a,d,e,f,h,i,j,k){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0;l=c[a+32>>2]|0;m=c[a+44>>2]|0;n=$(m,k);o=l+(h<<1)|0;p=(h|0)<(i|0);q=l+(i<<1)|0;r=a+8|0;a=k<<2;s=0;while(1){t=$(s,n);u=e+(t<<2)|0;v=b[o>>1]|0;w=$(v<<16>>16,k);x=d+(w+t<<2)|0;L46:do{if((w|0)>0){t=u;y=0;while(1){z=t+4|0;g[t>>2]=0.0;A=y+1|0;B=b[o>>1]|0;if((A|0)<($(B<<16>>16,k)|0)){t=z;y=A}else{C=z;D=B;break L46}}}else{C=u;D=v}}while(0);L50:do{if(p){v=C;u=x;w=h;y=D;while(1){E=+g[f+($(c[r>>2]|0,s)+w<<2)>>2];t=$(y<<16>>16,k);B=w+1|0;z=l+(B<<1)|0;A=$(b[z>>1]|0,k);F=t+1|0;G=((A|0)>(F|0)?A:F)-t|0;F=u+(G<<2)|0;H=t;t=u;I=v;while(1){g[I>>2]=E*+g[t>>2];J=H+1|0;if((J|0)<(A|0)){H=J;t=t+4|0;I=I+4|0}else{break}}I=v+(G<<2)|0;if((B|0)==(i|0)){K=I;break L50}v=I;u=F;w=B;y=b[z>>1]|0}}else{K=C}}while(0);x=b[q>>1]|0;if(($(x,k)|0)<(n|0)){dF(K|0,0,$(a,m-x|0)|0)}x=s+1|0;if((x|0)<(j|0)){s=x}else{break}}return}function a5(a,e,f,h,i,j,k,l,m,n,o,p,q){a=a|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0.0,I=0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Z=0,_=0,aa=0,ab=0.0,ac=0,ad=0,ae=0.0;if((k|0)>=(l|0)){return}r=a+32|0;s=a+8|0;a=(i|0)==1;t=(h|0)==3;u=1<<h;v=(u|0)>0;w=k;k=q;while(1){q=w+1|0;x=c[r>>2]|0;y=(b[x+(q<<1)>>1]|0)-(b[x+(w<<1)>>1]|0)|0;x=y<<h;z=+Y(+(+(((c[p+(w<<2)>>2]|0)+1|0)/(x|0)&-1|0)*-.125*.6931471805599453))*.5;A=1.0/+P(+(+(x|0)));B=$(w,i);C=k;D=0;while(1){E=c[s>>2]|0;F=$(E,D)+w|0;G=+g[n+(F<<2)>>2];H=+g[o+(F<<2)>>2];if(a){I=E+w|0;J=+g[n+(I<<2)>>2];K=+g[o+(I<<2)>>2];L=H>K?H:K;M=G>J?G:J}else{L=H;M=G}G=+g[m+(F<<2)>>2]-(M<L?M:L);H=+Y(+((-0.0-(G<0.0?0.0:G))*.6931471805599453))*2.0;if(t){N=H*1.4142135381698608}else{N=H}H=A*(z<N?z:N);F=$(D,j);I=((b[(c[r>>2]|0)+(w<<1)>>1]|0)<<h)+F|0;F=e+(I<<2)|0;L76:do{if(v){E=f+(D+B|0)|0;G=-0.0-H;O=0;Q=C;R=0;while(1){S=((d[E]|0)&1<<O|0)!=0;L80:do{if(S|(y|0)<1){T=S?R:1;U=Q}else{V=O+I|0;W=0;X=Q;while(1){Z=$(X,1664525)+1013904223|0;g[e+(V+(W<<h)<<2)>>2]=(Z&32768|0)==0?G:H;_=W+1|0;if((_|0)==(y|0)){T=1;U=Z;break L80}else{W=_;X=Z}}}}while(0);S=O+1|0;if((S|0)==(u|0)){break}else{O=S;Q=U;R=T}}if((T|0)==0|(x|0)<1){aa=U;break}else{ab=1.0000000036274937e-15;ac=0;ad=F}while(1){G=+g[ad>>2];ae=ab+G*G;R=ac+1|0;if((R|0)==(x|0)){break}else{ab=ae;ac=R;ad=ad+4|0}}G=1.0/+P(+ae);R=0;Q=F;while(1){g[Q>>2]=G*+g[Q>>2];O=R+1|0;if((O|0)==(x|0)){aa=U;break L76}else{R=O;Q=Q+4|0}}}else{aa=C}}while(0);F=D+1|0;if((F|0)<(i|0)){C=aa;D=F}else{break}}if((q|0)==(l|0)){break}else{w=q;k=aa}}return}function a6(e,f,h,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;u=u|0;v=v|0;w=w|0;x=x|0;y=y|0;z=z|0;var A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0.0,bx=0.0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0.0,bW=0.0,bX=0,bY=0,bZ=0,b_=0,b$=0.0,b0=0.0,b1=0.0,b2=0.0,b3=0.0,b4=0,b5=0,b6=0.0,b7=0;A=i;i=i+72|0;B=A|0;C=A+4|0;D=A+8|0;E=A+32|0;F=c[f+32>>2]|0;G=(l|0)!=0;H=G?2:1;I=(e|0)==0;J=(p|0)!=0?1<<x:1;p=F+(h<<1)|0;K=(b[p>>1]|0)<<x;L=(b[F+((c[f+8>>2]|0)-1<<1)>>1]|0)<<x;M=L-K|0;N=$(M,H);O=i;i=i+(N*4&-1)|0;i=i+3>>2<<2;c[E+32>>2]=n;n=E+24|0;c[n>>2]=w;N=E|0;c[N>>2]=e;c[E+12>>2]=s;c[E+4>>2]=f;e=c[z>>2]|0;Q=E+36|0;c[Q>>2]=e;c[E+16>>2]=q;if((h|0)>=(j|0)){R=e;c[z>>2]=R;i=A;return}e=E+8|0;S=j-1|0;T=w+20|0;U=w+28|0;w=E+28|0;V=y-1|0;W=E+20|0;X=f+12|0;f=(1<<J)-1|0;Y=I^1;Z=M-K|0;_=D|0;aa=D+4|0;ab=D+8|0;ac=D+16|0;ad=D+20|0;ae=D+12|0;af=H-1|0;ag=(q|0)!=3|(J|0)>1;q=1;ah=0;ai=k+(L<<2)|0;L=h;aj=v;v=r;while(1){c[e>>2]=L;r=(L|0)==(S|0);ak=F+(L<<1)|0;al=(b[ak>>1]|0)<<x;am=k+(al<<2)|0;if(G){an=l+(al<<2)|0}else{an=0}ao=L+1|0;ap=((b[F+(ao<<1)>>1]|0)<<x)-al|0;al=c[T>>2]|0;aq=c[U>>2]|0;ar=32-(dG(aq|0)|0)|0;as=aq>>>((ar-16|0)>>>0);aq=$(as,as);as=aq>>>31;at=aq>>>15>>>(as>>>0);aq=$(at,at);at=aq>>>31;au=aq>>>15>>>(at>>>0);aq=(al<<3)-($(au,au)>>>31|(at|(as|ar<<1)<<1)<<1)|0;ar=aj-((L|0)==(h|0)?0:aq)|0;as=u-aq|0;at=as-1|0;c[w>>2]=at;do{if((L|0)>(V|0)){av=0}else{au=y-L|0;al=(c[o+(L<<2)>>2]|0)+((ar|0)/(((au|0)>3?3:au)|0)&-1)|0;au=(as|0)<(al|0)?as:al;if((au|0)<0){av=0;break}av=(au|0)>16383?16383:au}}while(0);do{if(I){if((((b[ak>>1]|0)<<x)-ap|0)<((b[p>>1]|0)<<x|0)){aw=ah;break}aw=(q|0)!=0|(ah|0)==0?L:ah}else{aw=ah}}while(0);as=c[t+(L<<2)>>2]|0;c[W>>2]=as;if((L|0)<(c[X>>2]|0)){ax=an;ay=am;az=ai}else{ax=G?O:an;ay=O;az=0}au=r?0:az;L114:do{if((aw|0)==0){aA=f;aB=f;aC=-1}else{if(!(ag|(as|0)<0)){aA=f;aB=f;aC=-1;break}al=(((b[F+(aw<<1)>>1]|0)<<x)-K|0)-ap|0;aD=(al|0)<0?0:al;al=aD+K|0;aE=aw;while(1){aF=aE-1|0;if(((b[F+(aF<<1)>>1]|0)<<x|0)>(al|0)){aE=aF}else{break}}aE=al+ap|0;aG=aw-1|0;while(1){aH=aG+1|0;if(((b[F+(aH<<1)>>1]|0)<<x|0)<(aE|0)){aG=aH}else{aI=aF;aJ=0;aK=0;break}}while(1){aG=$(aI,H);aE=d[m+aG|0]|0|aK;al=d[m+(af+aG|0)|0]|0|aJ;aG=aI+1|0;if((aG|0)<(aH|0)){aI=aG;aJ=al;aK=aE}else{aA=al;aB=aE;aC=aD;break L114}}}}while(0);as=(L|0)!=(s|0)|(v|0)==0;am=as?v:0;L125:do{if(as|Y){if((am|0)==0){aL=98;break}aD=(av|0)/2&-1;aE=(aC|0)!=-1;if(aE){aM=O+(aC<<2)|0}else{aM=0}if(r){aN=0}else{aN=O+(((b[ak>>1]|0)<<x)-K<<2)|0}al=a7(E,ay,ap,aD,J,aM,x,aN,1.0,au,aB)|0;if(aE){aO=O+(aC+M<<2)|0}else{aO=0}if(r){aP=0}else{aP=O+(Z+((b[ak>>1]|0)<<x)<<2)|0}aQ=a7(E,ax,ap,aD,J,aO,x,aP,1.0,au,aA)|0;aR=al;aS=am;break}else{if((((b[ak>>1]|0)<<x)-K|0)>0){aT=0}else{aL=98;break}while(1){al=O+(aT<<2)|0;g[al>>2]=(+g[al>>2]+ +g[O+(aT+M<<2)>>2])*.5;al=aT+1|0;if((al|0)<(((b[ak>>1]|0)<<x)-K|0)){aT=al}else{aL=98;break L125}}}}while(0);L143:do{if((aL|0)==98){aL=0;am=(aC|0)==-1;if((ax|0)==0){if(am){aU=0}else{aU=O+(aC<<2)|0}if(r){aV=0}else{aV=O+(((b[ak>>1]|0)<<x)-K<<2)|0}as=a7(E,ay,ap,av,J,aU,x,aV,1.0,au,aA|aB)|0;aQ=as;aR=as;aS=0;break}if(am){aW=0}else{aW=O+(aC<<2)|0}if(r){aX=0}else{aX=O+(((b[ak>>1]|0)<<x)-K<<2)|0}am=aA|aB;c[B>>2]=av;c[C>>2]=am;as=(c[N>>2]|0)!=0;al=c[n>>2]|0;if((ap|0)==1){aD=al+12|0;aE=al+16|0;aG=al+24|0;aY=al+8|0;aZ=al+4|0;a_=al|0;a$=al+44|0;a0=al+20|0;a1=1;a2=ay;a3=at;while(1){if((a3|0)>7){if(as){a4=+g[a2>>2]<0.0&1;a5=c[aD>>2]|0;a6=c[aE>>2]|0;if((a6+1|0)>>>0>32){a9=7-a6|0;ba=(a9|0)>-8?a9:-8;a9=a6;bb=a5;while(1){bc=c[aY>>2]|0;bd=c[aZ>>2]|0;if((bc+(c[aG>>2]|0)|0)>>>0<bd>>>0){be=bc+1|0;c[aY>>2]=be;a[(c[a_>>2]|0)+(bd-be|0)|0]=bb&255;bf=0}else{bf=-1}c[a$>>2]=c[a$>>2]|bf;bg=bb>>>8;be=a9-8|0;if((be|0)>7){a9=be;bb=bg}else{break}}bh=(a6-8|0)-(ba+a6&-8)|0;bi=bg}else{bh=a6;bi=a5}bj=a4;bk=bh+1|0;bl=a4<<bh|bi}else{bb=c[aD>>2]|0;a9=c[aE>>2]|0;if((a9|0)==0){be=c[aY>>2]|0;bd=c[aZ>>2]|0;if(be>>>0<bd>>>0){bc=be+1|0;c[aY>>2]=bc;bm=d[(c[a_>>2]|0)+(bd-bc|0)|0]|0;bn=bc}else{bm=0;bn=be}if(bn>>>0<bd>>>0){be=bn+1|0;c[aY>>2]=be;bo=(d[(c[a_>>2]|0)+(bd-be|0)|0]|0)<<8;bp=be}else{bo=0;bp=bn}if(bp>>>0<bd>>>0){be=bp+1|0;c[aY>>2]=be;bq=(d[(c[a_>>2]|0)+(bd-be|0)|0]|0)<<16;br=be}else{bq=0;br=bp}if(br>>>0<bd>>>0){be=br+1|0;c[aY>>2]=be;bs=(d[(c[a_>>2]|0)+(bd-be|0)|0]|0)<<24}else{bs=0}bt=bm|bb|bo|bq|bs;bu=32}else{bt=bb;bu=a9}bj=bt&1;bk=bu-1|0;bl=bt>>>1}c[aD>>2]=bl;c[aE>>2]=bk;c[a0>>2]=(c[a0>>2]|0)+1|0;c[w>>2]=(c[w>>2]|0)-8|0;bv=bj}else{bv=0}if(!as){g[a2>>2]=(bv|0)!=0?-1.0:1.0}if((a1|0)>=2){break}a1=a1+1|0;a2=ax;a3=c[w>>2]|0}if((aX|0)==0){aQ=1;aR=1;aS=0;break}g[aX>>2]=+g[ay>>2];aQ=1;aR=1;aS=0;break}a8(E,D,ay,ax,ap,B,J,J,x,1,C);a3=c[_>>2]|0;a2=c[ac>>2]|0;a1=c[ad>>2]|0;bw=+(c[aa>>2]|0)*30517578125.0e-15;bx=+(c[ab>>2]|0)*30517578125.0e-15;a0=(ap|0)==2;aE=c[B>>2]|0;if(a0){if((a2|0)==16384|(a2|0)==0){by=0}else{by=8}aD=aE-by|0;a_=(a2|0)>8192;c[w>>2]=(c[w>>2]|0)-(by+a1|0)|0;aY=a_?ax:ay;aZ=a_?ay:ax;do{if((by|0)==0){bz=0}else{if(as){a_=+g[aY>>2]*+g[aZ+4>>2]- +g[aY+4>>2]*+g[aZ>>2]<0.0&1;a$=al+12|0;aG=c[a$>>2]|0;a9=al+16|0;bb=c[a9>>2]|0;if((bb+1|0)>>>0>32){be=al+24|0;bd=al+8|0;bc=al+4|0;bA=al|0;bB=al+44|0;bC=7-bb|0;bD=(bC|0)>-8?bC:-8;bC=bb;bE=aG;while(1){bF=c[bd>>2]|0;bG=c[bc>>2]|0;if((bF+(c[be>>2]|0)|0)>>>0<bG>>>0){bH=bF+1|0;c[bd>>2]=bH;a[(c[bA>>2]|0)+(bG-bH|0)|0]=bE&255;bI=0}else{bI=-1}c[bB>>2]=c[bB>>2]|bI;bJ=bE>>>8;bH=bC-8|0;if((bH|0)>7){bC=bH;bE=bJ}else{break}}bK=(bb-8|0)-(bD+bb&-8)|0;bL=bJ}else{bK=bb;bL=aG}c[a$>>2]=a_<<bK|bL;c[a9>>2]=bK+1|0;bE=al+20|0;c[bE>>2]=(c[bE>>2]|0)+1|0;bz=a_;break}bE=al+12|0;bC=c[bE>>2]|0;bB=al+16|0;bA=c[bB>>2]|0;if((bA|0)==0){bd=al+8|0;be=al|0;bc=c[bd>>2]|0;a4=c[al+4>>2]|0;if(bc>>>0<a4>>>0){a5=bc+1|0;c[bd>>2]=a5;bM=d[(c[be>>2]|0)+(a4-a5|0)|0]|0;bN=a5}else{bM=0;bN=bc}if(bN>>>0<a4>>>0){bc=bN+1|0;c[bd>>2]=bc;bO=(d[(c[be>>2]|0)+(a4-bc|0)|0]|0)<<8;bP=bc}else{bO=0;bP=bN}if(bP>>>0<a4>>>0){bc=bP+1|0;c[bd>>2]=bc;bQ=(d[(c[be>>2]|0)+(a4-bc|0)|0]|0)<<16;bR=bc}else{bQ=0;bR=bP}if(bR>>>0<a4>>>0){bc=bR+1|0;c[bd>>2]=bc;bS=(d[(c[be>>2]|0)+(a4-bc|0)|0]|0)<<24}else{bS=0}bT=bM|bC|bO|bQ|bS;bU=32}else{bT=bC;bU=bA}c[bE>>2]=bT>>>1;c[bB>>2]=bU-1|0;bB=al+20|0;c[bB>>2]=(c[bB>>2]|0)+1|0;bz=bT&1}}while(0);al=1-(bz<<1)|0;bB=a7(E,aY,2,aD,J,aW,x,aX,1.0,au,am)|0;g[aZ>>2]=+g[aY+4>>2]*+(-al|0);g[aZ+4>>2]=+(al|0)*+g[aY>>2];if(as){aQ=bB;aR=bB;aS=0;break}g[ay>>2]=bw*+g[ay>>2];al=ay+4|0;g[al>>2]=bw*+g[al>>2];bV=bx*+g[ax>>2];g[ax>>2]=bV;bE=ax+4|0;g[bE>>2]=bx*+g[bE>>2];bW=+g[ay>>2];g[ay>>2]=bW-bV;g[ax>>2]=bW+ +g[ax>>2];bW=+g[al>>2];g[al>>2]=bW- +g[bE>>2];g[bE>>2]=bW+ +g[bE>>2];bX=bB}else{bB=(aE-(c[ae>>2]|0)|0)/2&-1;bE=(aE|0)<(bB|0)?aE:bB;bB=(bE|0)<0?0:bE;bE=aE-bB|0;al=(c[w>>2]|0)-a1|0;c[w>>2]=al;bA=c[C>>2]|0;if((bB|0)<(bE|0)){bC=a7(E,ax,ap,bE,J,0,x,0,bx,0,bA>>J)|0;bc=((c[w>>2]|0)-al|0)+bE|0;if((bc|0)<25|(a2|0)==16384){bY=bB}else{bY=(bB-24|0)+bc|0}bZ=a7(E,ay,ap,bY,J,aW,x,aX,1.0,au,bA)|bC}else{bC=a7(E,ay,ap,bB,J,aW,x,aX,1.0,au,bA)|0;bc=((c[w>>2]|0)-al|0)+bB|0;if((bc|0)<25|(a2|0)==0){b_=bE}else{b_=(bE-24|0)+bc|0}bZ=a7(E,ax,ap,b_,J,0,x,0,bx,0,bA>>J)|bC}if(as){aQ=bZ;aR=bZ;aS=0;break}else{bX=bZ}}L250:do{if(!a0){bC=(ap|0)>0;L252:do{if(bC){bW=0.0;bV=0.0;bA=0;while(1){b$=+g[ax+(bA<<2)>>2];b0=bV+ +g[ay+(bA<<2)>>2]*b$;b1=bW+b$*b$;bc=bA+1|0;if((bc|0)==(ap|0)){b2=b1;b3=b0;break L252}else{bW=b1;bV=b0;bA=bc}}}else{b2=0.0;b3=0.0}}while(0);bV=bw*bw+b2;bW=bw*b3*2.0;b0=bV-bW;b1=bV+bW;if(b1<.0006000000284984708|b0<.0006000000284984708){if(bC){b4=0}else{aQ=bX;aR=bX;aS=0;break L143}while(1){g[ax+(b4<<2)>>2]=+g[ay+(b4<<2)>>2];a_=b4+1|0;if((a_|0)==(ap|0)){break L250}else{b4=a_}}}else{bW=1.0/+P(+b0);bV=1.0/+P(+b1);if(bC){b5=0}else{aQ=bX;aR=bX;aS=0;break L143}while(1){a_=ay+(b5<<2)|0;b$=bw*+g[a_>>2];a9=ax+(b5<<2)|0;b6=+g[a9>>2];g[a_>>2]=bW*(b$-b6);g[a9>>2]=bV*(b$+b6);a9=b5+1|0;if((a9|0)==(ap|0)){break L250}else{b5=a9}}}}}while(0);if((a3|0)!=0&(ap|0)>0){b7=0}else{aQ=bX;aR=bX;aS=0;break}while(1){a0=ax+(b7<<2)|0;g[a0>>2]=-0.0- +g[a0>>2];a0=b7+1|0;if((a0|0)==(ap|0)){aQ=bX;aR=bX;aS=0;break L143}else{b7=a0}}}}while(0);at=$(L,H);a[m+at|0]=aR&255;a[m+(af+at|0)|0]=aQ&255;at=(ar+aq|0)+(c[o+(L<<2)>>2]|0)|0;if((ao|0)==(j|0)){break}else{q=(av|0)>(ap<<3|0)&1;ah=aw;ai=au;L=ao;aj=at;v=aS}}R=c[Q>>2]|0;c[z>>2]=R;i=A;return}function a7(b,e,f,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=+m;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0.0,ag=0.0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;p=(c[b>>2]|0)!=0;q=c[b+20>>2]|0;r=(i|0)==1&1;s=(f|0)/(i|0)&-1;if((f|0)==1){t=c[b+24>>2]|0;u=b+28|0;v=t+12|0;w=t+16|0;x=t+24|0;y=t+8|0;z=t+4|0;A=t|0;B=t+44|0;C=t+20|0;if((c[u>>2]|0)>7){if(p){t=+g[e>>2]<0.0&1;D=c[v>>2]|0;E=c[w>>2]|0;if((E+1|0)>>>0>32){F=7-E|0;G=((F|0)>-8?F:-8)+E|0;F=E;H=D;while(1){I=c[y>>2]|0;J=c[z>>2]|0;if((I+(c[x>>2]|0)|0)>>>0<J>>>0){K=I+1|0;c[y>>2]=K;a[(c[A>>2]|0)+(J-K|0)|0]=H&255;L=0}else{L=-1}c[B>>2]=c[B>>2]|L;M=H>>>8;K=F-8|0;if((K|0)>7){F=K;H=M}else{break}}N=(E-8|0)-(G&-8)|0;O=M}else{N=E;O=D}Q=t;R=N+1|0;S=t<<N|O}else{O=c[v>>2]|0;N=c[w>>2]|0;if((N|0)==0){t=c[y>>2]|0;D=c[z>>2]|0;if(t>>>0<D>>>0){z=t+1|0;c[y>>2]=z;T=d[(c[A>>2]|0)+(D-z|0)|0]|0;U=z}else{T=0;U=t}if(U>>>0<D>>>0){t=U+1|0;c[y>>2]=t;V=(d[(c[A>>2]|0)+(D-t|0)|0]|0)<<8;W=t}else{V=0;W=U}if(W>>>0<D>>>0){U=W+1|0;c[y>>2]=U;X=(d[(c[A>>2]|0)+(D-U|0)|0]|0)<<16;Y=U}else{X=0;Y=W}if(Y>>>0<D>>>0){W=Y+1|0;c[y>>2]=W;Z=(d[(c[A>>2]|0)+(D-W|0)|0]|0)<<24}else{Z=0}_=Z|(X|(V|(T|O)));aa=32}else{_=O;aa=N}Q=_&1;R=aa-1|0;S=_>>>1}c[v>>2]=S;c[w>>2]=R;c[C>>2]=(c[C>>2]|0)+1|0;c[u>>2]=(c[u>>2]|0)-8|0;ab=Q}else{ab=0}if(!p){g[e>>2]=(ab|0)!=0?-1.0:1.0}if((l|0)==0){ac=1;return ac|0}g[l>>2]=+g[e>>2];ac=1;return ac|0}ab=(q|0)>0;Q=ab?q:0;L311:do{if((n|0)==0|(j|0)==0){ad=j}else{if((Q|0)==0){if(!((s&1|0)==0&(q|0)<0|(i|0)>1)){ad=j;break}}if((f|0)>0){ae=0}else{ad=n;break}while(1){g[n+(ae<<2)>>2]=+g[j+(ae<<2)>>2];u=ae+1|0;if((u|0)==(f|0)){ad=n;break L311}else{ae=u}}}}while(0);L319:do{if(ab){ae=(ad|0)==0;n=o;j=0;while(1){L323:do{if(p){u=1<<j;C=f>>j>>1;if((u|0)<=0){break}R=(C|0)>0;w=u<<1;S=0;while(1){L328:do{if(R){v=0;while(1){_=e+($(w,v)+S<<2)|0;af=+g[_>>2]*.7071067690849304;aa=e+(((v<<1|1)<<j)+S<<2)|0;ag=+g[aa>>2]*.7071067690849304;g[_>>2]=af+ag;g[aa>>2]=af-ag;aa=v+1|0;if((aa|0)==(C|0)){break L328}else{v=aa}}}}while(0);v=S+1|0;if((v|0)==(u|0)){break L323}else{S=v}}}}while(0);L333:do{if(!ae){S=1<<j;u=f>>j>>1;if((S|0)<=0){break}C=(u|0)>0;w=S<<1;R=0;while(1){L338:do{if(C){v=0;while(1){aa=ad+($(w,v)+R<<2)|0;ag=+g[aa>>2]*.7071067690849304;_=ad+(((v<<1|1)<<j)+R<<2)|0;af=+g[_>>2]*.7071067690849304;g[aa>>2]=ag+af;g[_>>2]=ag-af;_=v+1|0;if((_|0)==(u|0)){break L338}else{v=_}}}}while(0);v=R+1|0;if((v|0)==(S|0)){break L333}else{R=v}}}}while(0);R=(d[5250860+(n>>4)|0]|0)<<2|(d[5250860+(n&15)|0]|0);S=j+1|0;if((S|0)<(Q|0)){n=R;j=S}else{ah=R;break L319}}}else{ah=o}}while(0);o=i>>Q;i=s<<Q;L344:do{if((i&1|0)==0&(q|0)<0){s=(ad|0)!=0;j=i;n=0;ae=ah;R=o;S=q;while(1){L348:do{if(p){u=j>>1;if((R|0)<=0){break}w=(u|0)>0;C=R<<1;v=0;while(1){L353:do{if(w){_=0;while(1){aa=e+($(C,_)+v<<2)|0;af=+g[aa>>2]*.7071067690849304;N=e+($(_<<1|1,R)+v<<2)|0;ag=+g[N>>2]*.7071067690849304;g[aa>>2]=af+ag;g[N>>2]=af-ag;N=_+1|0;if((N|0)==(u|0)){break L353}else{_=N}}}}while(0);_=v+1|0;if((_|0)==(R|0)){break L348}else{v=_}}}}while(0);v=j>>1;L358:do{if(s&(R|0)>0){u=(v|0)>0;C=R<<1;w=0;while(1){L362:do{if(u){_=0;while(1){N=ad+($(C,_)+w<<2)|0;ag=+g[N>>2]*.7071067690849304;aa=ad+($(_<<1|1,R)+w<<2)|0;af=+g[aa>>2]*.7071067690849304;g[N>>2]=ag+af;g[aa>>2]=ag-af;aa=_+1|0;if((aa|0)==(v|0)){break L362}else{_=aa}}}}while(0);_=w+1|0;if((_|0)==(R|0)){break L358}else{w=_}}}}while(0);w=ae<<R|ae;C=R<<1;u=n+1|0;_=S+1|0;if((v&1|0)==0&(_|0)<0){j=v;n=u;ae=w;R=C;S=_}else{ai=v;aj=u;ak=w;al=C;break L344}}}else{ai=i;aj=0;ak=ah;al=o}}while(0);o=(al|0)>1;do{if(o){if(p){bc(e,ai>>Q,al<<Q,r)}if((ad|0)==0){break}bc(ad,ai>>Q,al<<Q,r)}}while(0);ah=bd(b,e,f,h,al,ad,k,m,ak)|0;if(p){ac=ah;return ac|0}if(o){be(e,ai>>Q,al<<Q,r)}L381:do{if((aj|0)>0){r=ai;o=ah;p=0;ak=al;while(1){k=ak>>1;ad=r<<1;h=o>>>(k>>>0)|o;b=ad>>1;L384:do{if((k|0)>0){i=(ad|0)>0;q=k<<1;S=0;while(1){L388:do{if(i){R=0;while(1){ae=e+($(q,R)+S<<2)|0;m=+g[ae>>2]*.7071067690849304;n=e+($(R<<1|1,k)+S<<2)|0;af=+g[n>>2]*.7071067690849304;g[ae>>2]=m+af;g[n>>2]=m-af;n=R+1|0;if((n|0)==(b|0)){break L388}else{R=n}}}}while(0);R=S+1|0;if((R|0)==(k|0)){break L384}else{S=R}}}}while(0);b=p+1|0;if((b|0)==(aj|0)){am=h;an=k;break L381}else{r=ad;o=h;p=b;ak=k}}}else{am=ah;an=al}}while(0);L394:do{if(ab){al=am;ah=0;while(1){aj=d[al+5250876|0]|0;ai=1<<ah;ak=f>>ah>>1;L397:do{if((ai|0)>0){p=(ak|0)>0;o=ai<<1;r=0;while(1){L401:do{if(p){b=0;while(1){v=e+($(o,b)+r<<2)|0;af=+g[v>>2]*.7071067690849304;S=e+(((b<<1|1)<<ah)+r<<2)|0;m=+g[S>>2]*.7071067690849304;g[v>>2]=af+m;g[S>>2]=af-m;S=b+1|0;if((S|0)==(ak|0)){break L401}else{b=S}}}}while(0);b=r+1|0;if((b|0)==(ai|0)){break L397}else{r=b}}}}while(0);ai=ah+1|0;if((ai|0)<(Q|0)){al=aj;ah=ai}else{ao=aj;break L394}}}else{ao=am}}while(0);am=an<<Q;L407:do{if((l|0)!=0){m=+P(+(+(f|0)));if((f|0)>0){ap=0}else{break}while(1){g[l+(ap<<2)>>2]=m*+g[e+(ap<<2)>>2];Q=ap+1|0;if((Q|0)==(f|0)){break L407}else{ap=Q}}}}while(0);ac=ao&(1<<am)-1;return ac|0}function a8(a,e,f,h,i,j,k,l,m,n,o){a=a|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,D=0.0,E=0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0,O=0.0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0;p=c[a>>2]|0;q=c[a+4>>2]|0;r=c[a+8>>2]|0;s=c[a+12>>2]|0;t=c[a+24>>2]|0;u=c[a+32>>2]|0;v=(b[(c[q+56>>2]|0)+(r<<1)>>1]|0)+(m<<3)|0;m=(n|0)!=0;if(m){w=(i|0)==2?16:4}else{w=4}x=c[j>>2]|0;y=(m&(i|0)==2?-2:-1)+(i<<1)|0;z=(x-v|0)-32|0;A=($((v>>1)-w|0,y)+x|0)/(y|0)&-1;y=(z|0)<(A|0)?z:A;A=(y|0)>64?64:y;if((A|0)<4){B=1}else{B=((b[5260208+((A&7)<<1)>>1]|0)>>14-(A>>3))+1&-2}A=m^1;y=(r|0)<(s|0)|A?B:1;B=(p|0)!=0;if(B){p=(i|0)>0;L422:do{if((n|0)==0){if(p){C=1.0000000036274937e-15;D=1.0000000036274937e-15;E=0}else{F=1.0000000036274937e-15;G=1.0000000036274937e-15;break}while(1){H=+g[f+(E<<2)>>2];I=+g[h+(E<<2)>>2];J=D+H*H;H=C+I*I;s=E+1|0;if((s|0)==(i|0)){F=J;G=H;break L422}else{C=H;D=J;E=s}}}else{if(p){K=1.0000000036274937e-15;L=1.0000000036274937e-15;M=0}else{F=1.0000000036274937e-15;G=1.0000000036274937e-15;break}while(1){J=+g[f+(M<<2)>>2];H=+g[h+(M<<2)>>2];I=J+H;O=J-H;H=L+I*I;I=K+O*O;s=M+1|0;if((s|0)==(i|0)){F=H;G=I;break L422}else{K=I;L=H;M=s}}}}while(0);L=+P(+F);Q=~~+N(+(+X(+(+P(+G)),+L)*10430.3818359375+.5))}else{Q=0}M=t+20|0;p=c[M>>2]|0;E=t+28|0;n=c[E>>2]|0;s=32-(dG(n|0)|0)|0;z=n>>>((s-16|0)>>>0);x=$(z,z);z=x>>>31;w=x>>>15>>>(z>>>0);x=$(w,w);w=x>>>31;v=x>>>15>>>(w>>>0);x=$(v,v)>>>31|(w|(z|s<<1)<<1)<<1;s=p<<3;L431:do{if((y|0)==1){if(!m){R=Q;S=0;break}L514:do{if(B){z=(Q|0)>8192;w=z&1;L516:do{if(z&(i|0)>0){v=0;while(1){T=h+(v<<2)|0;g[T>>2]=-0.0- +g[T>>2];T=v+1|0;if((T|0)==(i|0)){break L516}else{v=T}}}}while(0);L=+g[u+(r<<2)>>2];G=+g[u+((c[q+8>>2]|0)+r<<2)>>2];F=+P(+(L*L+1.0000000036274937e-15+G*G))+1.0000000036274937e-15;K=L/F;L=G/F;if((i|0)>0){U=0}else{V=w;break}while(1){z=f+(U<<2)|0;g[z>>2]=K*+g[z>>2]+L*+g[h+(U<<2)>>2];z=U+1|0;if((z|0)==(i|0)){V=w;break L514}else{U=z}}}else{V=0}}while(0);if((c[j>>2]|0)<=16){R=0;S=0;break}if((c[a+28>>2]|0)<=16){R=0;S=0;break}if(B){bv(t,V,2);R=0;S=V;break}w=c[E>>2]|0;z=t+32|0;v=c[z>>2]|0;T=w>>>2;W=v>>>0<T>>>0;Y=W&1;if(W){Z=T;_=v}else{W=v-T|0;c[z>>2]=W;Z=w-T|0;_=W}c[E>>2]=Z;if(Z>>>0>=8388609){R=0;S=Y;break}W=t+40|0;T=t+24|0;w=t|0;v=c[t+4>>2]|0;aa=c[M>>2]|0;ab=Z;ac=c[W>>2]|0;ad=c[T>>2]|0;ae=_;while(1){af=aa+8|0;c[M>>2]=af;ag=ab<<8;c[E>>2]=ag;if(ad>>>0<v>>>0){ah=ad+1|0;c[T>>2]=ah;ai=d[(c[w>>2]|0)+ad|0]|0;aj=ah}else{ai=0;aj=ad}c[W>>2]=ai;ah=((ai|ac<<8)>>>1&255|ae<<8&2147483392)^255;c[z>>2]=ah;if(ag>>>0<8388609){aa=af;ab=ag;ac=ai;ad=aj;ae=ah}else{R=0;S=Y;break L431}}}else{if(B){ak=$(Q,y)+8192>>14}else{ak=Q}L436:do{if(m&(i|0)>2){Y=(y|0)/2&-1;ae=Y+1|0;ad=ae*3&-1;ac=ad+Y|0;if(B){if((ak|0)>(Y|0)){al=(ak-Y|0)+ad|0;am=((ak-1|0)-Y|0)+ad|0}else{ab=ak*3&-1;al=ab+3|0;am=ab}br(t,am,al,ac);an=ak;break}ab=(n>>>0)/(ac>>>0)>>>0;c[t+36>>2]=ab;aa=t+32|0;z=c[aa>>2]|0;W=(z>>>0)/(ab>>>0)>>>0;w=W+1|0;T=(ac+(W^-1)|0)-(ac-w&-(w>>>0>ac>>>0&1))|0;if((T|0)<(ad|0)){ao=(T|0)/3&-1}else{ao=(ae-ad|0)+T|0}if((ao|0)>(Y|0)){ap=(ad-Y|0)+ao|0;aq=(ad+(Y^-1)|0)+ao|0}else{Y=ao*3&-1;ap=Y+3|0;aq=Y}Y=$(ab,ac-ap|0);ac=z-Y|0;c[aa>>2]=ac;if((aq|0)==0){ar=n-Y|0}else{ar=$(ab,ap-aq|0)}c[E>>2]=ar;if(ar>>>0>=8388609){an=ao;break}ab=t+40|0;Y=t+24|0;z=t|0;ad=c[t+4>>2]|0;T=p;ae=ar;w=c[ab>>2]|0;W=c[Y>>2]|0;v=ac;while(1){ac=T+8|0;c[M>>2]=ac;ah=ae<<8;c[E>>2]=ah;if(W>>>0<ad>>>0){ag=W+1|0;c[Y>>2]=ag;as=d[(c[z>>2]|0)+W|0]|0;at=ag}else{as=0;at=W}c[ab>>2]=as;ag=((as|w<<8)>>>1&255|v<<8&2147483392)^255;c[aa>>2]=ag;if(ah>>>0<8388609){T=ac;ae=ah;w=as;W=at;v=ag}else{an=ao;break L436}}}else{if((l|0)>1|m){v=y+1|0;if(B){bx(t,ak,v);an=ak;break}else{R=(bt(t,v)<<14|0)/(y|0)&-1;S=0;break L431}}v=y>>1;W=v+1|0;w=$(W,W);if(B){if((ak|0)>(v|0)){ae=(y+1|0)-ak|0;au=w-($(ae,(y+2|0)-ak|0)>>1)|0;av=ae}else{ae=ak+1|0;au=$(ae,ak)>>1;av=ae}br(t,au,au+av|0,w);an=ak;break}ae=(n>>>0)/(w>>>0)>>>0;c[t+36>>2]=ae;T=t+32|0;aa=c[T>>2]|0;ab=(aa>>>0)/(ae>>>0)>>>0;z=ab+1|0;Y=(w+(ab^-1)|0)-(w-z&-(z>>>0>w>>>0&1))|0;if((Y|0)<($(W,v)>>1|0)){v=Y<<3|1;W=(dG(v|0)|0)>>>1^15;z=v;v=W;ab=0;ad=1<<W;while(1){W=(ab<<1)+ad<<v;if(W>>>0>z>>>0){aw=z;ax=ab}else{aw=z-W|0;ax=ab+ad|0}if((v|0)>0){z=aw;v=v-1|0;ab=ax;ad=ad>>>1}else{break}}ad=(ax-1|0)>>>1;ab=ad+1|0;ay=$(ab,ad)>>>1;az=ad;aA=ab}else{ab=y+1|0;ad=(w-Y<<3)-7|0;v=(dG(ad|0)|0)>>>1^15;z=ad;ad=v;W=0;ag=1<<v;while(1){v=(W<<1)+ag<<ad;if(v>>>0>z>>>0){aB=z;aC=W}else{aB=z-v|0;aC=W+ag|0}if((ad|0)>0){z=aB;ad=ad-1|0;W=aC;ag=ag>>>1}else{break}}ag=((ab<<1)-aC|0)>>>1;W=ab-ag|0;ay=w-($(W,(y+2|0)-ag|0)>>1)|0;az=ag;aA=W}W=$(ae,(w-aA|0)-ay|0);ag=aa-W|0;c[T>>2]=ag;if((ay|0)==0){aD=n-W|0}else{aD=$(ae,aA)}c[E>>2]=aD;if(aD>>>0>=8388609){an=az;break}W=t+40|0;ad=t+24|0;z=t|0;Y=c[t+4>>2]|0;v=p;ah=aD;ac=c[W>>2]|0;af=c[ad>>2]|0;aE=ag;while(1){ag=v+8|0;c[M>>2]=ag;aF=ah<<8;c[E>>2]=aF;if(af>>>0<Y>>>0){aG=af+1|0;c[ad>>2]=aG;aH=d[(c[z>>2]|0)+af|0]|0;aI=aG}else{aH=0;aI=af}c[W>>2]=aH;aG=((aH|ac<<8)>>>1&255|aE<<8&2147483392)^255;c[T>>2]=aG;if(aF>>>0<8388609){v=ag;ah=aF;ac=aH;af=aI;aE=aG}else{an=az;break L436}}}}while(0);aE=(an<<14|0)/(y|0)&-1;if(B^1|A){R=aE;S=0;break}if((aE|0)==0){L=+g[u+(r<<2)>>2];K=+g[u+((c[q+8>>2]|0)+r<<2)>>2];F=+P(+(L*L+1.0000000036274937e-15+K*K))+1.0000000036274937e-15;G=L/F;L=K/F;if((i|0)>0){aJ=0}else{R=0;S=0;break}while(1){af=f+(aJ<<2)|0;g[af>>2]=G*+g[af>>2]+L*+g[h+(aJ<<2)>>2];af=aJ+1|0;if((af|0)==(i|0)){R=0;S=0;break L431}else{aJ=af}}}else{if((i|0)>0){aK=0}else{R=aE;S=0;break}while(1){af=f+(aK<<2)|0;L=+g[af>>2]*.7071067690849304;ac=h+(aK<<2)|0;G=+g[ac>>2]*.7071067690849304;g[af>>2]=L+G;g[ac>>2]=G-L;ac=aK+1|0;if((ac|0)==(i|0)){R=aE;S=0;break L431}else{aK=ac}}}}}while(0);aK=c[M>>2]|0;M=c[E>>2]|0;E=32-(dG(M|0)|0)|0;h=M>>>((E-16|0)>>>0);M=$(h,h);h=M>>>31;f=M>>>15>>>(h>>>0);M=$(f,f);f=M>>>31;aJ=M>>>15>>>(f>>>0);M=((aK<<3)-($(aJ,aJ)>>>31|(f|(h|E<<1)<<1)<<1)|0)+(x-s|0)|0;c[j>>2]=(c[j>>2]|0)-M|0;if((R|0)==0){c[o>>2]=c[o>>2]&(1<<k)-1;j=-16384;s=32767;x=0;E=e|0;c[E>>2]=S;h=e+4|0;c[h>>2]=s;f=e+8|0;c[f>>2]=x;aJ=e+12|0;c[aJ>>2]=j;aK=e+16|0;c[aK>>2]=R;r=e+20|0;c[r>>2]=M;return}else if((R|0)==16384){c[o>>2]=c[o>>2]&(1<<k)-1<<k;j=16384;s=0;x=32767;E=e|0;c[E>>2]=S;h=e+4|0;c[h>>2]=s;f=e+8|0;c[f>>2]=x;aJ=e+12|0;c[aJ>>2]=j;aK=e+16|0;c[aK>>2]=R;r=e+20|0;c[r>>2]=M;return}else{k=R<<16>>16;o=($(k,k)+4096|0)>>>13<<16>>16;k=(32768-o|0)+(($((($((((o*-626&-1)+16384|0)>>>15<<16)+542441472>>16,o)+16384|0)>>>15<<16)-501415936>>16,o)+16384|0)>>>15)<<16>>16;o=16384-R<<16>>16;q=($(o,o)+4096|0)>>>13<<16>>16;o=(32768-q|0)+(($((($((((q*-626&-1)+16384|0)>>>15<<16)+542441472>>16,q)+16384|0)>>>15<<16)-501415936>>16,q)+16384|0)>>>15)<<16>>16;q=32-(dG(k|0)|0)|0;u=32-(dG(o|0)|0)|0;A=o<<15-u<<16>>16;B=($((((A*-2597&-1)+16384|0)>>>15<<16)+519831552>>16,A)+16384|0)>>>15;A=k<<15-q<<16>>16;j=$(((u-q<<11)-(($((((A*-2597&-1)+16384|0)>>>15<<16)+519831552>>16,A)+16384|0)>>>15)|0)+B<<16>>16,(i<<23)-8388608>>16)+16384>>15;s=k;x=o;E=e|0;c[E>>2]=S;h=e+4|0;c[h>>2]=s;f=e+8|0;c[f>>2]=x;aJ=e+12|0;c[aJ>>2]=j;aK=e+16|0;c[aK>>2]=R;r=e+20|0;c[r>>2]=M;return}}function a9(){return 5262408}function ba(a){a=a|0;var b=0;if((a+7|0)>>>0>7){b=5262440;return b|0}b=c[5251028+(-a<<2)>>2]|0;return b|0}function bb(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,h=0,j=0.0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0.0,s=0.0,t=0.0;f=i;i=i+104|0;h=f|0;j=+g[b>>2];L552:do{if((e|0)==1){g[h>>2]=j;if((d|0)>1){k=1;l=j}else{break}while(1){m=l+-1.0;n=+g[b+(k<<2)>>2];o=m>n?m:n;g[h+(k<<2)>>2]=o;p=k+1|0;if((p|0)==(d|0)){break L552}else{k=p;l=o}}}else{o=+g[b+(c<<2)>>2];n=j>o?j:o;g[h>>2]=n;if((d|0)>1){q=1;r=n}else{break}while(1){n=r+-1.0;o=+g[b+(q<<2)>>2];m=+g[b+(q+c<<2)>>2];s=o>m?o:m;m=n>s?n:s;g[h+(q<<2)>>2]=m;p=q+1|0;if((p|0)==(d|0)){break L552}else{q=p;r=m}}}}while(0);q=d-2|0;L560:do{if((q|0)>-1){c=q;while(1){b=h+(c<<2)|0;r=+g[b>>2];j=+g[h+(c+1<<2)>>2]+-1.0;g[b>>2]=r>j?r:j;if((c|0)>0){c=c-1|0}else{break L560}}}}while(0);q=d-1|0;c=(q|0)>2;b=0;j=0.0;while(1){L566:do{if(c){r=j;k=2;while(1){l=+g[a+(k<<2)>>2];m=+g[h+(k<<2)>>2];s=(l<0.0?0.0:l)-(m<0.0?0.0:m);m=r+(s<0.0?0.0:s);p=k+1|0;if((p|0)==(q|0)){t=m;break L566}else{r=m;k=p}}}else{t=j}}while(0);k=b+1|0;if((k|0)<(e|0)){b=k;j=t}else{break}}b=t/+($(d-3|0,e)|0)>1.0&1;i=f;return b|0}function bc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;h=a;j=$(d,b);k=i;i=i+(j*4&-1)|0;i=i+3>>2<<2;l=k;L572:do{if((e|0)==0){if((d|0)>0&(b|0)>0){m=0}else{break}while(1){n=$(m,b);o=0;while(1){g[k+(o+n<<2)>>2]=+g[a+($(o,d)+m<<2)>>2];p=o+1|0;if((p|0)==(b|0)){break}else{o=p}}o=m+1|0;if((o|0)==(d|0)){break L572}else{m=o}}}else{o=d-2|0;if((d|0)<=0){break}n=(b|0)>0;p=0;while(1){L583:do{if(n){q=$(c[5250908+(o+p<<2)>>2]|0,b);r=0;while(1){g[k+(q+r<<2)>>2]=+g[a+($(r,d)+p<<2)>>2];s=r+1|0;if((s|0)==(b|0)){break L583}else{r=s}}}}while(0);r=p+1|0;if((r|0)==(d|0)){break L572}else{p=r}}}}while(0);if((j|0)<=0){i=f;return}dH(h|0,l|0,j<<2);i=f;return}function bd(e,f,h,j,k,l,m,n,o){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=+n;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0.0,N=0.0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0.0,ah=0,ai=0,aj=0.0;p=i;q=f;r=i;i=i+4|0;s=i;i=i+4|0;t=i;i=i+24|0;c[r>>2]=j;c[s>>2]=o;u=(c[e>>2]|0)!=0;v=c[e+4>>2]|0;w=c[e+8>>2]|0;x=c[e+16>>2]|0;y=c[e+24>>2]|0;z=v+100|0;A=c[z>>2]|0;B=m+1|0;C=v+8|0;D=$(c[C>>2]|0,B)+w|0;E=v+96|0;v=b[(c[E>>2]|0)+(D<<1)>>1]|0;D=a[A+v|0]|0;do{if((m|0)!=-1){if(!(((d[A+((D&255)+v|0)|0]|0)+12|0)<(j|0)&(h|0)>2)){break}F=h>>1;G=f+(F<<2)|0;H=m-1|0;if((k|0)==1){c[s>>2]=o&1|o<<1}I=k+1>>1;a8(e,t,f,G,F,r,I,k,H,0,s);J=c[t+12>>2]|0;K=c[t+16>>2]|0;L=c[t+20>>2]|0;M=+(c[t+4>>2]|0)*30517578125.0e-15;N=+(c[t+8>>2]|0)*30517578125.0e-15;do{if((k|0)>1){if((K&16383|0)==0){O=J;break}if((K|0)>8192){O=J-(J>>5-m)|0;break}else{Q=J+(F<<3>>6-m)|0;O=(Q|0)>0?0:Q;break}}else{O=J}}while(0);J=c[r>>2]|0;Q=(J-O|0)/2&-1;R=(J|0)<(Q|0)?J:Q;Q=(R|0)<0?0:R;R=J-Q|0;J=e+28|0;S=(c[J>>2]|0)-L|0;c[J>>2]=S;if((l|0)==0){T=0}else{T=l+(F<<2)|0}if((Q|0)<(R|0)){U=c[s>>2]|0;V=bd(e,G,F,R,I,T,H,N*n,U>>I)<<(k>>1);W=((c[J>>2]|0)-S|0)+R|0;if((W|0)<25|(K|0)==16384){X=Q}else{X=(Q-24|0)+W|0}Y=bd(e,f,F,X,I,l,H,M*n,U)|V;i=p;return Y|0}else{V=c[s>>2]|0;U=bd(e,f,F,Q,I,l,H,M*n,V)|0;W=((c[J>>2]|0)-S|0)+Q|0;if((W|0)<25|(K|0)==0){Z=R}else{Z=(R-24|0)+W|0}Y=bd(e,G,F,Z,I,T,H,N*n,V>>I)<<(k>>1)|U;i=p;return Y|0}}}while(0);T=D&255;D=j-1|0;j=(T+1|0)>>>1;Z=(d[A+(j+v|0)|0]|0|0)<(D|0);X=Z?j:0;O=Z?T:j;j=(X+1|0)+O>>1;T=(d[A+(j+v|0)|0]|0|0)<(D|0);Z=T?j:X;X=T?O:j;j=(Z+1|0)+X>>1;O=(d[A+(j+v|0)|0]|0|0)<(D|0);T=O?j:Z;Z=O?X:j;j=(T+1|0)+Z>>1;X=(d[A+(j+v|0)|0]|0|0)<(D|0);O=X?j:T;T=X?Z:j;j=(O+1|0)+T>>1;Z=(d[A+(j+v|0)|0]|0|0)<(D|0);X=Z?j:O;O=Z?T:j;j=(X+1|0)+O>>1;T=(d[A+(j+v|0)|0]|0|0)<(D|0);Z=T?j:X;X=T?O:j;if((Z|0)==0){_=-1}else{_=d[A+(Z+v|0)|0]|0}j=(D-_|0)>((d[A+(X+v|0)|0]|0)-D|0)?X:Z;if((j|0)==0){aa=0}else{aa=(d[A+(v+j|0)|0]|0)+1|0}v=e+28|0;A=(c[v>>2]|0)-aa|0;c[v>>2]=A;L628:do{if((A|0)<0&(j|0)>0){Z=A;X=aa;D=j;while(1){ab=X+Z|0;c[v>>2]=ab;_=D-1|0;if((_|0)==0){break}O=$(c[C>>2]|0,B);T=(d[(c[z>>2]|0)+((b[(c[E>>2]|0)+(O+w<<1)>>1]|0)+_|0)|0]|0)+1|0;O=ab-T|0;c[v>>2]=O;if((O|0)<0&(_|0)>0){Z=O;X=T;D=_}else{ac=_;ad=430;break L628}}c[v>>2]=ab;break}else{if((j|0)==0){break}else{ac=j;ad=430;break}}}while(0);if((ad|0)==430){if((ac|0)<8){ae=ac}else{ae=(ac&7|8)<<(ac>>3)-1}if(u){Y=bR(f,h,ae,x,k,y)|0;i=p;return Y|0}else{Y=bT(f,h,ae,x,k,y,n)|0;i=p;return Y|0}}if(u){Y=0;i=p;return Y|0}u=(1<<k)-1|0;k=u&o;c[s>>2]=k;if((k|0)==0){if((h|0)<=0){Y=0;i=p;return Y|0}dF(q|0,0,h<<2|0);Y=0;i=p;return Y|0}q=(h|0)>0;L655:do{if((l|0)==0){if(!q){Y=u;i=p;return Y|0}s=e+36|0;o=0;while(1){y=$(c[s>>2]|0,1664525)+1013904223|0;c[s>>2]=y;g[f+(o<<2)>>2]=+(y>>20|0);y=o+1|0;if((y|0)==(h|0)){af=u;break L655}else{o=y}}}else{if(!q){Y=k;i=p;return Y|0}o=e+36|0;s=0;while(1){y=$(c[o>>2]|0,1664525)+1013904223|0;c[o>>2]=y;g[f+(s<<2)>>2]=+g[l+(s<<2)>>2]+((y&32768|0)==0?-.00390625:.00390625);y=s+1|0;if((y|0)==(h|0)){af=k;break L655}else{s=y}}}}while(0);if((h|0)>0){ag=1.0000000036274937e-15;ah=0;ai=f}else{Y=af;i=p;return Y|0}while(1){N=+g[ai>>2];aj=ag+N*N;k=ah+1|0;if((k|0)==(h|0)){break}else{ag=aj;ah=k;ai=ai+4|0}}ag=1.0/+P(+aj)*n;ai=0;ah=f;while(1){g[ah>>2]=ag*+g[ah>>2];f=ai+1|0;if((f|0)==(h|0)){Y=af;break}else{ai=f;ah=ah+4|0}}i=p;return Y|0}function be(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0;f=i;h=a;j=$(d,b);k=i;i=i+(j*4&-1)|0;i=i+3>>2<<2;l=k;L678:do{if((e|0)==0){if((d|0)<=0){break}m=(b|0)>0;n=0;while(1){L683:do{if(m){o=$(n,b);p=0;while(1){q=+g[a+(p+o<<2)>>2];g[k+($(p,d)+n<<2)>>2]=q;r=p+1|0;if((r|0)==(b|0)){break L683}else{p=r}}}}while(0);p=n+1|0;if((p|0)==(d|0)){break L678}else{n=p}}}else{n=d-2|0;if((d|0)<=0){break}m=(b|0)>0;p=0;while(1){L692:do{if(m){o=$(c[5250908+(n+p<<2)>>2]|0,b);r=0;while(1){q=+g[a+(o+r<<2)>>2];g[k+($(r,d)+p<<2)>>2]=q;s=r+1|0;if((s|0)==(b|0)){break L692}else{r=s}}}}while(0);r=p+1|0;if((r|0)==(d|0)){break L678}else{p=r}}}}while(0);if((j|0)<=0){i=f;return}dH(h|0,l|0,j<<2);i=f;return}function bf(a,b,c,d,e,f,h,i,j,k,l){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;h=+h;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0;m=h==0.0;if(f==0.0&m){if((b|0)==(a|0)){return}dI(a|0,b|0,e<<2|0);return}n=+g[5260224+(i*12&-1)>>2]*f;o=+g[5260228+(i*12&-1)>>2]*f;p=+g[5260232+(i*12&-1)>>2]*f;f=+g[5260224+(j*12&-1)>>2]*h;q=+g[5260228+(j*12&-1)>>2]*h;r=+g[5260232+(j*12&-1)>>2]*h;h=+g[b+(1-d<<2)>>2];s=+g[b+(-d<<2)>>2];t=+g[b+((d^-1)<<2)>>2];u=+g[b+(-2-d<<2)>>2];L710:do{if((l|0)>0){j=2-d|0;v=h;w=s;x=t;y=u;i=0;while(1){z=+g[b+(j+i<<2)>>2];A=+g[k+(i<<2)>>2];B=A*A;A=1.0-B;C=i-c|0;g[a+(i<<2)>>2]=(y+z)*r*B+((v+x)*q*B+(w*f*B+(+g[b+(i<<2)>>2]+ +g[b+(C<<2)>>2]*n*A+o*A*(+g[b+(C+1<<2)>>2]+ +g[b+(C-1<<2)>>2])+p*A*(+g[b+(C+2<<2)>>2]+ +g[b+(C-2<<2)>>2]))));C=i+1|0;if((C|0)==(l|0)){D=z;E=v;F=w;G=x;H=l;break L710}else{y=x;x=w;w=v;v=z;i=C}}}else{D=h;E=s;F=t;G=u;H=0}}while(0);if(m){if((b|0)==(a|0)){return}dI(a+(l<<2)|0,b+(l<<2)|0,e-l<<2|0);return}if((H|0)>=(e|0)){return}l=2-d|0;u=D;D=E;E=F;F=G;d=H;while(1){G=+g[b+(l+d<<2)>>2];g[a+(d<<2)>>2]=r*(F+G)+(q*(u+E)+(f*D+ +g[b+(d<<2)>>2]));H=d+1|0;if((H|0)==(e|0)){break}else{F=E;E=D;D=u;u=G;d=H}}return}function bg(e,f,h,j,k,l){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0.0,aq=0.0,ar=0.0,as=0.0,av=0.0,aw=0.0,ax=0.0,ay=0.0,az=0.0,aA=0.0,aB=0.0,aC=0.0,aD=0.0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0.0,aQ=0.0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a4=0,a5=0,a7=0,a8=0,a9=0,ba=0,bc=0,bd=0,be=0,bf=0,bg=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0.0,bt=0.0,bu=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0.0,bF=0,bG=0,bH=0,bI=0,bL=0,bM=0,bO=0,bP=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0.0,b7=0.0,b8=0.0,b9=0.0,ca=0.0,cb=0.0,cc=0,cd=0,ce=0,cf=0.0,cg=0.0,ch=0.0,ci=0.0,cj=0.0,ck=0.0,cl=0.0,cm=0.0,cn=0.0,co=0.0,cp=0.0,cq=0.0,cr=0.0,cs=0.0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0.0,cz=0,cA=0.0,cB=0.0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0,cM=0,cN=0,cO=0,cP=0,cQ=0;m=i;i=i+84|0;n=m|0;o=m+48|0;p=m+52|0;q=m+56|0;r=m+60|0;s=m+64|0;t=m+68|0;u=m+72|0;v=m+76|0;w=m+80|0;x=c[e+8>>2]|0;y=c[e+12>>2]|0;c[p>>2]=15;g[q>>2]=0.0;c[r>>2]=0;c[t>>2]=0;z=c[e>>2]|0;A=z+8|0;B=c[A>>2]|0;D=c[z+4>>2]|0;E=z+32|0;F=c[E>>2]|0;g[u>>2]=0.0;if((k|0)<2|(f|0)==0){G=-1;i=m;return G|0}H=e+32|0;I=$(c[H>>2]|0,h);h=z+44|0;J=z+36|0;K=c[J>>2]|0;L=0;while(1){if((L|0)>(K|0)){G=-1;M=815;break}if((c[h>>2]<<L|0)==(I|0)){break}else{L=L+1|0}}if((M|0)==815){i=m;return G|0}K=1<<L;O=c[h>>2]<<L;Q=e+4|0;R=c[Q>>2]|0;S=e+192+($(R,x)<<2)|0;T=R+1024|0;U=$(T,x);V=e+192+(U<<2)|0;W=$(B,x);X=T+B|0;T=$(X,x);Y=$(X+B|0,x);X=(l|0)==0;if(X){_=0;aa=1}else{ab=c[l+20>>2]|0;ac=(dG(c[l+28>>2]|0)|-32)+ab|0;_=ac+4>>3;aa=ac}ac=(k|0)<1275?k:1275;k=ac-_|0;ab=e+48|0;ad=c[e+44>>2]|0;ae=(ad|0)==-1;do{if((c[ab>>2]|0)==0){if(ae){af=ac;ag=ac;ah=0;break}ai=$(ad,I)+((aa|0)>1?aa:0)|0;aj=c[z>>2]|0;ak=((ai+(aj<<2)|0)/(aj<<3|0)&-1)-((c[e+52>>2]|0)!=0&1)|0;aj=(ac|0)<(ak|0)?ac:ak;ak=(aj|0)<2?2:aj;af=ak;ag=ak;ah=0}else{if(ae){af=ac;ag=ac;ah=0;break}ak=c[z>>2]|0;aj=((ak>>4)+$(ad,I)|0)/(ak>>3|0)&-1;af=ac;ag=aj>>6;ah=aj}}while(0);if(X){c[n>>2]=j;c[n+8>>2]=0;c[n+12>>2]=0;c[n+16>>2]=0;c[n+20>>2]=33;c[n+24>>2]=0;c[n+28>>2]=-2147483648;c[n+40>>2]=-1;c[n+32>>2]=0;c[n+36>>2]=0;c[n+4>>2]=af;c[n+44>>2]=0;al=n}else{al=l}l=(ah|0)>0;do{if(l){if((c[e+56>>2]|0)==0){am=af;an=k;ao=R;break}n=(aa|0)==1?2:0;j=(ah<<1)-(c[e+164>>2]|0)>>6;X=(n|0)>(j|0)?n:j;if((X|0)>=(k|0)){am=af;an=k;ao=R;break}j=X+_|0;n=c[al>>2]|0;ac=c[al+8>>2]|0;I=al+4|0;dI(n+(j-ac|0)|0,n+((c[I>>2]|0)-ac|0)|0,ac|0);c[I>>2]=j;am=j;an=X;ao=c[Q>>2]|0}else{am=af;an=k;ao=R}}while(0);R=am<<3;k=e+40|0;af=c[k>>2]|0;X=c[z+12>>2]|0;j=(af|0)>(X|0)?X:af;af=$(ao+O|0,x);ao=at()|0;X=i;i=i+(af*4&-1)|0;i=i+3>>2<<2;af=e+180|0;ap=+g[af>>2];I=$(O-D|0,y);ac=c[H>>2]|0;n=(I|0)/(ac|0)&-1;I=(n|0)>0;L755:do{if(I){ad=0;aq=0.0;ar=0.0;while(1){as=+g[f+(ad<<2)>>2];av=aq>as?aq:as;aw=ar<as?ar:as;ae=ad+1|0;if((ae|0)==(n|0)){ax=av;ay=aw;break L755}else{ad=ae;aq=av;ar=aw}}}else{ax=0.0;ay=0.0}}while(0);ar=-0.0-ay;if(ap>(ax>ar?ax:ar)){az=ap}else{L761:do{if(I){ad=0;ap=0.0;ar=0.0;while(1){ax=+g[f+(ad<<2)>>2];ay=ap>ax?ap:ax;aq=ar<ax?ar:ax;ae=ad+1|0;if((ae|0)==(n|0)){aA=ay;aB=aq;break L761}else{ad=ae;ap=ay;ar=aq}}}else{aA=0.0;aB=0.0}}while(0);ar=-0.0-aB;az=aA>ar?aA:ar}I=($(D,y)|0)/(ac|0)&-1;L766:do{if((I|0)>0){ac=0;ar=0.0;aA=0.0;while(1){aB=+g[f+(ac+n<<2)>>2];ap=ar>aB?ar:aB;aq=aA<aB?aA:aB;D=ac+1|0;if((D|0)==(I|0)){aC=ap;aD=aq;break L766}else{ac=D;ar=ap;aA=aq}}}else{aC=0.0;aD=0.0}}while(0);aA=-0.0-aD;aD=aC>aA?aC:aA;g[af>>2]=aD;af=e+64|0;I=(az>aD?az:aD)<=1.0/+(1<<c[af>>2]|0);do{if((aa|0)==1){bv(al,I&1,15);if(!I){aE=am;aF=an;aG=ag;aH=R;aI=1;aJ=0;break}if(l){n=_+2|0;ac=(am|0)<(n|0)?am:n;n=c[al>>2]|0;D=c[al+8>>2]|0;ad=al+4|0;dI(n+(ac-D|0)|0,n+((c[ad>>2]|0)-D|0)|0,D|0);c[ad>>2]=ac;aK=ac;aL=2;aM=ac;aN=ac<<3}else{aK=am;aL=an;aM=ag;aN=R}ac=aK<<3;ad=al+20|0;D=c[ad>>2]|0;c[ad>>2]=((ac-D|0)-(dG(c[al+28>>2]|0)|-32)|0)+D|0;aE=aK;aF=aL;aG=aM;aH=aN;aI=ac;aJ=1}else{aE=am;aF=an;aG=ag;aH=R;aI=aa;aJ=0}}while(0);aa=z+16|0;R=e+20|0;ag=(O|0)>0;an=O<<2;am=0;while(1){aN=c[Q>>2]|0;aM=$(aN+O|0,am)+aN|0;aN=c[H>>2]|0;aL=e+148+(am<<2)|0;aK=c[R>>2]|0;aD=+g[aa>>2];I=(O|0)/(aN|0)&-1;if((aN|0)!=1&ag){dF(X+(aM<<2)|0,0,an|0)}L782:do{if((I|0)>0){ac=0;while(1){az=+g[f+($(ac,x)+am<<2)>>2]*32768.0;aA=az==az&!(C=0.0,C!=C)?az:0.0;g[X+($(ac,aN)+aM<<2)>>2]=aA;D=ac+1|0;if((D|0)==(I|0)){break}else{ac=D}}if((aK|0)==0){break}else{aO=0}while(1){ac=X+($(aO,aN)+aM<<2)|0;aA=+g[ac>>2];do{if(aA<=65536.0&aA<-65536.0){aP=-65536.0}else{if(aA>65536.0){aP=65536.0;break}aP=aA}}while(0);g[ac>>2]=aP;D=aO+1|0;if((D|0)==(I|0)){break L782}else{aO=D}}}}while(0);aA=+g[aL>>2];L793:do{if(ag){az=aA;I=0;while(1){aN=X+(I+aM<<2)|0;aC=+g[aN>>2];g[aN>>2]=az+aC;ar=-0.0-aD*aC;aN=I+1|0;if((aN|0)==(O|0)){aQ=ar;break L793}else{az=ar;I=aN}}}else{aQ=aA}}while(0);g[aL>>2]=aQ;aM=am+1|0;if((aM|0)<(x|0)){am=aM}else{break}}do{if((aF|0)>(y*12&-1|0)){if((c[e+36>>2]|0)!=0|aJ){aR=0;break}if((c[e+24>>2]|0)!=0){aR=0;break}if((c[e+28>>2]|0)<=4){aR=0;break}if((c[e+112>>2]|0)==0|(L|0)==3){aR=1;break}aR=(c[e+68>>2]|0)==0}else{aR=0}}while(0);am=e+96|0;ag=c[am>>2]|0;aO=bh(e,X,S,x,O,ag,p,q,w,aR&1,aF)|0;do{if(+g[q>>2]>.4000000059604645){M=550}else{if(+g[e+104>>2]>.4000000059604645){M=550;break}else{aS=0;break}}}while(0);do{if((M|0)==550){if((c[e+116>>2]|0)!=0){if(+g[e+120>>2]<=.3){aS=0;break}}aQ=+(c[p>>2]|0);aP=+(c[e+100>>2]|0);aS=(aQ>aP*1.26|aQ<aP*.79)&1}}while(0);aR=(aO|0)==0;do{if(aR){if((c[e+36>>2]|0)!=0){break}if((aI+16|0)>(aH|0)){break}bv(al,0,1)}else{bv(al,1,1);aO=c[p>>2]|0;S=aO+1|0;c[p>>2]=S;f=32-(dG(S|0)|0)|0;an=f-5|0;bx(al,an,6);aa=S-(16<<an)|0;an=f-1|0;f=al+12|0;S=c[f>>2]|0;R=al+16|0;aM=c[R>>2]|0;if((aM+an|0)>>>0>32){I=al+24|0;aN=al+8|0;aK=al+4|0;D=al|0;ad=al+44|0;n=7-aM|0;ae=((n|0)>-8?n:-8)+aM|0;n=aM;aj=S;while(1){ak=c[aN>>2]|0;ai=c[aK>>2]|0;if((ak+(c[I>>2]|0)|0)>>>0<ai>>>0){aT=ak+1|0;c[aN>>2]=aT;a[(c[D>>2]|0)+(ai-aT|0)|0]=aj&255;aU=0}else{aU=-1}c[ad>>2]=c[ad>>2]|aU;aV=aj>>>8;aT=n-8|0;if((aT|0)>7){n=aT;aj=aV}else{break}}aW=(aM-8|0)-(ae&-8)|0;aX=aV}else{aW=aM;aX=S}aj=aa<<aW|aX;n=aW+an|0;c[f>>2]=aj;c[R>>2]=n;ad=al+20|0;D=(c[ad>>2]|0)+an|0;c[ad>>2]=D;c[p>>2]=aO;aN=c[w>>2]|0;if((n+3|0)>>>0>32){I=al+24|0;aK=al+8|0;aL=al+4|0;aT=al|0;ai=al+44|0;ak=7-n|0;aY=((ak|0)>-8?ak:-8)+n|0;ak=n;aZ=aj;while(1){a_=c[aK>>2]|0;a$=c[aL>>2]|0;if((a_+(c[I>>2]|0)|0)>>>0<a$>>>0){a0=a_+1|0;c[aK>>2]=a0;a[(c[aT>>2]|0)+(a$-a0|0)|0]=aZ&255;a1=0}else{a1=-1}c[ai>>2]=c[ai>>2]|a1;a2=aZ>>>8;a0=ak-8|0;if((a0|0)>7){ak=a0;aZ=a2}else{break}}a4=(n-8|0)-(aY&-8)|0;a5=a2;a7=c[ad>>2]|0}else{a4=n;a5=aj;a7=D}c[f>>2]=aN<<a4|a5;c[R>>2]=a4+3|0;c[ad>>2]=a7+3|0;bw(al,ag,5245324,2)}}while(0);a7=e+28|0;if((c[a7>>2]|0)>0){a8=bi(X,(c[Q>>2]|0)+O|0,x,u,t)|0}else{a8=0}Q=(L|0)>0;L840:do{if(Q){a4=c[al+20>>2]|0;if(((a4+3|0)+(dG(c[al+28>>2]|0)|-32)|0)>(aH|0)){M=574;break}a4=(a8|0)==0;a5=a4?0:K;a2=$(O,x);a1=i;i=i+(a2*4&-1)|0;i=i+3>>2<<2;a2=i;i=i+(W*4&-1)|0;i=i+3>>2<<2;w=i;i=i+(W*4&-1)|0;i=i+3>>2<<2;if(a4){a9=0;ba=a1;bc=a2;bd=w;M=576;break}a4=(c[a7>>2]|0)>7;aW=$(B,y);aX=i;i=i+(aW*4&-1)|0;i=i+3>>2<<2;if(!a4){be=w;bf=a2;bg=a1;bm=a5;bn=a8;bo=0;bp=1;bq=aW;br=aX;break}bj(z,0,X,a1,y,x,L,c[H>>2]|0);a4=c[E>>2]|0;aV=c[h>>2]<<L;aU=(j|0)>0;L845:do{if(aU){aI=0;while(1){aZ=$(aI,aV);ak=0;while(1){ai=(b[a4+(ak<<1)>>1]|0)<<L;aT=ak+1|0;aK=(b[a4+(aT<<1)>>1]|0)<<L;L850:do{if((ai|0)<(aK|0)){I=ai;aP=1.0000000272452012e-27;while(1){aQ=+g[a1+(I+aZ<<2)>>2];aA=aP+aQ*aQ;aL=I+1|0;if((aL|0)==(aK|0)){bs=aA;break L850}else{I=aL;aP=aA}}}else{bs=1.0000000272452012e-27}}while(0);aP=+P(+bs);g[a2+($(c[A>>2]|0,aI)+ak<<2)>>2]=aP;if((aT|0)==(j|0)){break}else{ak=aT}}ak=aI+1|0;if((ak|0)<(y|0)){aI=ak}else{break L845}}}}while(0);a4=c[k>>2]|0;aV=(j|0)<(a4|0);ad=0;while(1){L858:do{if(aU){R=$(c[A>>2]|0,ad);aN=0;while(1){f=R+aN|0;aP=+Z(+(+g[a2+(f<<2)>>2]))*1.4426950408889634;g[aX+(f<<2)>>2]=aP- +g[5259564+(aN<<2)>>2];f=aN+1|0;if((f|0)==(j|0)){break L858}else{aN=f}}}}while(0);L863:do{if(aV){aN=$(c[A>>2]|0,ad);R=j;while(1){g[aX+(aN+R<<2)>>2]=-14.0;f=R+1|0;if((f|0)==(a4|0)){break L863}else{R=f}}}}while(0);R=ad+1|0;if((R|0)<(y|0)){ad=R}else{break}}if((aW|0)<=0){be=w;bf=a2;bg=a1;bm=a5;bn=a8;bo=0;bp=0;bq=aW;br=aX;break}aP=+(L|0)*.5;ad=0;while(1){a4=aX+(ad<<2)|0;g[a4>>2]=aP+ +g[a4>>2];a4=ad+1|0;if((a4|0)==(aW|0)){be=w;bf=a2;bg=a1;bm=a5;bn=a8;bo=0;bp=0;bq=aW;br=aX;break L840}else{ad=a4}}}else{M=574}}while(0);do{if((M|0)==574){a8=$(O,x);ad=i;i=i+(a8*4&-1)|0;i=i+3>>2<<2;a8=i;i=i+(W*4&-1)|0;i=i+3>>2<<2;aX=i;i=i+(W*4&-1)|0;i=i+3>>2<<2;a9=1;ba=ad;bc=a8;bd=aX;M=576;break}}while(0);if((M|0)==576){aX=$(B,y);a8=i;i=i+(aX*4&-1)|0;i=i+3>>2<<2;be=bd;bf=bc;bg=ba;bm=0;bn=0;bo=a9;bp=1;bq=aX;br=a8}a8=be;aX=br;bj(z,bm,X,bg,y,x,L,c[H>>2]|0);a9=(x|0)==2&(y|0)==1;if(a9){c[t>>2]=0}ba=c[E>>2]|0;bc=c[h>>2]<<L;bd=(j|0)>0;L880:do{if(bd){ad=0;while(1){aW=$(ad,bc);a5=0;while(1){a1=(b[ba+(a5<<1)>>1]|0)<<L;a2=a5+1|0;w=(b[ba+(a2<<1)>>1]|0)<<L;L885:do{if((a1|0)<(w|0)){a4=a1;bs=1.0000000272452012e-27;while(1){aP=+g[bg+(a4+aW<<2)>>2];aA=bs+aP*aP;aV=a4+1|0;if((aV|0)==(w|0)){bt=aA;break L885}else{a4=aV;bs=aA}}}else{bt=1.0000000272452012e-27}}while(0);bs=+P(+bt);g[bf+($(c[A>>2]|0,ad)+a5<<2)>>2]=bs;if((a2|0)==(j|0)){break}else{a5=a2}}a5=ad+1|0;if((a5|0)<(y|0)){ad=a5}else{break L880}}}}while(0);ba=c[k>>2]|0;bc=(j|0)<(ba|0);ad=0;while(1){L893:do{if(bd){a5=0;while(1){aW=$(c[A>>2]|0,ad)+a5|0;bt=+Z(+(+g[bf+(aW<<2)>>2]))*1.4426950408889634;g[be+(aW<<2)>>2]=bt- +g[5259564+(a5<<2)>>2];aW=a5+1|0;if((aW|0)==(j|0)){break L893}else{a5=aW}}}}while(0);L897:do{if(bc){a5=j;while(1){g[be+($(c[A>>2]|0,ad)+a5<<2)>>2]=-14.0;aW=a5+1|0;if((aW|0)==(ba|0)){break L897}else{a5=aW}}}}while(0);a5=ad+1|0;if((a5|0)<(y|0)){ad=a5}else{break}}if(bp&(bq|0)>0){dH(aX|0,a8|0,bq<<2)}do{if(Q){a8=al+20|0;aX=c[a8>>2]|0;bp=al+28|0;ad=c[bp>>2]|0;do{if(((aX+3|0)+(dG(ad|0)|-32)|0)<=(aH|0)&(bn|0)==0){if((c[a7>>2]|0)<=4){bu=0;bz=bm;bA=aX;bB=ad;break}if((bb(be,V,B,c[k>>2]|0,y)|0)==0){bC=bm;bD=0}else{bj(z,K,X,bg,y,x,L,c[H>>2]|0);ba=c[E>>2]|0;bc=c[h>>2]<<L;L912:do{if(bd){a5=0;while(1){aW=$(a5,bc);w=0;while(1){a1=(b[ba+(w<<1)>>1]|0)<<L;a4=w+1|0;aT=(b[ba+(a4<<1)>>1]|0)<<L;L917:do{if((a1|0)<(aT|0)){aV=a1;bt=1.0000000272452012e-27;while(1){bs=+g[bg+(aV+aW<<2)>>2];aA=bt+bs*bs;aU=aV+1|0;if((aU|0)==(aT|0)){bE=aA;break L917}else{aV=aU;bt=aA}}}else{bE=1.0000000272452012e-27}}while(0);bt=+P(+bE);g[bf+($(c[A>>2]|0,a5)+w<<2)>>2]=bt;if((a4|0)==(j|0)){break}else{w=a4}}w=a5+1|0;if((w|0)<(y|0)){a5=w}else{break L912}}}}while(0);ba=c[k>>2]|0;bc=(j|0)<(ba|0);a5=0;while(1){L925:do{if(bd){a2=0;while(1){w=$(c[A>>2]|0,a5)+a2|0;bt=+Z(+(+g[bf+(w<<2)>>2]))*1.4426950408889634;g[be+(w<<2)>>2]=bt- +g[5259564+(a2<<2)>>2];w=a2+1|0;if((w|0)==(j|0)){break L925}else{a2=w}}}}while(0);L929:do{if(bc){a2=j;while(1){g[be+($(c[A>>2]|0,a5)+a2<<2)>>2]=-14.0;w=a2+1|0;if((w|0)==(ba|0)){break L929}else{a2=w}}}}while(0);a2=a5+1|0;if((a2|0)<(y|0)){a5=a2}else{break}}L934:do{if((bq|0)>0){bt=+(L|0)*.5;a5=0;while(1){ba=br+(a5<<2)|0;g[ba>>2]=bt+ +g[ba>>2];ba=a5+1|0;if((ba|0)==(bq|0)){break L934}else{a5=ba}}}}while(0);g[u>>2]=.20000000298023224;bC=K;bD=1}bu=bD;bz=bC;bA=c[a8>>2]|0;bB=c[bp>>2]|0}else{bu=bn;bz=bm;bA=aX;bB=ad}}while(0);if(((bA+3|0)+(dG(bB|0)|-32)|0)>(aH|0)){bF=bu;bG=bz;break}bv(al,bu,3);bF=bu;bG=bz}else{bF=bn;bG=bm}}while(0);bm=$(O,y);bn=i;i=i+(bm*4&-1)|0;i=i+3>>2<<2;bm=c[E>>2]|0;bz=c[h>>2]<<L;L943:do{if(bd){h=0;while(1){bu=$(c[A>>2]|0,h);bB=$(h,bz);bA=0;bC=b[bm>>1]|0;while(1){bE=1.0/(+g[bf+(bA+bu<<2)>>2]+1.0000000272452012e-27);bD=bC<<16>>16<<L;H=bA+1|0;X=b[bm+(H<<1)>>1]|0;ad=X<<16>>16<<L;L948:do{if((bD|0)<(ad|0)){aX=bD;while(1){bp=aX+bB|0;g[bn+(bp<<2)>>2]=bE*+g[bg+(bp<<2)>>2];bp=aX+1|0;if((bp|0)==(ad|0)){break L948}else{aX=bp}}}}while(0);if((H|0)==(j|0)){break}else{bA=H;bC=X}}bC=h+1|0;if((bC|0)<(y|0)){h=bC}else{break L943}}}}while(0);bg=i;i=i+(B*4&-1)|0;i=i+3>>2<<2;L954:do{if((aG|0)<(y*15&-1|0)){M=649}else{bm=e+36|0;if((c[bm>>2]|0)!=0){M=649;break}if((c[a7>>2]|0)<=1){M=649;break}do{if((aG|0)<40){bH=24}else{if((aG|0)<60){bH=12;break}bH=(aG|0)<100?8:6}}while(0);bz=bk(z,j,bF,bg,bH,bn,O,L,o,+g[u>>2],c[t>>2]|0)|0;bd=c[k>>2]|0;if((j|0)>=(bd|0)){bI=bz;bL=bd;bM=bm;break}h=bg+(j-1<<2)|0;bC=j;while(1){c[bg+(bC<<2)>>2]=c[h>>2]|0;bA=bC+1|0;if((bA|0)<(bd|0)){bC=bA}else{bI=bz;bL=bd;bM=bm;break L954}}}}while(0);if((M|0)==649){c[o>>2]=0;o=c[k>>2]|0;L967:do{if((o|0)>0){t=0;while(1){c[bg+(t<<2)>>2]=bF;bH=t+1|0;if((bH|0)<(o|0)){t=bH}else{break L967}}}}while(0);bI=0;bL=o;bM=e+36|0}o=i;i=i+(bq*4&-1)|0;i=i+3>>2<<2;bJ(z,c[bM>>2]|0,bL,j,be,V,aH,o,al,y,L,aF,c[e+16>>2]|0,e+80|0,(c[a7>>2]|0)>3&1,c[e+60>>2]|0);bL=c[bM>>2]|0;t=c[k>>2]|0;bH=al+4|0;bm=c[bH>>2]<<3;bd=al+20|0;bz=c[bd>>2]|0;bC=al+28|0;h=(dG(c[bC>>2]|0)|-32)+bz|0;bz=(bF|0)!=0;bA=bz?2:4;if(Q){bO=(h+(bA|1)|0)>>>0<=bm>>>0}else{bO=0}Q=bm-(bO&1)|0;bm=(bL|0)<(t|0);L975:do{if(bm){bB=bz?4:5;bu=0;ad=bL;bD=0;aX=bA;bp=h;while(1){a8=bg+(ad<<2)|0;if((aX+bp|0)>>>0>Q>>>0){c[a8>>2]=bu;bP=bp;bR=bD;bS=bu}else{a5=c[a8>>2]|0;bv(al,a5^bu,aX);a8=c[bd>>2]|0;bP=(dG(c[bC>>2]|0)|-32)+a8|0;bR=a5|bD;bS=a5}a5=ad+1|0;if((a5|0)==(t|0)){bT=bR;break L975}else{bu=bS;ad=a5;bD=bR;aX=bB;bp=bP}}}else{bT=0}}while(0);do{if(bO){bP=bF<<2;if((a[(bT+bP|0)+(5245212+(L<<3))|0]|0)==(a[(bT+(bP|2)|0)+(5245212+(L<<3))|0]|0)){bU=0;break}bv(al,bI,1);bU=bI<<1}else{bU=0}}while(0);L988:do{if(bm){bI=bU+(bF<<2)|0;bT=bL;while(1){bO=bg+(bT<<2)|0;c[bO>>2]=a[(bI+(c[bO>>2]|0)|0)+(5245212+(L<<3))|0]|0;bO=bT+1|0;if((bO|0)==(t|0)){break L988}else{bT=bO}}}}while(0);t=c[bd>>2]|0;if(((t+4|0)+(dG(c[bC>>2]|0)|-32)|0)<=(aH|0)){t=c[a7>>2]|0;L995:do{if((bG|0)!=0|(t|0)<3){a7=e+76|0;if((t|0)!=0){bV=a7;M=673;break}c[a7>>2]=0;bW=0;break}else{do{if((aF|0)>=(y*10&-1|0)){if((c[bM>>2]|0)!=0){break}a7=e+76|0;bL=a3(z,bn,e+84|0,c[a7>>2]|0,e+92|0,am,aR&1^1,j,y,K)|0;c[a7>>2]=bL;bW=bL;break L995}}while(0);bV=e+76|0;M=673;break}}while(0);if((M|0)==673){c[bV>>2]=2;bW=2}bw(al,bW,5246200,5)}bW=i;i=i+(B*4&-1)|0;i=i+3>>2<<2;bV=e+56|0;bE=+bl(be,br,B,c[bM>>2]|0,c[k>>2]|0,y,bW,c[af>>2]|0,c[z+56>>2]|0,bF,c[ab>>2]|0,c[bV>>2]|0,F,L,aG,v);ab=i;i=i+(B*4&-1)|0;i=i+3>>2<<2;bF=c[A>>2]|0;L1007:do{if((bF|0)>0){af=(y-1|0)+(L<<1)|0;br=c[E>>2]|0;K=c[z+104>>2]|0;j=0;aR=b[br>>1]|0;while(1){am=j+1|0;aF=b[br+(am<<1)>>1]|0;t=(d[K+($(bF,af)+j|0)|0]|0)+64|0;c[ab+(j<<2)>>2]=$($((aF<<16>>16)-(aR<<16>>16)<<L,y),t)>>2;if((am|0)<(bF|0)){j=am;aR=aF}else{break L1007}}}}while(0);bF=aH<<3;aH=c[bd>>2]|0;aR=c[bC>>2]|0;j=32-(dG(aR|0)|0)|0;af=aR>>>((j-16|0)>>>0);aR=$(af,af);af=aR>>>31;K=aR>>>15>>>(af>>>0);aR=$(K,K);K=aR>>>31;br=aR>>>15>>>(K>>>0);aR=(aH<<3)-($(br,br)>>>31|(K|(af|j<<1)<<1)<<1)|0;j=c[bM>>2]|0;af=c[k>>2]|0;L1012:do{if((j|0)<(af|0)){K=aR;br=0;aH=6;aF=j;while(1){am=aF+1|0;t=$((b[F+(am<<1)>>1]|0)-(b[F+(aF<<1)>>1]|0)|0,y)<<L;bL=t<<3;a7=(t|0)<48?48:t;t=(bL|0)<(a7|0)?bL:a7;a7=bW+(aF<<2)|0;do{if(((aH<<3)+K|0)<(bF-br|0)){bL=c[ab+(aF<<2)>>2]|0;bU=K;bm=br;bT=aH;bI=0;bO=0;while(1){if((bI|0)>=(bL|0)){bX=bU;bY=bm;bZ=bI;b_=bO;break}bP=(bO|0)<(c[a7>>2]|0);bv(al,bP&1,bT);bR=c[bd>>2]|0;bS=c[bC>>2]|0;Q=32-(dG(bS|0)|0)|0;h=bS>>>((Q-16|0)>>>0);bS=$(h,h);h=bS>>>31;bA=bS>>>15>>>(h>>>0);bS=$(bA,bA);bA=bS>>>31;bp=bS>>>15>>>(bA>>>0);bS=(bR<<3)-($(bp,bp)>>>31|(bA|(h|Q<<1)<<1)<<1)|0;if(!bP){bX=bS;bY=bm;bZ=bI;b_=bO;break}bP=bI+t|0;Q=bm+t|0;h=bO+1|0;if((bS+8|0)<(bF-Q|0)){bU=bS;bm=Q;bT=1;bI=bP;bO=h}else{bX=bS;bY=Q;bZ=bP;b_=h;break}}if((b_|0)==0){b$=aH;b0=bZ;b1=bY;b2=bX;break}bO=aH-1|0;b$=(bO|0)<2?2:bO;b0=bZ;b1=bY;b2=bX}else{b$=aH;b0=0;b1=br;b2=K}}while(0);c[a7>>2]=b0;t=c[k>>2]|0;if((am|0)<(t|0)){K=b2;br=b1;aH=b$;aF=am}else{b3=b2;b4=b1;b5=t;break L1012}}}else{b3=aR;b4=0;b5=af}}while(0);af=(y|0)==2;if(af){if((L|0)!=0){aR=c[E>>2]|0;bt=1.0000000036274937e-15;aA=1.0000000036274937e-15;b1=0;b2=b[aR>>1]|0;while(1){b$=b2<<16>>16<<L;b0=b1+1|0;bX=b[aR+(b0<<1)>>1]|0;bY=bX<<16>>16<<L;L1031:do{if((b$|0)<(bY|0)){bZ=b$;bs=bt;aP=aA;while(1){aQ=+g[bn+(bZ<<2)>>2];aD=+g[bn+(bZ+O<<2)>>2];az=aQ+aD;ar=aQ-aD;if(aQ<0.0){b6=-0.0-aQ}else{b6=aQ}if(aD<0.0){b7=-0.0-aD}else{b7=aD}aD=aP+(b6+b7);if(az<0.0){b8=-0.0-az}else{b8=az}if(ar<0.0){b9=-0.0-ar}else{b9=ar}ar=bs+(b8+b9);b_=bZ+1|0;if((b_|0)==(bY|0)){ca=ar;cb=aD;break L1031}else{bZ=b_;bs=ar;aP=aD}}}else{ca=bt;cb=aA}}while(0);if((b0|0)==13){break}else{bt=ca;aA=cb;b1=b0;b2=bX}}b2=(b[aR+26>>1]|0)<<L+1;c[r>>2]=ca*.7071070075035095*+(b2+((L|0)<2?5:13)|0)>cb*+(b2|0)&1}cb=+(((aG<<3)-80>>L<<1|0)/5&-1|0);aG=e+188|0;b2=c[aG>>2]|0;aR=0;while(1){if((aR|0)>=21){break}if(+g[5260260+(aR<<2)>>2]>cb){break}else{aR=aR+1|0}}do{if((aR|0)>(b2|0)){if(+g[5260260+(b2<<2)>>2]+ +g[5260344+(b2<<2)>>2]>cb){cc=b2;break}else{M=708;break}}else{M=708}}while(0);do{if((M|0)==708){if((aR|0)>=(b2|0)){cc=aR;break}b1=b2-1|0;if(+g[5260260+(b1<<2)>>2]- +g[5260344+(b1<<2)>>2]>=cb){cc=aR;break}cc=b2}}while(0);c[aG>>2]=cc;b2=c[bM>>2]|0;aR=(b2|0)>(cc|0)?b2:cc;c[aG>>2]=(b5|0)<(aR|0)?b5:aR}if((b3+48|0)>(bF-b4|0)){cd=5;ce=b3}else{b3=e+184|0;cb=+g[u>>2];bF=c[e+188>>2]|0;if(af){aR=c[E>>2]|0;E=0;ca=0.0;aG=b[aR>>1]|0;while(1){cc=aG<<16>>16<<L;b2=E+1|0;b1=b[aR+(b2<<1)>>1]|0;bY=b1<<16>>16<<L;L1067:do{if((cc|0)<(bY|0)){b$=cc;aA=0.0;while(1){bt=aA+ +g[bn+(b$<<2)>>2]*+g[bn+(b$+O<<2)>>2];bZ=b$+1|0;if((bZ|0)==(bY|0)){cf=bt;break L1067}else{b$=bZ;aA=bt}}}else{cf=0.0}}while(0);cg=ca+cf;if((b2|0)==8){break}else{E=b2;ca=cg;aG=b1}}ca=cg*.125;do{if(ca<0.0){aG=ca<-1.0;if(aG){ch=aG?1.0:ca;break}ch=-0.0-ca}else{ch=ca>1.0?1.0:ca}}while(0);L1077:do{if((bF|0)>8){aG=8;ca=ch;E=b[aR+16>>1]|0;while(1){bY=E<<16>>16<<L;cc=aG+1|0;bX=b[aR+(cc<<1)>>1]|0;b0=bX<<16>>16<<L;do{if((bY|0)<(b0|0)){b$=bY;cg=0.0;while(1){ci=cg+ +g[bn+(b$<<2)>>2]*+g[bn+(b$+O<<2)>>2];bZ=b$+1|0;if((bZ|0)==(b0|0)){break}else{b$=bZ;cg=ci}}if(ci>=0.0){cj=ci;M=727;break}cg=-0.0-ci;ck=ca<cg?ca:cg;break}else{cj=0.0;M=727}}while(0);if((M|0)==727){M=0;ck=ca<cj?ca:cj}if((cc|0)==(bF|0)){cl=ck;break L1077}else{aG=cc;ca=ck;E=bX}}}else{cl=ch}}while(0);do{if(cl<0.0){bF=cl<-1.0;if(bF){cm=bF?1.0:cl;break}cm=-0.0-cl}else{cm=cl>1.0?1.0:cl}}while(0);cl=+Z(+(1.0010000467300415-ch*ch))*1.4426950408889634;ch=cl*.5;ck=+Z(+(1.0010000467300415-cm*cm))*1.4426950408889634;cm=cl*.75;if(cm<-4.0){cn=1.0}else{cn=cm+5.0}cm=+g[b3>>2]+.25;cl=-0.0-(ch>ck?ch:ck)*.5;g[b3>>2]=cm<cl?cm:cl;co=cn}else{co=5.0}b3=b5-1|0;bF=(b3|0)>0;aR=2-b5|0;cn=0.0;b5=0;while(1){L1101:do{if(bF){E=$(c[A>>2]|0,b5);cl=cn;aG=0;while(1){cm=cl+ +g[be+(aG+E<<2)>>2]*+(aR+(aG<<1)|0);b1=aG+1|0;if((b1|0)==(b3|0)){cp=cm;break L1101}else{cl=cm;aG=b1}}}else{cp=cn}}while(0);aG=b5+1|0;if((aG|0)<(y|0)){cn=cp;b5=aG}else{break}}cn=(cp/+($(b3,y)|0)+1.0)/6.0;if(cn>2.0){cq=2.0}else{cq=cn<-2.0?-2.0:cn}cn=co-cq-cb*2.0;if((c[e+116>>2]|0)==0){cr=cn}else{cb=(+g[e+124>>2]+.05000000074505806)*2.0;do{if(cb<=2.0&cb<-2.0){cs=-2.0}else{if(cb>2.0){cs=2.0;break}cs=cb}}while(0);cr=cn-cs}b3=~~+N(+(cr+.5));b5=(b3|0)<0?0:b3;b3=(b5|0)>10?10:b5;bw(al,b3,5245060,7);b5=c[bd>>2]|0;aR=c[bC>>2]|0;be=32-(dG(aR|0)|0)|0;A=aR>>>((be-16|0)>>>0);aR=$(A,A);A=aR>>>31;bF=aR>>>15>>>(A>>>0);aR=$(bF,bF);bF=aR>>>31;aG=aR>>>15>>>(bF>>>0);cd=b3;ce=(b5<<3)-($(aG,aG)>>>31|(bF|(A|be<<1)<<1)<<1)|0}if(l){l=(c[J>>2]|0)-L|0;J=c[e+88>>2]|0;be=(J|0)==0?B:J;J=(b[F+(be<<1)>>1]|0)<<L;if(af){A=c[e+188>>2]|0;ct=((b[F+(((A|0)<(be|0)?A:be)<<1)>>1]|0)<<L)+J|0}else{ct=J}J=1275>>>((3-L|0)>>>0);A=(aE|0)<(J|0)?aE:J;J=((y*-320&-1)-160|0)+ah|0;bF=(c[bV>>2]|0)==0;if(bF){cu=J}else{cu=(c[e+172>>2]>>l)+J|0}bV=(c[e+116>>2]|0)==0;do{if(bV){cv=cu}else{cr=+g[e+132>>2];if(cr>=.4){cv=cu;break}cv=cu-~~(+(ct<<3|0)*(.4000000059604645-cr))|0}}while(0);if(af){cu=c[e+188>>2]|0;aG=(cu|0)<(be|0)?cu:be;be=((b[F+(aG<<1)>>1]|0)<<L)-aG|0;cr=+(cv|0)*(+(be|0)*.800000011920929/+(ct|0));cs=(+g[e+184>>2]+-.10000000149011612)*+(be<<3|0);cw=cv-~~(cr<cs?cr:cs)|0}else{cw=cv}cv=((c[v>>2]|0)-(16<<L)|0)+cw|0;cw=~~(+g[u>>2]*+(cv|0))+cv|0;do{if(bV){cx=cw}else{cs=+g[e+120>>2]+-.15000000596046448;if(cs<0.0){cy=-.09000000357627869}else{cy=cs+-.09000000357627869}cs=+(ct<<3|0);cv=~~(cs*1.2000000476837158*cy)+cw|0;if((aS|0)==0){cx=cv;break}cx=cv+~~(cs*.800000011920929)|0}}while(0);aS=~~(bE*+($(y<<3,(b[F+(B-2<<1)>>1]|0)<<L)|0));F=cx>>2;cw=(aS|0)>(F|0)?aS:F;F=(cx|0)<(cw|0)?cx:cw;cw=e+44|0;cx=c[cw>>2]|0;do{if(bF){if((cx|0)>=64e3){cz=F;break}bE=+((c[cw>>2]|0)-32e3|0)*30517578125.0e-15;cA=bE<0.0?0.0:bE;M=769;break}else{bE=+(cx-32e3|0)*30517578125.0e-15;cy=bE<0.0?0.0:bE;cA=cy<.6700000166893005?cy:.6700000166893005;M=769;break}}while(0);if((M|0)==769){cz=~~(+(F-J|0)*cA)+J|0}F=J<<1;J=((F|0)<(cz|0)?F:cz)+ce|0;cz=(2-_|0)+((b4+63|0)+ce>>6)|0;ce=J+32>>6;b4=((cz|0)>(ce|0)?cz:ce)+_|0;ce=((A|0)<(b4|0)?A:b4)-_|0;b4=aJ?2:ce;cz=e+176|0;F=c[cz>>2]|0;if((F|0)<970){c[cz>>2]=F+1|0;cB=1.0/+(F+21|0)}else{cB=.0010000000474974513}do{if(bF){cC=b4}else{F=e+164|0;cz=((aJ?128:ce<<6)-ah|0)+(c[F>>2]|0)|0;c[F>>2]=cz;M=e+172|0;cx=e+168|0;cw=c[cx>>2]|0;aS=~~(cB*+((((aJ?0:J-ah|0)<<l)-(c[M>>2]|0)|0)-cw|0))+cw|0;c[cx>>2]=aS;c[M>>2]=-aS|0;if((cz|0)>=0){cC=b4;break}c[F>>2]=0;cC=(aJ?0:(cz|0)/-64&-1)+b4|0}}while(0);b4=cC+_|0;_=(A|0)<(b4|0)?A:b4;b4=c[al>>2]|0;A=c[al+8>>2]|0;dI(b4+(_-A|0)|0,b4+((c[bH>>2]|0)-A|0)|0,A|0);c[bH>>2]=_;cD=_}else{cD=aE}aE=i;i=i+(B*4&-1)|0;i=i+3>>2<<2;_=i;i=i+(B*4&-1)|0;i=i+3>>2<<2;A=i;i=i+(B*4&-1)|0;i=i+3>>2<<2;b4=cD<<3;cC=cD<<6;l=c[bd>>2]|0;ah=c[bC>>2]|0;J=32-(dG(ah|0)|0)|0;ce=ah>>>((J-16|0)>>>0);ah=$(ce,ce);ce=ah>>>31;bF=ah>>>15>>>(ce>>>0);ah=$(bF,bF);bF=ah>>>31;cz=ah>>>15>>>(bF>>>0);ah=((cC-1|0)-(l<<3)|0)+($(cz,cz)>>>31|(bF|(ce|J<<1)<<1)<<1)|0;if(bz&(L|0)>1){cE=(ah|0)>=((L<<3)+16|0)}else{cE=0}J=cE?8:0;ce=c[k>>2]|0;if((c[e+116>>2]|0)==0){cF=ce-1|0}else{cF=c[e+140>>2]|0}bF=e+188|0;cz=e+88|0;l=bQ(z,c[bM>>2]|0,ce,bW,ab,cd,bF,r,ah-J|0,s,_,aE,A,y,L,al,1,c[cz>>2]|0,cF)|0;c[cz>>2]=l;bN(z,c[bM>>2]|0,c[k>>2]|0,V,o,aE,al,y);cz=i;i=i+bq|0;i=i+3>>2<<2;if(af){cG=bn+(O<<2)|0}else{cG=0}O=e+72|0;a6(1,z,c[bM>>2]|0,c[k>>2]|0,bn,cG,cz,bf,_,bG,c[e+76>>2]|0,c[r>>2]|0,c[bF>>2]|0,bg,cC-J|0,c[s>>2]|0,al,L,l,O);if(cE){cE=(c[e+112>>2]|0)<2&1;l=al+12|0;L=c[l>>2]|0;s=al+16|0;J=c[s>>2]|0;if((J+1|0)>>>0>32){cC=al+24|0;bg=al+8|0;bF=al|0;r=al+44|0;bG=7-J|0;_=((bG|0)>-8?bG:-8)+J|0;bG=J;bf=L;while(1){cz=c[bg>>2]|0;cG=c[bH>>2]|0;if((cz+(c[cC>>2]|0)|0)>>>0<cG>>>0){bn=cz+1|0;c[bg>>2]=bn;a[(c[bF>>2]|0)+(cG-bn|0)|0]=bf&255;cH=0}else{cH=-1}c[r>>2]=c[r>>2]|cH;cI=bf>>>8;bn=bG-8|0;if((bn|0)>7){bG=bn;bf=cI}else{break}}cJ=(J-8|0)-(_&-8)|0;cK=cI}else{cJ=J;cK=L}c[l>>2]=cE<<cJ|cK;c[s>>2]=cJ+1|0;cJ=(c[bd>>2]|0)+1|0;c[bd>>2]=cJ;cL=cJ}else{cL=c[bd>>2]|0}bd=c[bM>>2]|0;cJ=c[k>>2]|0;bK(z,bd,cJ,V,o,aE,A,(b4-cL|0)-(dG(c[bC>>2]|0)|-32)|0,al,y);L1178:do{if(aJ&(bq|0)>0){y=0;while(1){g[e+192+(y+U<<2)>>2]=-28.0;cL=y+1|0;if((cL|0)==(bq|0)){break L1178}else{y=cL}}}}while(0);c[e+100>>2]=c[p>>2]|0;g[e+104>>2]=+g[q>>2];c[e+108>>2]=ag;L1182:do{if(a9&(B|0)>0){ag=U+B|0;q=0;while(1){g[e+192+(ag+q<<2)>>2]=+g[e+192+(q+U<<2)>>2];p=q+1|0;if((p|0)==(B|0)){break L1182}else{q=p}}}}while(0);a9=(W|0)>0;L1187:do{if(bz){if(a9){cM=0}else{cN=0;break}while(1){q=e+192+(cM+T<<2)|0;cB=+g[q>>2];cA=+g[e+192+(cM+U<<2)>>2];g[q>>2]=cB<cA?cB:cA;q=cM+1|0;if((q|0)==(W|0)){cN=0;break L1187}else{cM=q}}}else{if(a9){cO=0}else{cN=0;break}while(1){g[e+192+(cO+Y<<2)>>2]=+g[e+192+(cO+T<<2)>>2];q=cO+1|0;if((q|0)==(W|0)){break}else{cO=q}}if(a9){cP=0}else{cN=0;break}while(1){g[e+192+(cP+T<<2)>>2]=+g[e+192+(cP+U<<2)>>2];q=cP+1|0;if((q|0)==(W|0)){cN=0;break L1187}else{cP=q}}}}while(0);while(1){L1199:do{if((c[bM>>2]|0)>0){cP=$(cN,B);W=0;while(1){a9=W+cP|0;g[e+192+(a9+U<<2)>>2]=0.0;g[e+192+(a9+Y<<2)>>2]=-28.0;g[e+192+(a9+T<<2)>>2]=-28.0;a9=W+1|0;if((a9|0)<(c[bM>>2]|0)){W=a9}else{break L1199}}}}while(0);W=c[k>>2]|0;L1204:do{if((W|0)<(B|0)){cP=$(cN,B);a9=W;while(1){cO=a9+cP|0;g[e+192+(cO+U<<2)>>2]=0.0;g[e+192+(cO+Y<<2)>>2]=-28.0;g[e+192+(cO+T<<2)>>2]=-28.0;cO=a9+1|0;if((cO|0)==(B|0)){break L1204}else{a9=cO}}}}while(0);W=cN+1|0;if((W|0)<(x|0)){cN=W}else{break}}cN=e+112|0;if((bo|0)==0&(bz^1)){cQ=0}else{cQ=(c[cN>>2]|0)+1|0}c[cN>>2]=cQ;c[O>>2]=c[bC>>2]|0;by(al);bC=(c[al+44>>2]|0)==0?cD:-3;au(ao|0);G=bC;i=m;return G|0}function bh(a,b,d,e,f,h,j,k,l,m,n){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0.0,A=0,B=0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0,M=0,O=0.0,P=0,Q=0,R=0,S=0,T=0;o=i;i=i+12|0;p=o|0;q=o+8|0;r=c[a>>2]|0;s=f+1024|0;t=$(s,e);u=i;i=i+(t*4&-1)|0;i=i+3>>2<<2;t=p|0;c[t>>2]=u;c[p+4>>2]=u+(s<<2)|0;v=a+4|0;w=f<<2;x=0;y=u;while(1){dH(y|0,d+(x<<10<<2)|0,4096);u=c[v>>2]|0;dH(y+4096|0,b+($(u+f|0,x)+u<<2)|0,w);u=x+1|0;if((u|0)>=(e|0)){break}x=u;y=c[p+(u<<2)>>2]|0}if((m|0)==0){c[q>>2]=15;z=0.0;A=15;B=a+100|0}else{m=at()|0;y=i;i=i+((s>>1)*4&-1)|0;i=i+3>>2<<2;bF(t,y,s,e);bG(y+2048|0,y,f,979,q);c[q>>2]=1024-(c[q>>2]|0)|0;s=a+100|0;C=+bH(y,1024,15,f,q,c[s>>2]|0,+g[a+104>>2]);y=c[q>>2]|0;if((y|0)>1022){c[q>>2]=1022;D=1022}else{D=y}E=C*.699999988079071;y=c[a+60>>2]|0;do{if((y|0)>2){C=E*.5;if((y|0)<=4){F=C;break}F=C*.5}else{F=E}}while(0);au(m|0);z=(y|0)>8?0.0:F;A=D;B=s}s=c[B>>2]|0;D=A-s|0;F=(((D|0)>-1?D:-D|0)*10&-1|0)>(A|0)?.4000000059604645:.20000000298023224;if((n|0)<25){G=F+.10000000149011612}else{G=F}if((n|0)<35){H=G+.10000000149011612}else{H=G}n=a+104|0;G=+g[n>>2];if(G>.4000000059604645){I=H+-.10000000149011612}else{I=H}if(G>.550000011920929){J=I+-.10000000149011612}else{J=I}if(z<(J>.20000000298023224?J:.20000000298023224)){K=0.0;L=0;M=0}else{J=z-G;if(J<0.0){O=-0.0-J}else{O=J}D=~~+N(+((O<.10000000149011612?G:z)*32.0/3.0+.5))-1|0;y=(D|0)>7?7:D;D=(y|0)<0?0:y;K=+(D+1|0)*.09375;L=1;M=D}D=r+44|0;z=-0.0-K;y=a+108|0;m=r+60|0;r=(f|0)>1024;q=1024-f|0;t=q<<2;x=0;u=s;while(1){s=c[D>>2]|0;P=c[v>>2]|0;Q=s-P|0;c[B>>2]=(u|0)>15?u:15;R=b+($(P+f|0,x)<<2)|0;dH(R|0,a+192+($(P,x)<<2)|0,P<<2);if((s|0)==(P|0)){S=c[p+(x<<2)>>2]|0}else{P=c[v>>2]|0;s=b+($(P+f|0,x)+P<<2)|0;P=c[p+(x<<2)>>2]|0;R=c[B>>2]|0;G=-0.0- +g[n>>2];T=c[y>>2]|0;bf(s,P+4096|0,R,R,Q,G,G,T,T,0,0);S=P}P=c[v>>2]|0;T=b+((P+Q|0)+$(P+f|0,x)<<2)|0;bf(T,S+(Q+1024<<2)|0,c[B>>2]|0,A,f-Q|0,-0.0- +g[n>>2],z,c[y>>2]|0,h,c[m>>2]|0,P);P=c[v>>2]|0;Q=a+192+($(P,x)<<2)|0;dH(Q|0,b+($(P+f|0,x)+f<<2)|0,P<<2);P=x<<10;Q=d+(P<<2)|0;if(r){dI(Q|0,S+(f<<2)|0,4096)}else{dI(Q|0,d+(P+f<<2)|0,t|0);dI(d+(q+P<<2)|0,S+4096|0,w|0)}P=x+1|0;if((P|0)>=(e|0)){break}x=P;u=c[B>>2]|0}g[k>>2]=K;c[j>>2]=A;c[l>>2]=M;i=o;return L|0}function bi(a,b,e,f,h){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0,H=0,I=0.0,J=0.0,K=0,L=0,M=0,O=0,Q=0,R=0,S=0.0,T=0.0,U=0,V=0.0,W=0.0,X=0.0,Y=0,Z=0.0,_=0.0,aa=0.0,ab=0,ac=0.0,ad=0.0,ae=0,af=0,ag=0,ah=0,ai=0;j=i;k=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;l=k;m=(b|0)/2&-1;if((e|0)<=0){n=0;o=(n|0)>200;p=o&1;q=n*27&-1;r=+(q|0);s=+P(+r);t=s;u=t+-42.0;v=u<0.0;w=v?0.0:u;x=w>163.0;y=w*.006899999920278788;z=y;A=x?1.1246999502182007:z;B=A+-.139;C=B<0.0;D=C?0.0:B;E=+P(+D);F=E;g[f>>2]=F;i=j;return p|0}G=(b|0)>0;H=(b|0)>1;I=+(m|0);J=+(m|0);K=m-5|0;L=(K|0)>12;M=(m*6&-1)-102|0;O=0;Q=0;while(1){L1266:do{if(G){R=$(O,b);S=0.0;T=0.0;U=0;while(1){V=+g[a+(U+R<<2)>>2];W=T+V;X=S+W-V*2.0;g[k+(U<<2)>>2]=W;Y=U+1|0;if((Y|0)==(b|0)){break L1266}else{S=V-W*.5;T=X;U=Y}}}}while(0);dF(l|0,0,48);L1271:do{if(H){T=0.0;S=0.0;U=0;while(1){R=U<<1;X=+g[k+(R<<2)>>2];W=+g[k+((R|1)<<2)>>2];V=X*X+W*W;Z=T+V;W=S+(V-S)*.0625;g[k+(U<<2)>>2]=W;R=U+1|0;if((R|0)<(m|0)){T=Z;S=W;U=R}else{break}}if(H){_=0.0;aa=0.0;ab=m}else{ac=0.0;ad=Z;break}while(1){U=ab-1|0;R=k+(U<<2)|0;S=aa+(+g[R>>2]-aa)*.125;g[R>>2]=S;T=_>S?_:S;if((U|0)>0){_=T;aa=S;ab=U}else{ac=T;ad=Z;break L1271}}}else{ac=0.0;ad=0.0}}while(0);if(L){T=J/(+P(+(I*ad*ac*.5))+1.0000000036274937e-15)*64.0;U=0;R=12;while(1){Y=~~+N(+(T*+g[k+(R<<2)>>2]));ae=(Y|0)>127;if((Y|0)<0&(ae^1)){af=0}else{af=ae?127:Y}ag=(d[af+5245072|0]|0)+U|0;Y=R+4|0;if((Y|0)<(K|0)){U=ag;R=Y}else{break}}ah=ag<<8}else{ah=0}R=(ah|0)/(M|0)&-1;if((R|0)>(Q|0)){c[h>>2]=O;ai=R}else{ai=Q}R=O+1|0;if((R|0)==(e|0)){n=ai;break}else{O=R;Q=ai}}o=(n|0)>200;p=o&1;q=n*27&-1;r=+(q|0);s=+P(+r);t=s;u=t+-42.0;v=u<0.0;w=v?0.0:u;x=w>163.0;y=w*.006899999920278788;z=y;A=x?1.1246999502182007:z;B=A+-.139;C=B<0.0;D=C?0.0:B;E=+P(+D);F=E;g[f>>2]=F;i=j;return p|0}function bj(a,b,d,e,f,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0;k=c[a+4>>2]|0;l=c[a+44>>2]|0;if((b|0)==0){m=l<<i;n=(c[a+36>>2]|0)-i|0;o=1}else{m=l;n=c[a+36>>2]|0;o=b}b=(o|0)>0;l=a+64|0;i=$(m,o);p=i+k|0;q=a+60|0;a=0;while(1){L1298:do{if(b){r=$(a,p);s=$(i,a);t=0;while(1){u=d+($(t,m)+r<<2)|0;bD(l,u,e+(t+s<<2)|0,c[q>>2]|0,k,n,o);u=t+1|0;if((u|0)==(o|0)){break L1298}else{t=u}}}}while(0);t=a+1|0;if((t|0)<(h|0)){a=t}else{break}}L1304:do{if((h|0)==2&(f|0)==1&(i|0)>0){a=0;while(1){o=e+(a<<2)|0;g[o>>2]=+g[o>>2]*.5+ +g[e+(a+i<<2)>>2]*.5;o=a+1|0;if((o|0)==(i|0)){break L1304}else{a=o}}}}while(0);if((j|0)==1){return}h=(i|0)/(j|0)&-1;a=(h|0)>0;v=+(j|0);j=0;while(1){o=$(i,j);L1313:do{if(a){n=0;while(1){k=e+(n+o<<2)|0;g[k>>2]=v*+g[k>>2];k=n+1|0;if((k|0)==(h|0)){w=h;break L1313}else{n=k}}}else{w=0}}while(0);if((w|0)<(i|0)){dF(e+(w+o<<2)|0,0,i-w<<2|0)}n=j+1|0;if((n|0)<(f|0)){j=n}else{break}}return}function bk(d,e,f,h,j,k,l,m,n,o,p){d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=+o;p=p|0;var q=0,r=0.0,s=0.0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0.0,U=0.0,V=0,W=0.0,X=0,Y=0.0,Z=0,_=0,aa=0,ab=0.0,ac=0.0,ad=0.0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0.0,al=0.0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0;q=i;r=.5-o;if(r<-.25){s=-.009999999776482582}else{s=r*.03999999910593033}t=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;u=d+32|0;d=c[u>>2]|0;v=e-1|0;w=(b[d+(e<<1)>>1]|0)-(b[d+(v<<1)>>1]|0)<<m;d=i;i=i+(w*4&-1)|0;i=i+3>>2<<2;x=d;y=i;i=i+(w*4&-1)|0;i=i+3>>2<<2;w=y;z=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;A=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;c[n>>2]=0;B=(f|0)!=0;L1325:do{if((e|0)>0){C=B?m:0;r=+(C|0)*s;D=B^1;E=1<<m;F=(E|0)>0;G=E<<1;o=+(m+1|0)*s;H=m*-2&-1;I=m-1|0;J=$(p,l);K=0;L=0;while(1){M=K+1|0;N=c[u>>2]|0;O=b[N+(K<<1)>>1]|0;P=(b[N+(M<<1)>>1]|0)-O|0;N=P<<m;Q=(P|0)==1;P=(N|0)>0;L1330:do{if(P){dH(x|0,k+(J+(O<<m)<<2)|0,N<<2);R=0;S=0.0;while(1){T=+g[d+(R<<2)>>2];if(T<0.0){U=-0.0-T}else{U=T}T=S+U;V=R+1|0;if((V|0)==(N|0)){W=T;break L1330}else{R=V;S=T}}}else{W=0.0}}while(0);S=W+r*W;do{if(Q|D){X=0;Y=S}else{if(P){dH(w|0,x|0,N<<2)}O=N>>m>>1;L1343:do{if(F){R=(O|0)>0;V=0;while(1){L1347:do{if(R){Z=0;while(1){_=y+($(G,Z)+V<<2)|0;T=+g[_>>2]*.7071067690849304;aa=y+(((Z<<1|1)<<m)+V<<2)|0;ab=+g[aa>>2]*.7071067690849304;g[_>>2]=T+ab;g[aa>>2]=T-ab;aa=Z+1|0;if((aa|0)==(O|0)){break L1347}else{Z=aa}}}}while(0);Z=V+1|0;if((Z|0)==(E|0)){break L1343}else{V=Z}}}}while(0);L1352:do{if(P){O=0;ab=0.0;while(1){T=+g[y+(O<<2)>>2];if(T<0.0){ac=-0.0-T}else{ac=T}T=ab+ac;V=O+1|0;if((V|0)==(N|0)){ad=T;break L1352}else{O=V;ab=T}}}else{ad=0.0}}while(0);ab=ad+o*ad;if(ab>=S){X=0;Y=S;break}X=-1;Y=ab}}while(0);O=((B|Q)&1^1)+m|0;L1361:do{if((O|0)>0){V=0;S=Y;R=X;while(1){Z=B?I-V|0:V+1|0;aa=1<<V;_=N>>V>>1;L1364:do{if((aa|0)>0){ae=(_|0)>0;af=aa<<1;ag=0;while(1){L1368:do{if(ae){ah=0;while(1){ai=d+($(af,ah)+ag<<2)|0;ab=+g[ai>>2]*.7071067690849304;aj=d+(((ah<<1|1)<<V)+ag<<2)|0;T=+g[aj>>2]*.7071067690849304;g[ai>>2]=ab+T;g[aj>>2]=ab-T;aj=ah+1|0;if((aj|0)==(_|0)){break L1368}else{ah=aj}}}}while(0);ah=ag+1|0;if((ah|0)==(aa|0)){break L1364}else{ag=ah}}}}while(0);L1373:do{if(P){aa=0;T=0.0;while(1){ab=+g[d+(aa<<2)>>2];if(ab<0.0){ak=-0.0-ab}else{ak=ab}ab=T+ak;_=aa+1|0;if((_|0)==(N|0)){al=ab;break L1373}else{aa=_;T=ab}}}else{al=0.0}}while(0);T=al+s*+(Z|0)*al;aa=T<S;_=V+1|0;ag=aa?_:R;if((_|0)==(O|0)){am=ag;break L1361}else{V=_;S=aa?T:S;R=ag}}}else{am=X}}while(0);if(B){O=am<<1;c[t+(K<<2)>>2]=O;an=O}else{O=am*-2&-1;c[t+(K<<2)>>2]=O;an=O}O=t+(K<<2)|0;N=(((an|0)/-2&-1)+C|0)+L|0;c[n>>2]=N;do{if(Q){if(!((an|0)==0|(an|0)==(H|0))){break}c[O>>2]=an-1|0}}while(0);if((M|0)==(e|0)){break}else{K=M;L=N}}L=(f|0)!=0?0:j;K=(e|0)>1;H=f<<2;if(!K){ao=L;ap=0;aq=H;ar=0;as=L;at=(L|0)>0?0:L;break}C=(a[5245212+(m<<3)+H|0]|0)<<1;I=(a[(H|1)+(5245212+(m<<3))|0]|0)<<1;E=L;G=0;F=1;while(1){D=E+j|0;J=G+j|0;O=c[t+(F<<2)>>2]|0;Q=O-C|0;au=((Q|0)>-1?Q:-Q|0)+((G|0)<(D|0)?G:D)|0;D=O-I|0;av=((D|0)>-1?D:-D|0)+((J|0)<(E|0)?J:E)|0;J=F+1|0;if((J|0)==(e|0)){break}else{E=av;G=au;F=J}}F=(au|0)<(av|0)?au:av;if(!K){ao=L;ap=0;aq=H;ar=0;as=L;at=F;break}G=(a[(H|2)+(5245212+(m<<3))|0]|0)<<1;E=(a[(H|3)+(5245212+(m<<3))|0]|0)<<1;I=L;C=0;J=1;while(1){D=I+j|0;O=C+j|0;Q=c[t+(J<<2)>>2]|0;P=Q-G|0;R=((P|0)>-1?P:-P|0)+((C|0)<(D|0)?C:D)|0;D=Q-E|0;Q=((D|0)>-1?D:-D|0)+((O|0)<(I|0)?O:I)|0;O=J+1|0;if((O|0)==(e|0)){ao=Q;ap=R;aq=H;ar=1;as=L;at=F;break L1325}else{I=Q;C=R;J=O}}}else{J=B?0:j;ao=J;ap=0;aq=f<<2;ar=0;as=J;at=(J|0)>0?0:J}}while(0);B=((((ap|0)<(ao|0)?ap:ao)|0)>=(at|0)|(f|0)==0)&1^1;L1400:do{if(ar){f=B<<1|aq;at=(a[5245212+(m<<3)+f|0]|0)<<1;ao=(a[(f|1)+(5245212+(m<<3))|0]|0)<<1;f=as;ap=0;av=1;while(1){au=f+j|0;an=(ap|0)<(au|0);c[z+(av<<2)>>2]=an&1^1;n=ap+j|0;am=(n|0)<(f|0);c[A+(av<<2)>>2]=am&1^1;X=c[t+(av<<2)>>2]|0;d=X-at|0;y=((d|0)>-1?d:-d|0)+(an?ap:au)|0;au=X-ao|0;X=((au|0)>-1?au:-au|0)+(am?n:f)|0;n=av+1|0;if((n|0)==(e|0)){aw=X;ax=y;break L1400}else{f=X;ap=y;av=n}}}else{aw=as;ax=0}}while(0);as=(ax|0)>=(aw|0)&1;c[h+(v<<2)>>2]=as;v=e-2|0;if((v|0)>-1){ay=v;az=as}else{i=q;return B|0}while(1){as=ay+1|0;if((az|0)==1){v=c[A+(as<<2)>>2]|0;c[h+(ay<<2)>>2]=v;aA=v}else{v=c[z+(as<<2)>>2]|0;c[h+(ay<<2)>>2]=v;aA=v}if((ay|0)>0){ay=ay-1|0;az=aA}else{break}}i=q;return B|0}function bl(a,d,e,f,h,j,k,l,m,n,o,p,q,r,s,t){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0.0,B=0,C=0,D=0.0,E=0.0,F=0.0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0,Q=0,R=0;u=i;v=$(j,e);w=i;i=i+(v*4&-1)|0;i=i+3>>2<<2;x=i;i=i+(v*4&-1)|0;i=i+3>>2<<2;if((e|0)>0){dF(k|0,0,e<<2|0)}v=(h|0)>0;L1418:do{if(v){y=+(9-l|0);z=0;while(1){A=y+(+(b[m+(z<<1)>>1]|0|0)*.0625+.5)- +g[5259564+(z<<2)>>2];B=z+5|0;g[x+(z<<2)>>2]=+($(B,B)|0)*.006200000178068876+A;B=z+1|0;if((B|0)==(h|0)){C=0;D=-32.0;break L1418}else{z=B}}}else{C=0;D=-32.0}}while(0);while(1){L1424:do{if(v){m=$(C,e);y=D;l=0;while(1){A=+g[a+(l+m<<2)>>2]- +g[x+(l<<2)>>2];E=y>A?y:A;z=l+1|0;if((z|0)==(h|0)){F=E;break L1424}else{y=E;l=z}}}else{F=D}}while(0);l=C+1|0;if((l|0)<(j|0)){C=l;D=F}else{break}}if(!((s|0)>50&(r|0)>0)){G=0;c[t>>2]=G;i=u;return+F}C=(h|0)>1;l=0;m=0;while(1){z=$(l,e);g[w+(z<<2)>>2]=+g[d+(z<<2)>>2];L1435:do{if(C){B=m;H=1;while(1){I=H+z|0;D=+g[d+(I<<2)>>2];J=I-1|0;K=D>+g[d+(J<<2)>>2]+.5?H:B;y=+g[w+(J<<2)>>2]+1.5;g[w+(I<<2)>>2]=y<D?y:D;I=H+1|0;if((I|0)==(h|0)){L=K;break L1435}else{B=K;H=I}}}else{L=m}}while(0);L1439:do{if((L|0)>0){H=L;while(1){B=H-1|0;I=B+z|0;K=w+(I<<2)|0;D=+g[K>>2];y=+g[w+(H+z<<2)>>2]+2.0;E=+g[d+(I<<2)>>2];A=y<E?y:E;g[K>>2]=D<A?D:A;if((B|0)>0){H=B}else{break L1439}}}}while(0);L1443:do{if(v){H=0;while(1){B=w+(H+z<<2)|0;A=+g[B>>2];D=+g[x+(H<<2)>>2];g[B>>2]=A>D?A:D;B=H+1|0;if((B|0)==(h|0)){break L1443}else{H=B}}}}while(0);z=l+1|0;if((z|0)<(j|0)){l=z;m=L}else{break}}L=(f|0)<(h|0);L1448:do{if((j|0)==2){if(L){M=f}else{break}while(1){m=M+e|0;l=w+(m<<2)|0;D=+g[l>>2];x=w+(M<<2)|0;A=+g[x>>2]+-4.0;E=D>A?D:A;g[l>>2]=E;A=+g[x>>2];D=E+-4.0;E=A>D?A:D;g[x>>2]=E;D=+g[a+(M<<2)>>2]-E;E=+g[a+(m<<2)>>2]- +g[l>>2];g[x>>2]=((E<0.0?0.0:E)+(D<0.0?0.0:D))*.5;x=M+1|0;if((x|0)==(h|0)){break L1448}else{M=x}}}else{if(L){N=f}else{break}while(1){x=w+(N<<2)|0;D=+g[a+(N<<2)>>2]- +g[x>>2];g[x>>2]=D<0.0?0.0:D;x=N+1|0;if((x|0)==(h|0)){break L1448}else{N=x}}}}while(0);N=(o|0)!=0;o=(n|0)==0;L1456:do{if(o&(N&(p|0)==0^1)&(f|0)<(h|0)){n=f;while(1){a=w+(n<<2)|0;g[a>>2]=+g[a>>2]*.5;a=n+1|0;if((a|0)==(h|0)){break L1456}else{n=a}}}}while(0);if((f|0)>=(h|0)){G=0;c[t>>2]=G;i=u;return+F}n=(p|0)!=0&o;o=(s|0)/4&-1;s=0;p=f;while(1){do{if((p|0)<8){f=w+(p<<2)|0;D=+g[f>>2]*2.0;g[f>>2]=D;O=D}else{f=w+(p<<2)|0;D=+g[f>>2];if((p|0)<=11){O=D;break}E=D*.5;g[f>>2]=E;O=E}}while(0);E=O<4.0?O:4.0;g[w+(p<<2)>>2]=E;f=p+1|0;a=$((b[q+(f<<1)>>1]|0)-(b[q+(p<<1)>>1]|0)|0,j)<<r;do{if((a|0)<6){L=~~E;P=$(L<<3,a);Q=L}else{if((a|0)>48){L=~~(E*8.0);P=($(L<<3,a)|0)/8&-1;Q=L;break}else{L=~~(E*+(a|0)/6.0);P=L*48&-1;Q=L;break}}}while(0);a=P+s|0;if(n|N^1){if((a>>6|0)>(o|0)){break}}c[k+(p<<2)>>2]=Q;if((f|0)<(h|0)){s=a;p=f}else{G=a;R=996;break}}if((R|0)==996){c[t>>2]=G;i=u;return+F}c[k+(p<<2)>>2]=0;G=s;c[t>>2]=G;i=u;return+F}function bm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+4|0;f=e|0;c[f>>2]=d;do{if((b|0)==4010){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if(h>>>0>10){j=1031;break}c[a+28>>2]=h;j=1030;break}else if((b|0)==4031){h=c[f>>2]|0;c[f>>2]=h+4|0;d=c[h>>2]|0;if((d|0)==0){j=1031;break}c[d>>2]=c[a+72>>2]|0;j=1030;break}else if((b|0)==4037){d=c[f>>2]|0;c[f>>2]=d+4|0;c[c[d>>2]>>2]=c[a+64>>2]|0;j=1030;break}else if((b|0)==4040){d=c[f>>2]|0;c[f>>2]=d+4|0;c[a+68>>2]=c[d>>2]|0;j=1030;break}else if((b|0)==10010){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if((h|0)<0){j=1031;break}if((h|0)>=(c[(c[a>>2]|0)+8>>2]|0)){j=1031;break}c[a+36>>2]=h;j=1030;break}else if((b|0)==10012){h=c[f>>2]|0;c[f>>2]=h+4|0;d=c[h>>2]|0;if((d|0)<1){j=1031;break}if((d|0)>(c[(c[a>>2]|0)+8>>2]|0)){j=1031;break}c[a+40>>2]=d;j=1030;break}else if((b|0)==10002){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if(h>>>0>2){j=1031;break}c[a+24>>2]=(h|0)<2&1;c[a+16>>2]=(h|0)==0&1;j=1030;break}else if((b|0)==4014){h=c[f>>2]|0;c[f>>2]=h+4|0;d=c[h>>2]|0;if(d>>>0>100){j=1031;break}c[a+60>>2]=d;j=1030;break}else if((b|0)==4020){d=c[f>>2]|0;c[f>>2]=d+4|0;c[a+56>>2]=c[d>>2]|0;j=1030;break}else if((b|0)==4006){d=c[f>>2]|0;c[f>>2]=d+4|0;c[a+48>>2]=c[d>>2]|0;j=1030;break}else if((b|0)==4002){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if((h|0)<501&(h|0)!=-1){j=1031;break}d=(c[a+8>>2]|0)*26e4&-1;c[a+44>>2]=(h|0)<(d|0)?h:d;j=1030;break}else if((b|0)==4028){d=a+8|0;h=c[d>>2]|0;k=a|0;l=c[k>>2]|0;m=l+8|0;n=c[m>>2]|0;o=((c[a+4>>2]|0)+1024|0)+n|0;p=$(o,h);q=$(o+n|0,h);dF(a+72|0,0,$(((c[l+4>>2]<<2)+4096|0)+(n*12&-1)|0,h)+120|0);L1509:do{if(($(c[m>>2]|0,h)|0)>0){n=0;while(1){g[a+192+(n+q<<2)>>2]=-28.0;g[a+192+(n+p<<2)>>2]=-28.0;l=n+1|0;if((l|0)<($(c[(c[k>>2]|0)+8>>2]|0,c[d>>2]|0)|0)){n=l}else{break L1509}}}}while(0);c[a+172>>2]=0;g[a+80>>2]=1.0;c[a+76>>2]=2;c[a+84>>2]=256;c[a+92>>2]=0;c[a+96>>2]=0;j=1030;break}else if((b|0)==4036){d=c[f>>2]|0;c[f>>2]=d+4|0;k=c[d>>2]|0;if((k-8|0)>>>0>16){j=1031;break}c[a+64>>2]=k;j=1030;break}else if((b|0)==10015){k=c[f>>2]|0;c[f>>2]=k+4|0;d=c[k>>2]|0;if((d|0)==0){j=1031;break}c[d>>2]=c[a>>2]|0;j=1030;break}else if((b|0)==10008){d=c[f>>2]|0;c[f>>2]=d+4|0;k=c[d>>2]|0;if((k-1|0)>>>0>1){j=1031;break}c[a+12>>2]=k;j=1030;break}else if((b|0)==10016){k=c[f>>2]|0;c[f>>2]=k+4|0;c[a+52>>2]=c[k>>2]|0;j=1030;break}else if((b|0)==10022){k=c[f>>2]|0;c[f>>2]=k+4|0;d=c[k>>2]|0;if((d|0)==0){j=1030;break}dH(a+116|0,d|0,32);j=1030;break}else{r=-5;i=e;return r|0}}while(0);if((j|0)==1030){r=0;i=e;return r|0}else if((j|0)==1031){r=-1;i=e;return r|0}return 0}function bn(e,f,h,j,k,l){e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0.0,al=0.0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0.0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a7=0,a8=0,a9=0,ba=0,bb=0.0,bc=0,bd=0,be=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bp=0,bq=0,br=0,bs=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bM=0,bN=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0,cL=0.0,cM=0.0,cN=0;m=i;i=i+84|0;n=m|0;o=m+48|0;p=m+56|0;q=m+64|0;r=m+72|0;s=m+76|0;t=m+80|0;u=c[e+8>>2]|0;c[r>>2]=0;c[s>>2]=0;v=c[e+12>>2]|0;w=c[e>>2]|0;x=w+8|0;y=c[x>>2]|0;z=w+4|0;A=c[z>>2]|0;B=w+32|0;C=c[B>>2]|0;D=e+16|0;E=c[D>>2]|0;F=A+2048|0;G=0;while(1){H=$(G,F);c[p+(G<<2)>>2]=e+80+(H<<2)|0;c[o+(G<<2)>>2]=e+80+(H+1024<<2)|0;H=G+1|0;if((H|0)<(u|0)){G=H}else{break}}G=$(E,k);k=$(A+2072|0,u);E=e+80+(k<<2)|0;F=y<<1;H=k+F|0;I=e+80+(H<<2)|0;J=H+F|0;K=e+80+(J<<2)|0;L=J+F|0;M=w+44|0;N=w+36|0;O=c[N>>2]|0;P=0;while(1){if((P|0)>(O|0)){Q=-1;R=1279;break}if((c[M>>2]<<P|0)==(G|0)){break}else{P=P+1|0}}if((R|0)==1279){i=m;return Q|0}O=1<<P;if(h>>>0>1275|(j|0)==0){Q=-1;i=m;return Q|0}S=c[M>>2]<<P;T=e+24|0;U=c[T>>2]|0;V=c[w+12>>2]|0;W=(U|0)>(V|0)?V:U;if((f|0)==0|(h|0)<2){bo(e,j,S,P);Q=(G|0)/(c[D>>2]|0)&-1;i=m;return Q|0}if((l|0)==0){c[n>>2]=f;c[n+4>>2]=h;c[n+8>>2]=0;c[n+12>>2]=0;c[n+16>>2]=0;U=n+20|0;c[U>>2]=9;V=n+24|0;c[V>>2]=0;X=n+28|0;c[X>>2]=128;if((h|0)==0){Z=0;_=0}else{c[V>>2]=1;Z=d[f]|0;_=1}aa=n+40|0;c[aa>>2]=Z;ab=Z>>>1^127;ac=n+32|0;c[ac>>2]=ab;c[n+44>>2]=0;if(_>>>0<h>>>0){ad=_+1|0;c[V>>2]=ad;ae=d[f+_|0]|0;af=ad}else{ae=0;af=_}if(af>>>0<h>>>0){_=af+1|0;c[V>>2]=_;ag=d[f+af|0]|0;ah=_}else{ag=0;ah=af}if(ah>>>0<h>>>0){c[V>>2]=ah+1|0;ai=d[f+ah|0]|0}else{ai=0}c[U>>2]=33;c[X>>2]=-2147483648;c[aa>>2]=ai;c[ac>>2]=((((ae|Z<<8)>>>1&255|ab<<8)<<8|(ag|ae<<8)>>>1&255)<<8&2147483392|(ai|ag<<8)>>>1&255)^16777215;aj=n}else{aj=l}l=(v|0)==1;L1559:do{if(l&(y|0)>0){n=k+y|0;ag=0;while(1){ai=e+80+(ag+k<<2)|0;ak=+g[ai>>2];al=+g[e+80+(n+ag<<2)>>2];g[ai>>2]=ak>al?ak:al;ai=ag+1|0;if((ai|0)==(y|0)){break L1559}else{ag=ai}}}}while(0);ag=h<<3;n=aj+20|0;ai=c[n>>2]|0;ae=aj+28|0;ab=c[ae>>2]|0;Z=(dG(ab|0)|-32)+ai|0;do{if((Z|0)<(ag|0)){if((Z|0)!=1){am=Z;an=0;ao=ab;ap=ai;break}ac=aj+32|0;aa=c[ac>>2]|0;X=ab>>>15;U=aa>>>0<X>>>0;if(U){c[ae>>2]=X;aq=aa;ar=X}else{ah=aa-X|0;c[ac>>2]=ah;aa=ab-X|0;c[ae>>2]=aa;if(aa>>>0<8388609){aq=ah;ar=aa}else{am=1;an=0;ao=aa;ap=ai;break}}aa=aj+40|0;ah=aj+24|0;X=aj|0;f=c[aj+4>>2]|0;V=ai;af=ar;_=c[aa>>2]|0;ad=c[ah>>2]|0;as=aq;while(1){av=V+8|0;c[n>>2]=av;aw=af<<8;c[ae>>2]=aw;if(ad>>>0<f>>>0){ax=ad+1|0;c[ah>>2]=ax;ay=d[(c[X>>2]|0)+ad|0]|0;az=ax}else{ay=0;az=ad}c[aa>>2]=ay;ax=((ay|_<<8)>>>1&255|as<<8&2147483392)^255;c[ac>>2]=ax;if(aw>>>0<8388609){V=av;af=aw;_=ay;ad=az;as=ax}else{break}}if(U){aA=av;aB=aw;R=1064;break}else{am=1;an=0;ao=aw;ap=av;break}}else{aA=ai;aB=ab;R=1064}}while(0);if((R|0)==1064){R=((ag-aA|0)-(dG(aB|0)|-32)|0)+aA|0;c[n>>2]=R;am=ag;an=1;ao=aB;ap=R}R=e+20|0;do{if((c[R>>2]|0)==0){if((am+16|0)>(ag|0)){aC=0;aD=0;aE=am;aF=0.0;aG=ao;aH=ap;break}aB=aj+32|0;aA=c[aB>>2]|0;ab=ao>>>1;ai=aA>>>0<ab>>>0;if(ai){aI=ab;aJ=aA}else{av=aA-ab|0;c[aB>>2]=av;aI=ao-ab|0;aJ=av}c[ae>>2]=aI;L1586:do{if(aI>>>0<8388609){av=aj+40|0;ab=aj+24|0;aA=aj|0;aw=c[aj+4>>2]|0;az=ap;ay=aI;aq=c[av>>2]|0;ar=c[ab>>2]|0;Z=aJ;while(1){as=az+8|0;c[n>>2]=as;ad=ay<<8;c[ae>>2]=ad;if(ar>>>0<aw>>>0){_=ar+1|0;c[ab>>2]=_;aK=d[(c[aA>>2]|0)+ar|0]|0;aL=_}else{aK=0;aL=ar}c[av>>2]=aK;_=((aK|aq<<8)>>>1&255|Z<<8&2147483392)^255;c[aB>>2]=_;if(ad>>>0<8388609){az=as;ay=ad;aq=aK;ar=aL;Z=_}else{aM=as;aN=ad;break L1586}}}else{aM=ap;aN=aI}}while(0);if(ai){U=bt(aj,6)|0;Z=16<<U;ar=U+4|0;U=aj+12|0;aq=c[U>>2]|0;ay=aj+16|0;az=c[ay>>2]|0;if(az>>>0<ar>>>0){av=aj+8|0;aA=aj|0;ab=az+8|0;aw=((ab|0)>25?az+7|0:24)-az|0;ad=c[aj+4>>2]|0;as=aq;_=az;af=c[av>>2]|0;while(1){if(af>>>0<ad>>>0){V=af+1|0;c[av>>2]=V;aO=d[(c[aA>>2]|0)+(ad-V|0)|0]|0;aP=V}else{aO=0;aP=af}aQ=aO<<_|as;V=_+8|0;if((V|0)<25){as=aQ;_=V;af=aP}else{break}}aR=aQ;aS=ab+(aw&-8)|0}else{aR=aq;aS=az}af=aR>>>(ar>>>0);_=aS-ar|0;c[U>>2]=af;c[ay>>2]=_;as=(c[n>>2]|0)+ar|0;c[n>>2]=as;ad=(Z-1|0)+(aR&(1<<ar)-1)|0;if(_>>>0<3){aA=aj+8|0;av=aj|0;ai=_+8|0;V=((ai|0)>25?_+7|0:24)-_|0;ac=c[aj+4>>2]|0;aa=af;X=_;ah=c[aA>>2]|0;while(1){if(ah>>>0<ac>>>0){f=ah+1|0;c[aA>>2]=f;aT=d[(c[av>>2]|0)+(ac-f|0)|0]|0;aU=f}else{aT=0;aU=ah}aV=aT<<X|aa;f=X+8|0;if((f|0)<25){aa=aV;X=f;ah=aU}else{break}}aW=aV;aX=ai+(V&-8)|0}else{aW=af;aX=_}ah=aW&7;c[U>>2]=aW>>>3;c[ay>>2]=aX-3|0;X=as+3|0;c[n>>2]=X;aa=c[ae>>2]|0;L1614:do{if(((as+5|0)+(dG(aa|0)|-32)|0)>(ag|0)){aY=0;aZ=X;a_=aa}else{ac=c[aB>>2]|0;av=aa>>>2;aA=-1;ar=aa;while(1){a$=aA+1|0;a0=$(d[a$+5245320|0]|0,av);if(ac>>>0<a0>>>0){aA=a$;ar=a0}else{break}}aA=ac-a0|0;c[aB>>2]=aA;av=ar-a0|0;c[ae>>2]=av;if(av>>>0>=8388609){aY=a$;aZ=X;a_=av;break}Z=aj+40|0;az=aj+24|0;aq=aj|0;aw=c[aj+4>>2]|0;ab=X;f=av;av=c[Z>>2]|0;ax=c[az>>2]|0;a1=aA;while(1){aA=ab+8|0;c[n>>2]=aA;a2=f<<8;c[ae>>2]=a2;if(ax>>>0<aw>>>0){a3=ax+1|0;c[az>>2]=a3;a7=d[(c[aq>>2]|0)+ax|0]|0;a8=a3}else{a7=0;a8=ax}c[Z>>2]=a7;a3=((a7|av<<8)>>>1&255|a1<<8&2147483392)^255;c[aB>>2]=a3;if(a2>>>0<8388609){ab=aA;f=a2;av=a7;ax=a8;a1=a3}else{aY=a$;aZ=aA;a_=a2;break L1614}}}}while(0);a9=ad;ba=aY;bb=+(ah+1|0)*.09375;bc=aZ;bd=a_}else{a9=0;ba=0;bb=0.0;bc=aM;bd=aN}aC=a9;aD=ba;aE=(dG(bd|0)|-32)+bc|0;aF=bb;aG=bd;aH=bc}else{aC=0;aD=0;aE=am;aF=0.0;aG=ao;aH=ap}}while(0);ap=(P|0)>0;do{if(ap){if((aE+3|0)>(ag|0)){be=0;bg=aE;bh=aG;bi=aH;break}ao=aj+32|0;am=c[ao>>2]|0;bc=aG>>>3;bd=am>>>0<bc>>>0;ba=bd&1;if(bd){bj=bc;bk=am}else{bd=am-bc|0;c[ao>>2]=bd;bj=aG-bc|0;bk=bd}c[ae>>2]=bj;L1634:do{if(bj>>>0<8388609){bd=aj+40|0;bc=aj+24|0;am=aj|0;a9=c[aj+4>>2]|0;aN=aH;aM=bj;a_=c[bd>>2]|0;aZ=c[bc>>2]|0;aY=bk;while(1){a$=aN+8|0;c[n>>2]=a$;a8=aM<<8;c[ae>>2]=a8;if(aZ>>>0<a9>>>0){a7=aZ+1|0;c[bc>>2]=a7;bl=d[(c[am>>2]|0)+aZ|0]|0;bm=a7}else{bl=0;bm=aZ}c[bd>>2]=bl;a7=((bl|a_<<8)>>>1&255|aY<<8&2147483392)^255;c[ao>>2]=a7;if(a8>>>0<8388609){aN=a$;aM=a8;a_=bl;aZ=bm;aY=a7}else{bn=a$;bp=a8;break L1634}}}else{bn=aH;bp=bj}}while(0);be=ba;bg=(dG(bp|0)|-32)+bn|0;bh=bp;bi=bn}else{be=0;bg=aE;bh=aG;bi=aH}}while(0);aH=(be|0)!=0;aG=aH?O:0;L1643:do{if((bg+3|0)>(ag|0)){bq=0}else{aE=aj+32|0;bn=c[aE>>2]|0;bp=bh>>>3;bj=bn>>>0<bp>>>0;bm=bj&1;if(bj){br=bp;bs=bn}else{bj=bn-bp|0;c[aE>>2]=bj;br=bh-bp|0;bs=bj}c[ae>>2]=br;if(br>>>0>=8388609){bq=bm;break}bj=aj+40|0;bp=aj+24|0;bn=aj|0;bl=c[aj+4>>2]|0;bk=bi;ao=br;ah=c[bj>>2]|0;ad=c[bp>>2]|0;aY=bs;while(1){aZ=bk+8|0;c[n>>2]=aZ;a_=ao<<8;c[ae>>2]=a_;if(ad>>>0<bl>>>0){aM=ad+1|0;c[bp>>2]=aM;bu=d[(c[bn>>2]|0)+ad|0]|0;bv=aM}else{bu=0;bv=ad}c[bj>>2]=bu;aM=((bu|ah<<8)>>>1&255|aY<<8&2147483392)^255;c[aE>>2]=aM;if(a_>>>0<8388609){bk=aZ;ao=a_;ah=bu;ad=bv;aY=aM}else{bq=bm;break L1643}}}}while(0);bO(w,c[R>>2]|0,c[T>>2]|0,E,bq,aj,v,P);bq=at()|0;bv=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;bu=c[R>>2]|0;bs=c[T>>2]|0;br=aj+4|0;bi=c[br>>2]|0;bh=bi<<3;bg=c[n>>2]|0;bm=c[ae>>2]|0;aY=(dG(bm|0)|-32)+bg|0;ad=aH?2:4;if(ap){bw=(aY+(ad|1)|0)>>>0<=bh>>>0}else{bw=0}ap=bh-(bw&1)|0;bh=(bu|0)<(bs|0);L1658:do{if(bh){ah=aH?4:5;ao=aj+32|0;bk=aj+40|0;aE=aj+24|0;bj=aj|0;bn=0;bp=bu;bl=0;ba=ad;aM=aY;a_=bm;aZ=bg;while(1){if((ba+aM|0)>>>0>ap>>>0){bx=aM;by=bl;bz=bn;bA=a_;bB=aZ}else{aN=c[ao>>2]|0;bd=a_>>>(ba>>>0);am=aN>>>0<bd>>>0;bc=am&1;if(am){bC=bd;bD=aN}else{am=aN-bd|0;c[ao>>2]=am;bC=a_-bd|0;bD=am}c[ae>>2]=bC;L1667:do{if(bC>>>0<8388609){am=aZ;bd=bC;aN=c[bk>>2]|0;a9=c[aE>>2]|0;a8=bD;while(1){a$=am+8|0;c[n>>2]=a$;a7=bd<<8;c[ae>>2]=a7;if(a9>>>0<bi>>>0){a0=a9+1|0;c[aE>>2]=a0;bF=d[(c[bj>>2]|0)+a9|0]|0;bG=a0}else{bF=0;bG=a9}c[bk>>2]=bF;a0=((bF|aN<<8)>>>1&255|a8<<8&2147483392)^255;c[ao>>2]=a0;if(a7>>>0<8388609){am=a$;bd=a7;aN=bF;a9=bG;a8=a0}else{bH=a7;bI=a$;break L1667}}}else{bH=bC;bI=aZ}}while(0);a8=bc^bn;bx=(dG(bH|0)|-32)+bI|0;by=a8|bl;bz=a8;bA=bH;bB=bI}c[bv+(bp<<2)>>2]=bz;a8=bp+1|0;if((a8|0)==(bs|0)){bJ=by;bK=bA;bM=bB;break L1658}else{bn=bz;bp=a8;bl=by;ba=ah;aM=bx;a_=bA;aZ=bB}}}else{bJ=0;bK=bm;bM=bg}}while(0);do{if(bw){bg=be<<2;if((a[(bJ+bg|0)+(5245212+(P<<3))|0]|0)==(a[(bJ+(bg|2)|0)+(5245212+(P<<3))|0]|0)){bN=0;bR=bM;bS=bK;break}bg=aj+32|0;bm=c[bg>>2]|0;bB=bK>>>1;bA=bm>>>0<bB>>>0;bx=bA&1;if(bA){bT=bB;bU=bm}else{bA=bm-bB|0;c[bg>>2]=bA;bT=bK-bB|0;bU=bA}c[ae>>2]=bT;L1683:do{if(bT>>>0<8388609){bA=aj+40|0;bB=aj+24|0;bm=aj|0;by=bM;bz=bT;bI=c[bA>>2]|0;bH=c[bB>>2]|0;bC=bU;while(1){bG=by+8|0;c[n>>2]=bG;bF=bz<<8;c[ae>>2]=bF;if(bH>>>0<bi>>>0){bD=bH+1|0;c[bB>>2]=bD;bV=d[(c[bm>>2]|0)+bH|0]|0;bW=bD}else{bV=0;bW=bH}c[bA>>2]=bV;bD=((bV|bI<<8)>>>1&255|bC<<8&2147483392)^255;c[bg>>2]=bD;if(bF>>>0<8388609){by=bG;bz=bF;bI=bV;bH=bW;bC=bD}else{bX=bG;bY=bF;break L1683}}}else{bX=bM;bY=bT}}while(0);bN=bx<<1;bR=bX;bS=bY}else{bN=0;bR=bM;bS=bK}}while(0);L1692:do{if(bh){bK=bN+(be<<2)|0;bM=bu;while(1){bY=bv+(bM<<2)|0;c[bY>>2]=a[(bK+(c[bY>>2]|0)|0)+(5245212+(P<<3))|0]|0;bY=bM+1|0;if((bY|0)==(bs|0)){break L1692}else{bM=bY}}}}while(0);L1697:do{if(((bR+4|0)+(dG(bS|0)|-32)|0)>(ag|0)){bZ=2;b_=bR;b$=bS}else{bs=aj+32|0;bu=c[bs>>2]|0;be=bS>>>5;bN=-1;bh=bS;while(1){b0=bN+1|0;b1=$(d[b0+5246196|0]|0,be);if(bu>>>0<b1>>>0){bN=b0;bh=b1}else{break}}bN=bu-b1|0;c[bs>>2]=bN;be=bh-b1|0;c[ae>>2]=be;if(be>>>0>=8388609){bZ=b0;b_=bR;b$=be;break}bM=aj+40|0;bK=aj+24|0;bx=aj|0;bY=bR;bX=be;be=c[bM>>2]|0;bT=c[bK>>2]|0;bW=bN;while(1){bN=bY+8|0;c[n>>2]=bN;bV=bX<<8;c[ae>>2]=bV;if(bT>>>0<bi>>>0){bU=bT+1|0;c[bK>>2]=bU;b2=d[(c[bx>>2]|0)+bT|0]|0;b3=bU}else{b2=0;b3=bT}c[bM>>2]=b2;bU=((b2|be<<8)>>>1&255|bW<<8&2147483392)^255;c[bs>>2]=bU;if(bV>>>0<8388609){bY=bN;bX=bV;be=b2;bT=b3;bW=bU}else{bZ=b0;b_=bN;b$=bV;break L1697}}}}while(0);b0=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;b3=c[x>>2]|0;L1709:do{if((b3|0)>0){b2=(v-1|0)+(P<<1)|0;bR=c[B>>2]|0;b1=c[w+104>>2]|0;bS=0;bW=b[bR>>1]|0;while(1){bT=bS+1|0;be=b[bR+(bT<<1)>>1]|0;bX=(d[b1+($(b3,b2)+bS|0)|0]|0)+64|0;c[b0+(bS<<2)>>2]=$($((be<<16>>16)-(bW<<16>>16)<<P,v),bX)>>2;if((bT|0)<(b3|0)){bS=bT;bW=be}else{break L1709}}}}while(0);b3=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;B=h<<6;h=32-(dG(b$|0)|0)|0;bW=b$>>>((h-16|0)>>>0);bS=$(bW,bW);bW=bS>>>31;b2=bS>>>15>>>(bW>>>0);bS=$(b2,b2);b2=bS>>>31;b1=bS>>>15>>>(b2>>>0);bS=(b_<<3)-($(b1,b1)>>>31|(b2|(bW|h<<1)<<1)<<1)|0;h=aj+32|0;bW=aj+40|0;b2=aj+24|0;b1=aj|0;bR=c[R>>2]|0;be=6;bT=bS;bS=B;bX=b$;b$=b_;L1714:while(1){b_=be<<3;bY=bR;b4=bT;b5=bS;b6=bX;b7=b$;while(1){if((bY|0)>=(c[T>>2]|0)){break L1714}b8=bY+1|0;bs=$((b[C+(b8<<1)>>1]|0)-(b[C+(bY<<1)>>1]|0)|0,v)<<P;bM=bs<<3;bx=(bs|0)<48?48:bs;bs=(bM|0)<(bx|0)?bM:bx;if((b_+b4|0)>=(b5|0)){c[b3+(bY<<2)>>2]=0;bY=b8;b4=b4;b5=b5;b6=b6;b7=b7;continue}bx=c[b0+(bY<<2)>>2]|0;bM=b5;bK=b4;bh=be;bu=0;bV=b6;bN=b7;while(1){if((bu|0)>=(bx|0)){b9=bK;ca=bM;cb=bu;cc=bV;cd=bN;break}bU=c[h>>2]|0;bJ=bV>>>(bh>>>0);bw=bU>>>0<bJ>>>0;if(bw){ce=bJ;cf=bU}else{bg=bU-bJ|0;c[h>>2]=bg;ce=bV-bJ|0;cf=bg}c[ae>>2]=ce;L1728:do{if(ce>>>0<8388609){bg=bN;bJ=ce;bU=c[bW>>2]|0;bC=c[b2>>2]|0;bH=cf;while(1){bI=bg+8|0;c[n>>2]=bI;bz=bJ<<8;c[ae>>2]=bz;if(bC>>>0<bi>>>0){by=bC+1|0;c[b2>>2]=by;cg=d[(c[b1>>2]|0)+bC|0]|0;ch=by}else{cg=0;ch=bC}c[bW>>2]=cg;by=((cg|bU<<8)>>>1&255|bH<<8&2147483392)^255;c[h>>2]=by;if(bz>>>0<8388609){bg=bI;bJ=bz;bU=cg;bC=ch;bH=by}else{ci=bI;cj=bz;break L1728}}}else{ci=bN;cj=ce}}while(0);bH=32-(dG(cj|0)|0)|0;bC=cj>>>((bH-16|0)>>>0);bU=$(bC,bC);bC=bU>>>31;bJ=bU>>>15>>>(bC>>>0);bU=$(bJ,bJ);bJ=bU>>>31;bg=bU>>>15>>>(bJ>>>0);bU=(ci<<3)-($(bg,bg)>>>31|(bJ|(bC|bH<<1)<<1)<<1)|0;if(!bw){b9=bU;ca=bM;cb=bu;cc=cj;cd=ci;break}bH=bu+bs|0;bC=bM-bs|0;if((bU+8|0)<(bC|0)){bM=bC;bK=bU;bh=1;bu=bH;bV=cj;bN=ci}else{b9=bU;ca=bC;cb=bH;cc=cj;cd=ci;break}}c[b3+(bY<<2)>>2]=cb;if((cb|0)>0){break}else{bY=b8;b4=b9;b5=ca;b6=cc;b7=cd}}bY=be-1|0;bR=b8;be=(bY|0)<2?2:bY;bT=b9;bS=ca;bX=cc;b$=cd}cd=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;L1740:do{if((b4+48|0)>(b5|0)){ck=5;cl=b7;cm=b6}else{b$=c[h>>2]|0;cc=b6>>>7;bX=-1;ca=b6;while(1){cn=bX+1|0;co=$(d[cn+5245048|0]|0,cc);if(b$>>>0<co>>>0){bX=cn;ca=co}else{break}}bX=b$-co|0;c[h>>2]=bX;cc=ca-co|0;c[ae>>2]=cc;if(cc>>>0>=8388609){ck=cn;cl=b7;cm=cc;break}bS=b7;b9=cc;cc=c[bW>>2]|0;bT=c[b2>>2]|0;be=bX;while(1){bX=bS+8|0;c[n>>2]=bX;b8=b9<<8;c[ae>>2]=b8;if(bT>>>0<bi>>>0){bR=bT+1|0;c[b2>>2]=bR;cp=d[(c[b1>>2]|0)+bT|0]|0;cq=bR}else{cp=0;cq=bT}c[bW>>2]=cp;bR=((cp|cc<<8)>>>1&255|be<<8&2147483392)^255;c[h>>2]=bR;if(b8>>>0<8388609){bS=bX;b9=b8;cc=cp;bT=cq;be=bR}else{ck=cn;cl=bX;cm=b8;break L1740}}}}while(0);cn=32-(dG(cm|0)|0)|0;cq=cm>>>((cn-16|0)>>>0);cm=$(cq,cq);cq=cm>>>31;cp=cm>>>15>>>(cq>>>0);cm=$(cp,cp);cp=cm>>>31;h=cm>>>15>>>(cp>>>0);cm=((B-1|0)-(cl<<3)|0)+($(h,h)>>>31|(cp|(cq|cn<<1)<<1)<<1)|0;if(aH&(P|0)>1){cr=(cm|0)>=((P<<3)+16|0)}else{cr=0}cn=cr?8:0;cq=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;cp=i;i=i+(y*4&-1)|0;i=i+3>>2<<2;h=bQ(w,c[R>>2]|0,c[T>>2]|0,b3,b0,ck,r,s,cm-cn|0,t,cq,cd,cp,v,P,aj,0,0,0)|0;bL(w,c[R>>2]|0,c[T>>2]|0,E,cd,aj,v);cm=$(y,v);ck=i;i=i+cm|0;i=i+3>>2<<2;b0=$(S,v);b3=i;i=i+(b0*4&-1)|0;i=i+3>>2<<2;b0=(v|0)==2;if(b0){cs=b3+(S<<2)|0}else{cs=0}cl=e+32|0;a6(0,w,c[R>>2]|0,c[T>>2]|0,b3,cs,ck,0,cq,aG,bZ,c[s>>2]|0,c[r>>2]|0,bv,B-cn|0,c[t>>2]|0,aj,P,h,cl);do{if(cr){h=aj+12|0;t=c[h>>2]|0;cn=aj+16|0;B=c[cn>>2]|0;if((B|0)==0){bv=aj+8|0;r=c[bv>>2]|0;s=c[br>>2]|0;if(r>>>0<s>>>0){bZ=r+1|0;c[bv>>2]=bZ;ct=d[(c[b1>>2]|0)+(s-bZ|0)|0]|0;cu=bZ}else{ct=0;cu=r}if(cu>>>0<s>>>0){r=cu+1|0;c[bv>>2]=r;cv=(d[(c[b1>>2]|0)+(s-r|0)|0]|0)<<8;cw=r}else{cv=0;cw=cu}if(cw>>>0<s>>>0){r=cw+1|0;c[bv>>2]=r;cx=(d[(c[b1>>2]|0)+(s-r|0)|0]|0)<<16;cy=r}else{cx=0;cy=cw}if(cy>>>0<s>>>0){r=cy+1|0;c[bv>>2]=r;cz=(d[(c[b1>>2]|0)+(s-r|0)|0]|0)<<24}else{cz=0}cA=cz|(cx|(cv|(ct|t)));cB=32}else{cA=t;cB=B}c[h>>2]=cA>>>1;c[cn>>2]=cB-1|0;cn=c[n>>2]|0;c[n>>2]=cn+1|0;h=c[R>>2]|0;B=c[T>>2]|0;bP(w,h,B,E,cd,cp,(ag+(cn^-1)|0)-(dG(c[ae>>2]|0)|-32)|0,aj,v);if((cA&1|0)==0){break}a5(w,b3,ck,P,v,S,c[R>>2]|0,c[T>>2]|0,E,I,K,cq,c[cl>>2]|0)}else{cn=c[R>>2]|0;B=c[T>>2]|0;h=c[n>>2]|0;bP(w,cn,B,E,cd,cp,(ag-h|0)-(dG(c[ae>>2]|0)|-32)|0,aj,v)}}while(0);cp=i;i=i+(cm*4&-1)|0;i=i+3>>2<<2;cd=cp;E=c[R>>2]|0;cq=c[T>>2]|0;K=(E|0)>0;I=c[x>>2]|0;x=E<<2;ck=0;while(1){if(K){dF(cd+$(I,ck<<2)|0,0,x|0);cC=E}else{cC=0}L1783:do{if((cC|0)<(cq|0)){cA=$(I,ck);cB=cC;while(1){ct=cA+cB|0;g[cp+(ct<<2)>>2]=+Y(+((+g[e+80+(ct+k<<2)>>2]+ +g[5259564+(cB<<2)>>2])*.6931471805599453));ct=cB+1|0;if((ct|0)==(cq|0)){cD=cq;break L1783}else{cB=ct}}}else{cD=cC}}while(0);L1788:do{if((cD|0)<(I|0)){cB=cD;while(1){g[cp+($(I,ck)+cB<<2)>>2]=0.0;cA=cB+1|0;if((cA|0)<(I|0)){cB=cA}else{break L1788}}}}while(0);cB=ck+1|0;if((cB|0)<(v|0)){ck=cB}else{break}}if(an&(cm|0)>0){dF(cd|0,0,cm<<2|0);cd=0;while(1){g[e+80+(cd+k<<2)>>2]=-28.0;an=cd+1|0;if((an|0)==(cm|0)){break}else{cd=an}}cE=c[R>>2]|0}else{cE=E}E=$(S,(u|0)>(v|0)?u:v);cd=i;i=i+(E*4&-1)|0;i=i+3>>2<<2;a4(w,b3,cd,cp,cE,W,v,O);cE=(2048-S|0)+((A|0)/2&-1)<<2;cp=0;while(1){b3=c[p+(cp<<2)>>2]|0;dI(b3|0,b3+(S<<2)|0,cE|0);b3=cp+1|0;if((b3|0)<(u|0)){cp=b3}else{break}}cp=(b[C+(W<<1)>>1]|0)<<P;W=c[D>>2]|0;C=(W|0)==1;cE=0;while(1){p=$(S,cE);if(C){cF=cp}else{b3=(S|0)/(W|0)&-1;cF=(cp|0)<(b3|0)?cp:b3}if((cF|0)<(S|0)){dF(cd+(cF+p<<2)|0,0,S-cF<<2|0)}p=cE+1|0;if((p|0)<(v|0)){cE=p}else{break}}cE=1024-S|0;v=0;while(1){c[q+(v<<2)>>2]=(c[o+(v<<2)>>2]|0)+(cE<<2)|0;cF=v+1|0;if((cF|0)<(u|0)){v=cF}else{break}}L1814:do{if(l&(u|0)==2&(S|0)>0){v=0;while(1){g[cd+(v+S<<2)>>2]=+g[cd+(v<<2)>>2];cE=v+1|0;if((cE|0)==(S|0)){break L1814}else{v=cE}}}}while(0);L1818:do{if(b0&(u|0)==1&(S|0)>0){v=0;while(1){cE=cd+(v<<2)|0;g[cE>>2]=(+g[cE>>2]+ +g[cd+(v+S<<2)>>2])*.5;cE=v+1|0;if((cE|0)==(S|0)){break L1818}else{v=cE}}}}while(0);b0=c[z>>2]|0;z=c[M>>2]|0;if((aG|0)==0){cG=(c[N>>2]|0)-P|0;cH=z<<P;cI=1}else{cG=c[N>>2]|0;cH=z;cI=aG}aG=(cI|0)>0;z=w+64|0;N=$(cH,cI);v=w+60|0;cE=0;while(1){L1828:do{if(aG){o=$(N,cE);cF=c[q+(cE<<2)>>2]|0;cp=0;while(1){W=cF+($(cp,cH)<<2)|0;bE(z,cd+(cp+o<<2)|0,W,c[v>>2]|0,b0,cG,cI);W=cp+1|0;if((W|0)==(cI|0)){break L1828}else{cp=W}}}}while(0);cp=cE+1|0;if((cp|0)<(u|0)){cE=cp}else{break}}cE=e+48|0;cI=e+52|0;cG=e+60|0;b0=e+56|0;z=e+68|0;cH=e+64|0;N=(P|0)!=0;P=0;while(1){aG=c[cE>>2]|0;cp=(aG|0)>15?aG:15;c[cE>>2]=cp;aG=c[cI>>2]|0;o=(aG|0)>15?aG:15;c[cI>>2]=o;aG=c[q+(P<<2)>>2]|0;bf(aG,aG,o,cp,c[M>>2]|0,+g[cG>>2],+g[b0>>2],c[z>>2]|0,c[cH>>2]|0,c[v>>2]|0,A);if(N){cp=c[M>>2]|0;o=aG+(cp<<2)|0;bf(o,o,c[cE>>2]|0,aC,S-cp|0,+g[b0>>2],aF,c[cH>>2]|0,aD,c[v>>2]|0,A)}cp=P+1|0;if((cp|0)<(u|0)){P=cp}else{break}}c[cI>>2]=c[cE>>2]|0;g[cG>>2]=+g[b0>>2];c[z>>2]=c[cH>>2]|0;c[cE>>2]=aC;g[b0>>2]=aF;c[cH>>2]=aD;if(N){c[cI>>2]=aC;g[cG>>2]=aF;c[z>>2]=aD}L1843:do{if(l&(y|0)>0){aD=k+y|0;z=0;while(1){g[e+80+(aD+z<<2)>>2]=+g[e+80+(z+k<<2)>>2];cG=z+1|0;if((cG|0)==(y|0)){break L1843}else{z=cG}}}}while(0);l=(F|0)>0;L1848:do{if(aH){if(!l){break}F=y<<1;z=0;while(1){aD=e+80+(z+H<<2)|0;aF=+g[aD>>2];bb=+g[e+80+(z+k<<2)>>2];g[aD>>2]=aF<bb?aF:bb;aD=z+1|0;if((aD|0)==(F|0)){break L1848}else{z=aD}}}else{if(!l){break}z=y<<1;F=0;while(1){g[e+80+(F+J<<2)>>2]=+g[e+80+(F+H<<2)>>2];aD=F+1|0;if((aD|0)==(z|0)){break}else{F=aD}}if(!l){break}F=y<<1;z=0;while(1){g[e+80+(z+H<<2)>>2]=+g[e+80+(z+k<<2)>>2];aD=z+1|0;if((aD|0)==(F|0)){break}else{z=aD}}if(!l){break}bb=+(O|0)*.0010000000474974513;z=y<<1;F=0;while(1){aD=e+80+(L+F<<2)|0;aF=bb+ +g[aD>>2];al=+g[e+80+(F+k<<2)>>2];g[aD>>2]=aF<al?aF:al;aD=F+1|0;if((aD|0)==(z|0)){break L1848}else{F=aD}}}}while(0);L=c[R>>2]|0;L1866:do{if((L|0)>0){O=0;while(1){g[e+80+(O+k<<2)>>2]=0.0;g[e+80+(O+J<<2)>>2]=-28.0;g[e+80+(O+H<<2)>>2]=-28.0;l=O+1|0;aH=c[R>>2]|0;if((l|0)<(aH|0)){O=l}else{cJ=aH;break L1866}}}else{cJ=L}}while(0);L=c[T>>2]|0;if((L|0)<(y|0)){O=L;while(1){g[e+80+(O+k<<2)>>2]=0.0;g[e+80+(O+J<<2)>>2]=-28.0;g[e+80+(O+H<<2)>>2]=-28.0;L=O+1|0;if((L|0)==(y|0)){break}else{O=L}}cK=c[R>>2]|0}else{cK=cJ}L1875:do{if((cK|0)>0){cJ=0;while(1){O=cJ+y|0;g[e+80+(O+k<<2)>>2]=0.0;g[e+80+(O+J<<2)>>2]=-28.0;g[e+80+(O+H<<2)>>2]=-28.0;O=cJ+1|0;if((O|0)<(c[R>>2]|0)){cJ=O}else{break L1875}}}}while(0);R=c[T>>2]|0;L1879:do{if((R|0)<(y|0)){T=R;while(1){cK=T+y|0;g[e+80+(cK+k<<2)>>2]=0.0;g[e+80+(cK+J<<2)>>2]=-28.0;g[e+80+(cK+H<<2)>>2]=-28.0;cK=T+1|0;if((cK|0)==(y|0)){break L1879}else{T=cK}}}}while(0);c[cl>>2]=c[ae>>2]|0;cl=c[D>>2]|0;bb=+g[w+16>>2];w=(S|0)/(cl|0)&-1;y=(S|0)>0;H=(w|0)>0;J=0;while(1){k=e+72+(J<<2)|0;al=+g[k>>2];R=c[q+(J<<2)>>2]|0;L1885:do{if(y){T=0;aF=al;while(1){ak=aF+ +g[R+(T<<2)>>2];cL=bb*ak;g[cd+(T<<2)>>2]=ak;cK=T+1|0;if((cK|0)==(S|0)){cM=cL;break L1885}else{T=cK;aF=cL}}}else{cM=al}}while(0);g[k>>2]=cM;L1889:do{if(H){R=0;while(1){al=+g[cd+($(R,cl)<<2)>>2]*30517578125.0e-15;g[j+($(R,u)+J<<2)>>2]=al;T=R+1|0;if((T|0)==(w|0)){break L1889}else{R=T}}}}while(0);k=J+1|0;if((k|0)<(u|0)){J=k}else{break}}c[e+44>>2]=0;J=c[n>>2]|0;if(((dG(c[ae>>2]|0)|-32)+J|0)>(ag|0)){cN=-3}else{if((c[aj+44>>2]|0)!=0){c[e+36>>2]=1}cN=(G|0)/(c[D>>2]|0)&-1}au(bq|0);Q=cN;i=m;return Q|0}function bo(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Z=0.0,_=0,aa=0,ab=0,ac=0.0,ad=0,ae=0,af=0,ag=0.0,ah=0,ai=0,aj=0,ak=0,al=0.0,am=0,an=0,ao=0.0,ap=0,aq=0.0,ar=0,as=0,av=0.0,aw=0,ax=0.0,ay=0.0,az=0,aA=0,aB=0.0,aC=0.0,aD=0,aE=0.0,aF=0.0,aG=0,aH=0.0,aI=0.0,aJ=0.0,aK=0,aL=0,aM=0.0,aN=0,aO=0.0,aP=0,aQ=0.0;h=i;i=i+8408|0;j=h|0;k=h+8|0;l=h+16|0;m=h+20|0;n=h+4116|0;o=h+8212|0;p=h+8312|0;q=c[a+8>>2]|0;r=c[a>>2]|0;s=r+8|0;t=c[s>>2]|0;u=r+4|0;v=c[u>>2]|0;w=c[r+32>>2]|0;x=v+2048|0;y=2048-e|0;z=0;while(1){A=$(z,x);c[j+(z<<2)>>2]=a+80+(A<<2)|0;c[k+(z<<2)>>2]=a+80+(y+A<<2)|0;A=z+1|0;if((A|0)<(q|0)){z=A}else{break}}z=n;A=$(x,q);x=$(v+2072|0,q);B=a+44|0;C=c[B>>2]|0;D=c[a+20>>2]|0;E=c[a+16>>2]|0;F=(C|0)>4;if(F|(D|0)!=0){G=$(q,e);H=i;i=i+(G*4&-1)|0;i=i+3>>2<<2;I=c[a+24>>2]|0;J=c[r+12>>2]|0;K=(I|0)<(J|0)?I:J;J=(D|0)>(K|0)?D:K;K=at()|0;L=i;i=i+(G*4&-1)|0;i=i+3>>2<<2;G=$(t,q);M=i;i=i+(G*4&-1)|0;i=i+3>>2<<2;G=M;L1907:do{if(F){N=(D|0)>0;O=c[s>>2]|0;Q=t*6&-1;R=D<<2;S=0;while(1){if(N){dF(G+$(O,S<<2)|0,0,R|0);T=D}else{T=0}L1914:do{if((T|0)<(I|0)){U=$(O,S);V=T;while(1){W=U+V|0;g[M+(W<<2)>>2]=+Y(+((+g[a+80+((W+x|0)+Q<<2)>>2]+ +g[5259564+(V<<2)>>2])*.6931471805599453));W=V+1|0;if((W|0)==(I|0)){X=I;break L1914}else{V=W}}}else{X=T}}while(0);L1919:do{if((X|0)<(O|0)){V=X;while(1){g[M+($(O,S)+V<<2)>>2]=0.0;U=V+1|0;if((U|0)<(O|0)){V=U}else{break L1919}}}}while(0);V=S+1|0;if((V|0)<(q|0)){S=V}else{break L1907}}}else{Z=(C|0)==0?1.5:.5;S=(D|0)<(I|0);O=0;while(1){L1926:do{if(S){Q=$(O,t)+x|0;R=D;while(1){N=a+80+(Q+R<<2)|0;g[N>>2]=+g[N>>2]-Z;N=R+1|0;if((N|0)==(I|0)){break L1926}else{R=N}}}}while(0);R=O+1|0;if((R|0)<(q|0)){O=R}else{break}}O=(D|0)>0;S=c[s>>2]|0;R=D<<2;Q=0;while(1){if(O){dF(G+$(S,Q<<2)|0,0,R|0);_=D}else{_=0}L1937:do{if((_|0)<(I|0)){N=$(S,Q);V=_;while(1){U=N+V|0;g[M+(U<<2)>>2]=+Y(+((+g[a+80+(U+x<<2)>>2]+ +g[5259564+(V<<2)>>2])*.6931471805599453));U=V+1|0;if((U|0)==(I|0)){aa=I;break L1937}else{V=U}}}else{aa=_}}while(0);L1942:do{if((aa|0)<(S|0)){V=aa;while(1){g[M+($(S,Q)+V<<2)>>2]=0.0;N=V+1|0;if((N|0)<(S|0)){V=N}else{break L1942}}}}while(0);V=Q+1|0;if((V|0)<(q|0)){Q=V}else{break L1907}}}}while(0);aa=a+32|0;_=c[aa>>2]|0;L1947:do{if((q|0)>0){I=(D|0)<(J|0);x=_;G=0;while(1){L1951:do{if(I){s=$(G,e);t=x;X=D;while(1){T=b[w+(X<<1)>>1]|0;F=(T<<f)+s|0;Q=X+1|0;S=(b[w+(Q<<1)>>1]|0)-T<<f;T=(S|0)>0;L1955:do{if(T){R=0;O=t;while(1){ab=$(O,1664525)+1013904223|0;g[L+(R+F<<2)>>2]=+(ab>>20|0);V=R+1|0;if((V|0)==(S|0)){break}else{R=V;O=ab}}O=L+(F<<2)|0;if(T){ac=1.0000000036274937e-15;ad=0;ae=O}else{af=ab;break}while(1){Z=+g[ae>>2];ag=ac+Z*Z;R=ad+1|0;if((R|0)==(S|0)){break}else{ac=ag;ad=R;ae=ae+4|0}}Z=1.0/+P(+ag);R=0;V=O;while(1){g[V>>2]=Z*+g[V>>2];N=R+1|0;if((N|0)==(S|0)){af=ab;break L1955}else{R=N;V=V+4|0}}}else{af=t}}while(0);if((Q|0)<(J|0)){t=af;X=Q}else{ah=af;break L1951}}}else{ah=x}}while(0);X=G+1|0;if((X|0)==(q|0)){ai=ah;break L1947}else{x=ah;G=X}}}else{ai=_}}while(0);c[aa>>2]=ai;a4(r,L,H,M,D,J,q,1<<f);D=(b[w+(J<<1)>>1]|0)<<f;J=(E|0)==1;w=0;while(1){M=$(w,e);if(J){aj=D}else{L=(e|0)/(E|0)&-1;aj=(D|0)<(L|0)?D:L}if((aj|0)<(e|0)){dF(H+(aj+M<<2)|0,0,e-aj<<2|0)}M=w+1|0;if((M|0)<(q|0)){w=M}else{break}}w=y+(v>>>1)<<2;aj=0;while(1){D=c[j+(aj<<2)>>2]|0;dI(D|0,D+(e<<2)|0,w|0);D=aj+1|0;if((D|0)<(q|0)){aj=D}else{break}}aj=c[u>>2]|0;u=c[r+44>>2]<<f;w=(c[r+36>>2]|0)-f|0;f=r+64|0;D=r+60|0;J=0;while(1){M=$(J,u);bE(f,H+(M<<2)|0,c[k+(J<<2)>>2]|0,c[D>>2]|0,aj,w,1);M=J+1|0;if((M|0)<(q|0)){J=M}else{break}}au(K|0);ak=H}else{H=i;i=i+(e*4&-1)|0;i=i+3>>2<<2;K=(C|0)==0;if(K){J=m|0;bF(j|0,J,2048,q);bG(m+1440|0,J,1328,620,l);J=720-(c[l>>2]|0)|0;c[l>>2]=J;c[a+40>>2]=J;al=1.0;am=J}else{J=c[a+40>>2]|0;c[l>>2]=J;al=.800000011920929;am=J}J=at()|0;l=i;i=i+(v*4&-1)|0;i=i+3>>2<<2;m=c[r+60>>2]|0;w=n|0;aj=o|0;D=am<<1;f=(D|0)<1024?D:1024;D=2047-f|0;u=1024-f|0;M=p|0;L=(f|0)>0;ai=f>>1;aa=y<<2;_=1024-am|0;ah=v+e|0;af=(ah|0)>0;ab=y-1|0;ae=(v|0)>0;ad=(e|0)>0;G=a+48|0;x=a+56|0;I=a+64|0;X=(v|0)/2&-1;t=(v|0)>1;s=v-1|0;S=(1024-e|0)+_|0;T=1024-ai|0;F=ah<<2;V=0;while(1){R=c[j+(V<<2)>>2]|0;dH(z|0,R+4096|0,4096);L1989:do{if(K){bI(w,aj,m,v,24,1024);g[aj>>2]=+g[aj>>2]*1.000100016593933;O=1;while(1){N=o+(O<<2)|0;ag=+g[N>>2];ac=+(O|0);g[N>>2]=ag-ac*ac*ag*6400000711437315.0e-20;N=O+1|0;if((N|0)==25){break}else{O=N}}O=(V*24&-1)+A|0;ag=+g[aj>>2];dF(a+80+(O<<2)|0,0,96);if(ag==0.0){an=0;break}N=O-1|0;ac=ag*.0010000000474974513;Z=ag;U=0;while(1){if((U|0)>=24){an=0;break L1989}L1998:do{if((U|0)>0){ag=0.0;W=0;while(1){ao=ag+ +g[a+80+(W+O<<2)>>2]*+g[o+(U-W<<2)>>2];ap=W+1|0;if((ap|0)==(U|0)){aq=ao;break L1998}else{ag=ao;W=ap}}}else{aq=0.0}}while(0);W=U+1|0;ag=(aq+ +g[o+(W<<2)>>2])/Z;ao=-0.0-ag;g[a+80+(U+O<<2)>>2]=ao;Q=W>>1;L2002:do{if((Q|0)>0){ap=N+U|0;ar=0;while(1){as=a+80+(ar+O<<2)|0;av=+g[as>>2];aw=a+80+(ap-ar<<2)|0;ax=+g[aw>>2];g[as>>2]=av+ax*ao;g[aw>>2]=ax+av*ao;aw=ar+1|0;if((aw|0)==(Q|0)){break L2002}else{ar=aw}}}}while(0);ao=Z-Z*ag*ag;if(ao<ac){an=0;break L1989}else{Z=ao;U=W}}}else{an=0}}while(0);while(1){g[p+(an<<2)>>2]=+g[R+(D-an<<2)>>2];U=an+1|0;if((U|0)==24){break}else{an=U}}U=(V*24&-1)+A|0;L2010:do{if(L){O=0;while(1){N=n+(u+O<<2)|0;Z=+g[N>>2];Q=0;ac=Z;while(1){ay=ac+ +g[a+80+(Q+U<<2)>>2]*+g[p+(Q<<2)>>2];ar=Q+1|0;if((ar|0)==24){az=24;aA=23;break}else{Q=ar;ac=ay}}while(1){g[p+(aA<<2)>>2]=+g[p+(az-2<<2)>>2];Q=aA-1|0;if((Q|0)>0){az=aA;aA=Q}else{break}}g[M>>2]=Z;g[N>>2]=ay;Q=O+1|0;if((Q|0)==(f|0)){break}else{O=Q}}if(L){aB=1.0;aC=1.0;aD=0}else{aE=1.0;aF=1.0;break}while(1){ac=+g[n+(T+aD<<2)>>2];ag=aB+ac*ac;ac=+g[n+(u+aD<<2)>>2];ao=aC+ac*ac;O=aD+1|0;if((O|0)<(ai|0)){aB=ag;aC=ao;aD=O}else{aE=ag;aF=ao;break L2010}}}else{aE=1.0;aF=1.0}}while(0);ao=+P(+((aE<aF?aE:aF)/aF));dI(R|0,R+(e<<2)|0,aa|0);L2022:do{if(af){ag=0.0;ac=al*ao;O=0;Q=0;while(1){if((O|0)<(am|0)){aG=O;aH=ac}else{aG=O-am|0;aH=ao*ac}g[R+(Q+y<<2)>>2]=aH*+g[n+(aG+_<<2)>>2];av=+g[R+(S+aG<<2)>>2];ax=ag+av*av;W=Q+1|0;if((W|0)==(ah|0)){aI=ax;break L2022}else{ag=ax;ac=aH;O=aG+1|0;Q=W}}}else{aI=0.0}}while(0);Q=0;while(1){g[p+(Q<<2)>>2]=+g[R+(ab-Q<<2)>>2];O=Q+1|0;if((O|0)==24){break}else{Q=O}}Q=R+8192|0;L2033:do{if(af){O=0;while(1){W=R+(y+O<<2)|0;ar=0;ao=+g[W>>2];while(1){aJ=ao- +g[a+80+(ar+U<<2)>>2]*+g[p+(ar<<2)>>2];ap=ar+1|0;if((ap|0)==24){aK=24;aL=23;break}else{ar=ap;ao=aJ}}while(1){g[p+(aL<<2)>>2]=+g[p+(aK-2<<2)>>2];ar=aL-1|0;if((ar|0)>0){aK=aL;aL=ar}else{break}}g[M>>2]=aJ;g[W>>2]=aJ;ar=O+1|0;if((ar|0)==(ah|0)){break}else{O=ar}}if(af){aM=0.0;aN=0}else{aO=0.0;break}while(1){ao=+g[R+(aN+y<<2)>>2];Z=aM+ao*ao;O=aN+1|0;if((O|0)==(ah|0)){aO=Z;break L2033}else{aM=Z;aN=O}}}else{aO=0.0}}while(0);L2045:do{if(aI>aO*.20000000298023224){if(aI>=aO){break}Z=+P(+((aI+1.0)/(aO+1.0)));L2050:do{if(ae){ao=1.0-Z;U=0;while(1){O=R+(U+y<<2)|0;g[O>>2]=+g[O>>2]*(1.0-ao*+g[m+(U<<2)>>2]);O=U+1|0;if((O|0)==(v|0)){break L2050}else{U=O}}}}while(0);if(ad){aP=v}else{break}while(1){U=R+(aP+y<<2)|0;g[U>>2]=Z*+g[U>>2];U=aP+1|0;if((U|0)<(ah|0)){aP=U}else{break L2045}}}else{if(!af){break}dF(R+(y<<2)|0,0,F|0)}}while(0);U=c[G>>2]|0;Z=-0.0- +g[x>>2];W=c[I>>2]|0;bf(l,Q,U,U,v,Z,Z,W,W,0,0);L2058:do{if(t){W=0;U=0;while(1){O=s+U|0;g[R+(W+2048<<2)>>2]=+g[m+(W<<2)>>2]*+g[l+(O<<2)>>2]+ +g[m+(O<<2)>>2]*+g[l+(W<<2)>>2];O=W+1|0;ar=W^-1;if((O|0)<(X|0)){W=O;U=ar}else{break L2058}}}}while(0);R=V+1|0;if((R|0)<(q|0)){V=R}else{break}}au(J|0);ak=H}aO=+g[r+16>>2];r=(e|0)/(E|0)&-1;H=(e|0)>0;J=(r|0)>0;V=0;while(1){X=a+72+(V<<2)|0;aI=+g[X>>2];l=c[k+(V<<2)>>2]|0;L2066:do{if(H){m=0;aM=aI;while(1){aJ=aM+ +g[l+(m<<2)>>2];aH=aO*aJ;g[ak+(m<<2)>>2]=aJ;s=m+1|0;if((s|0)==(e|0)){aQ=aH;break L2066}else{m=s;aM=aH}}}else{aQ=aI}}while(0);g[X>>2]=aQ;L2070:do{if(J){l=0;while(1){aI=+g[ak+($(l,E)<<2)>>2]*30517578125.0e-15;g[d+($(l,q)+V<<2)>>2]=aI;m=l+1|0;if((m|0)==(r|0)){break L2070}else{l=m}}}}while(0);X=V+1|0;if((X|0)<(q|0)){V=X}else{break}}c[B>>2]=C+1|0;i=h;return}function bp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+4|0;f=e|0;c[f>>2]=d;L2076:do{if((b|0)==10016){d=c[f>>2]|0;c[f>>2]=d+4|0;c[a+28>>2]=c[d>>2]|0;h=1413;break}else if((b|0)==10010){d=c[f>>2]|0;c[f>>2]=d+4|0;j=c[d>>2]|0;if((j|0)<0){h=1414;break}if((j|0)>=(c[(c[a>>2]|0)+8>>2]|0)){h=1414;break}c[a+20>>2]=j;h=1413;break}else if((b|0)==4031){j=c[f>>2]|0;c[f>>2]=j+4|0;d=c[j>>2]|0;if((d|0)==0){h=1414;break}c[d>>2]=c[a+32>>2]|0;h=1413;break}else if((b|0)==10012){d=c[f>>2]|0;c[f>>2]=d+4|0;j=c[d>>2]|0;if((j|0)<1){h=1414;break}if((j|0)>(c[(c[a>>2]|0)+8>>2]|0)){h=1414;break}c[a+24>>2]=j;h=1413;break}else if((b|0)==10008){j=c[f>>2]|0;c[f>>2]=j+4|0;d=c[j>>2]|0;if((d-1|0)>>>0>1){h=1414;break}c[a+12>>2]=d;h=1413;break}else if((b|0)==10007){d=c[f>>2]|0;c[f>>2]=d+4|0;j=c[d>>2]|0;if((j|0)==0){h=1414;break}d=a+36|0;c[j>>2]=c[d>>2]|0;c[d>>2]=0;h=1413;break}else if((b|0)==4027){d=c[f>>2]|0;c[f>>2]=d+4|0;j=c[d>>2]|0;if((j|0)==0){h=1414;break}c[j>>2]=(c[a+4>>2]|0)/(c[a+16>>2]|0)&-1;h=1413;break}else if((b|0)==4028){j=c[a+8>>2]|0;d=$((c[a+4>>2]|0)+2072|0,j);k=a|0;l=c[k>>2]|0;m=c[l+8>>2]|0;n=m<<1;o=n+d|0;d=o+n|0;dF(a+32|0,0,((m<<5)+48|0)+$((c[l+4>>2]<<2)+8288|0,j)|0);if((n|0)>0){p=0}else{h=1413;break}while(1){g[a+80+(d+p<<2)>>2]=-28.0;g[a+80+(p+o<<2)>>2]=-28.0;n=p+1|0;if((n|0)<(c[(c[k>>2]|0)+8>>2]<<1|0)){p=n}else{h=1413;break L2076}}}else if((b|0)==4033){k=c[f>>2]|0;c[f>>2]=k+4|0;o=c[k>>2]|0;if((o|0)==0){h=1414;break}c[o>>2]=c[a+48>>2]|0;h=1413;break}else if((b|0)==10015){o=c[f>>2]|0;c[f>>2]=o+4|0;k=c[o>>2]|0;if((k|0)==0){h=1414;break}c[k>>2]=c[a>>2]|0;h=1413;break}else{q=-5;i=e;return q|0}}while(0);if((h|0)==1413){q=0;i=e;return q|0}else if((h|0)==1414){q=-1;i=e;return q|0}return 0}function bq(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;if((b|0)==2){g=c[a+4>>2]|0;h=(g|0)>-1?g:-g|0;if((h|0)==0){j=0}else{j=(h<<1)-1|0}k=j+(g>>>31)|0;g=c[a>>2]|0;j=((g|0)>-1?g:-g|0)+h|0;if((g|0)<0){l=(j<<1|1)+k|0}else{l=k}bx(e,l,j<<2);i=f;return}else if((b|0)==3){j=c[a+8>>2]|0;l=(j|0)>-1?j:-j|0;if((l|0)==0){m=0}else{m=(l<<1)-1|0}k=m+(j>>>31)|0;j=c[a+4>>2]|0;m=((j|0)>-1?j:-j|0)+l|0;if((j|0)<0){n=(m<<1|1)+k|0}else{n=k}if((m|0)==0){o=0}else{o=$((m<<1)-2|0,m)|1}k=o+n|0;n=c[a>>2]|0;o=((n|0)>-1?n:-n|0)+m|0;if((n|0)<0){n=o+1|0;p=($((n<<1)-2|0,n)|1)+k|0}else{p=k}bx(e,p,$(o<<2,o)|2);i=f;return}else if((b|0)==4){o=c[a+12>>2]|0;p=(o|0)>-1?o:-o|0;if((p|0)==0){q=0}else{q=(p<<1)-1|0}k=q+(o>>>31)|0;o=c[a+8>>2]|0;q=((o|0)>-1?o:-o|0)+p|0;if((o|0)<0){r=(q<<1|1)+k|0}else{r=k}if((q|0)==0){s=0}else{s=$((q<<1)-2|0,q)|1}k=s+r|0;r=c[a+4>>2]|0;s=((r|0)>-1?r:-r|0)+q|0;if((r|0)<0){r=s+1|0;t=($((r<<1)-2|0,r)|1)+k|0}else{t=k}if((s|0)==0){u=0}else{k=$((s<<1)-3|0,s)+4|0;u=$($(s,1431655766),k)-1|0}k=u+t|0;t=c[a>>2]|0;u=((t|0)>-1?t:-t|0)+s|0;if((t|0)<0){t=u+1|0;s=$((t<<1)-3|0,t)+4|0;v=(k-1|0)+$($(t,1431655766),s)|0}else{v=k}bx(e,v,($($(u,u)+2|0,u)>>>0)/3>>>0<<3);i=f;return}else{u=d+2|0;v=at()|0;k=i;i=i+(u*4&-1)|0;i=i+3>>2<<2;c[k>>2]=0;s=d+1|0;L2151:do{if((d|0)>=0){t=1;while(1){c[k+(t<<2)>>2]=(t<<1)-1|0;r=t+1|0;if((r|0)>(s|0)){break L2151}else{t=r}}}}while(0);d=c[a+(b-1<<2)>>2]|0;t=(d|0)>-1?d:-d|0;r=b-2|0;q=(d>>>31)+(c[k+(t<<2)>>2]|0)|0;d=c[a+(r<<2)>>2]|0;o=((d|0)>-1?d:-d|0)+t|0;if((d|0)<0){w=(c[k+(o+1<<2)>>2]|0)+q|0}else{w=q}L2158:do{if((r|0)>0){q=k+((u>>>0>2?s:1)<<2)|0;d=o;t=w;p=b-3|0;while(1){n=1;m=0;j=c[k>>2]|0;while(1){l=c[k+(n<<2)>>2]|0;x=(m+j|0)+l|0;c[k+(n-1<<2)>>2]=m;g=n+1|0;if(g>>>0<u>>>0){n=g;m=x;j=l}else{break}}c[q>>2]=x;j=(c[k+(d<<2)>>2]|0)+t|0;m=c[a+(p<<2)>>2]|0;n=((m|0)>-1?m:-m|0)+d|0;if((m|0)<0){y=(c[k+(n+1<<2)>>2]|0)+j|0}else{y=j}if((p|0)<=0){z=n;A=y;break L2158}d=n;t=y;p=p-1|0}}else{z=o;A=w}}while(0);bx(e,A,(c[k+(z+1<<2)>>2]|0)+(c[k+(z<<2)>>2]|0)|0);au(v|0);i=f;return}}function br(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=b+28|0;h=c[g>>2]|0;i=(h>>>0)/(f>>>0)>>>0;if((d|0)==0){j=h-$(i,f-e|0)|0}else{k=h-$(i,f-d|0)|0;f=b+32|0;c[f>>2]=k+(c[f>>2]|0)|0;j=$(i,e-d|0)}c[g>>2]=j;if(j>>>0>=8388609){return}d=b+32|0;e=b+20|0;i=b+36|0;f=b+40|0;k=b+24|0;h=b+8|0;l=b+4|0;m=b|0;n=b+44|0;b=c[d>>2]|0;o=j;while(1){j=b>>>23;if((j|0)==255){c[i>>2]=(c[i>>2]|0)+1|0;p=b;q=o}else{r=b>>>31;s=c[f>>2]|0;if((s|0)>-1){t=c[k>>2]|0;if(((c[h>>2]|0)+t|0)>>>0<(c[l>>2]|0)>>>0){c[k>>2]=t+1|0;a[(c[m>>2]|0)+t|0]=s+r&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u}s=c[i>>2]|0;L2189:do{if((s|0)!=0){t=r+255&255;v=s;while(1){w=c[k>>2]|0;if(((c[h>>2]|0)+w|0)>>>0<(c[l>>2]|0)>>>0){c[k>>2]=w+1|0;a[(c[m>>2]|0)+w|0]=t;x=0;y=c[i>>2]|0}else{x=-1;y=v}c[n>>2]=c[n>>2]|x;w=y-1|0;c[i>>2]=w;if((w|0)==0){break L2189}else{v=w}}}}while(0);c[f>>2]=j&255;p=c[d>>2]|0;q=c[g>>2]|0}s=p<<8&2147483392;c[d>>2]=s;r=q<<8;c[g>>2]=r;c[e>>2]=(c[e>>2]|0)+8|0;if(r>>>0<8388609){b=s;o=r}else{break}}return}function bs(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;f=i;if((b|0)==2){g=bt(e,d<<2)|0;h=d<<1|1;j=h>>>0<=g>>>0&1;k=-j|0;l=g-(h&k)|0;h=(l+1|0)>>>1;if((h|0)==0){m=0}else{m=(h<<1)-1|0}g=l-m|0;c[a>>2]=(d-j|0)-h^k;c[a+4>>2]=h-g^-g;i=f;return}else if((b|0)==3){g=bt(e,$(d<<2,d)|2)|0;h=d+1|0;k=$((h<<1)-2|0,h)|1;h=k>>>0<=g>>>0&1;j=-h|0;m=k&j;k=g-m|0;do{if((m|0)==(g|0)){n=0;o=0}else{l=(k<<1)-1|0;p=(dG(l|0)|0)>>>1^15;q=l;l=p;r=0;s=1<<p;while(1){p=(r<<1)+s<<l;if(p>>>0>q>>>0){t=q;u=r}else{t=q-p|0;u=r+s|0}if((l|0)>0){q=t;l=l-1|0;r=u;s=s>>>1}else{break}}s=(u+1|0)>>>1;if((s|0)==0){n=0;o=0;break}n=$((s<<1)-2|0,s)|1;o=s}}while(0);u=k-n|0;c[a>>2]=(d-h|0)-o^j;j=o<<1|1;h=j>>>0<=u>>>0&1;n=-h|0;k=u-(j&n)|0;j=(k+1|0)>>>1;if((j|0)==0){v=0}else{v=(j<<1)-1|0}u=k-v|0;c[a+4>>2]=(o-h|0)-j^n;c[a+8>>2]=j-u^-u;i=f;return}else if((b|0)==4){u=bt(e,($($(d,d)+2|0,d)>>>0)/3>>>0<<3)|0;j=d+1|0;n=$((j<<1)-3|0,j)+4|0;h=$($(j,1431655766),n)-1|0;n=h>>>0<=u>>>0&1;j=-n|0;o=u-(h&j)|0;h=d;u=0;L2249:while(1){v=h;while(1){w=v+u>>1;if((w|0)==0){x=0}else{k=$((w<<1)-3|0,w)+4|0;x=$($(w,1431655766),k)-1|0}if(x>>>0<o>>>0){break}if(x>>>0>o>>>0){v=w-1|0}else{y=1508;break L2249}}k=w+1|0;if((w|0)<(v|0)){h=v;u=k}else{z=k;break}}if((y|0)==1508){z=w+1|0}y=o-x|0;c[a>>2]=(d-n|0)-w^j;j=a+4|0;n=$((z<<1)-2|0,z)|1;z=n>>>0<=y>>>0&1;x=-z|0;o=n&x;n=y-o|0;do{if((o|0)==(y|0)){A=0;B=0}else{u=(n<<1)-1|0;h=(dG(u|0)|0)>>>1^15;k=u;u=h;t=0;g=1<<h;while(1){h=(t<<1)+g<<u;if(h>>>0>k>>>0){C=k;D=t}else{C=k-h|0;D=t+g|0}if((u|0)>0){k=C;u=u-1|0;t=D;g=g>>>1}else{break}}g=(D+1|0)>>>1;if((g|0)==0){A=0;B=0;break}A=$((g<<1)-2|0,g)|1;B=g}}while(0);D=n-A|0;c[j>>2]=(w-z|0)-B^x;x=B<<1|1;z=x>>>0<=D>>>0&1;w=-z|0;j=D-(x&w)|0;x=(j+1|0)>>>1;if((x|0)==0){E=0}else{E=(x<<1)-1|0}D=j-E|0;c[a+8>>2]=(B-z|0)-x^w;c[a+12>>2]=x-D^-D;i=f;return}else{D=d+2|0;x=at()|0;w=i;i=i+(D*4&-1)|0;i=i+3>>2<<2;c[w>>2]=0;z=w+4|0;c[z>>2]=1;L2203:do{if(b>>>0<7){B=2;while(1){c[w+(B<<2)>>2]=(B<<1)-1|0;E=B+1|0;if(E>>>0<D>>>0){B=E}else{break}}if(b>>>0<=2){break}B=d+1|0;E=w+((B>>>0>2?B:2)<<2)|0;j=2;while(1){A=1;n=1;C=c[z>>2]|0;while(1){y=A+1|0;o=c[w+(y<<2)>>2]|0;F=(n+C|0)+o|0;c[w+(A<<2)>>2]=n;if(y>>>0<B>>>0){A=y;n=F;C=o}else{break}}c[E>>2]=F;C=j+1|0;if((C|0)==(b|0)){break L2203}else{j=C}}}else{j=(b<<1)-1|0;c[w+8>>2]=j;if(D>>>0>3){G=3;H=j;I=1}else{break}while(1){E=G-2|0;B=32-(dG(E^G-1|0)|0)|0;C=c[5263112+(E>>B<<2)>>2]|0;E=B-1|0;B=1<<E;n=B-1|0;A=$(H>>>(E>>>0),j);o=$((A+(I>>>(E>>>0)^-1)|0)+(((B-(n&I)|0)+$(n&H,j)|0)>>>(E>>>0))|0,C)+I|0;c[w+(G<<2)>>2]=o;C=G+1|0;if(C>>>0>=D>>>0){break L2203}E=$(o,j)-H|0;n=$(c[5263112+(G>>>1<<2)>>2]|0,E)+H|0;c[w+(C<<2)>>2]=n;C=G+2|0;if(C>>>0<D>>>0){G=C;H=n;I=o}else{break L2203}}}}while(0);I=d;H=0;G=bt(e,(c[w+(d+1<<2)>>2]|0)+(c[w+(d<<2)>>2]|0)|0)|0;while(1){d=c[w+(I+1<<2)>>2]|0;e=G>>>0>=d>>>0&1;D=-e|0;F=G-(d&D)|0;d=I;while(1){J=c[w+(d<<2)>>2]|0;if(J>>>0>F>>>0){d=d-1|0}else{break}}c[a+(H<<2)>>2]=(I-e|0)-d^D;z=d+2|0;j=1;o=0;n=c[w>>2]|0;while(1){C=c[w+(j<<2)>>2]|0;K=(C-n|0)-o|0;c[w+(j-1<<2)>>2]=o;E=j+1|0;if(E>>>0<z>>>0){j=E;o=K;n=C}else{break}}c[w+((z>>>0>2?d+1|0:1)<<2)>>2]=K;n=H+1|0;if((n|0)<(b|0)){I=d;H=n;G=F-J|0}else{break}}au(x|0);i=f;return}}function bt(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=b-1|0;f=32-(dG(e|0)|0)|0;if(f>>>0<=8){g=a+28|0;h=c[g>>2]|0;i=(h>>>0)/(b>>>0)>>>0;c[a+36>>2]=i;j=a+32|0;k=c[j>>2]|0;l=(k>>>0)/(i>>>0)>>>0;m=l+1|0;n=b-m&-(m>>>0>b>>>0&1);m=(l^-1)+b|0;b=m-n|0;l=$(e-b|0,i);o=k-l|0;c[j>>2]=o;k=(m|0)==(n|0)?h-l|0:i;c[g>>2]=k;if(k>>>0>=8388609){p=b;return p|0}i=a+20|0;l=a+40|0;h=a+24|0;n=a|0;m=c[a+4>>2]|0;q=c[i>>2]|0;r=k;k=c[l>>2]|0;s=c[h>>2]|0;t=o;while(1){o=q+8|0;c[i>>2]=o;u=r<<8;c[g>>2]=u;if(s>>>0<m>>>0){v=s+1|0;c[h>>2]=v;w=d[(c[n>>2]|0)+s|0]|0;x=v}else{w=0;x=s}c[l>>2]=w;v=((w|k<<8)>>>1&255|t<<8&2147483392)^255;c[j>>2]=v;if(u>>>0<8388609){q=o;r=u;k=w;s=x;t=v}else{p=b;break}}return p|0}b=f-8|0;f=e>>>(b>>>0);t=f+1|0;x=a+28|0;s=c[x>>2]|0;w=(s>>>0)/(t>>>0)>>>0;c[a+36>>2]=w;k=a+32|0;r=c[k>>2]|0;q=(r>>>0)/(w>>>0)>>>0;j=q+1|0;l=t-j&-(j>>>0>t>>>0&1);j=t+(q^-1)|0;q=j-l|0;t=$(f-q|0,w);f=r-t|0;c[k>>2]=f;r=(j|0)==(l|0)?s-t|0:w;c[x>>2]=r;L2288:do{if(r>>>0<8388609){w=a+20|0;t=a+40|0;s=a+24|0;l=a|0;j=c[a+4>>2]|0;n=c[w>>2]|0;h=r;m=c[t>>2]|0;g=c[s>>2]|0;i=f;while(1){v=n+8|0;c[w>>2]=v;u=h<<8;c[x>>2]=u;if(g>>>0<j>>>0){o=g+1|0;c[s>>2]=o;y=d[(c[l>>2]|0)+g|0]|0;z=o}else{y=0;z=g}c[t>>2]=y;o=((y|m<<8)>>>1&255|i<<8&2147483392)^255;c[k>>2]=o;if(u>>>0<8388609){n=v;h=u;m=y;g=z;i=o}else{break L2288}}}}while(0);z=q<<b;q=a+12|0;y=c[q>>2]|0;k=a+16|0;x=c[k>>2]|0;if(x>>>0<b>>>0){f=a+8|0;r=a|0;i=x+8|0;g=((i|0)>25?x+7|0:24)-x|0;m=c[a+4>>2]|0;h=y;n=x;t=c[f>>2]|0;while(1){if(t>>>0<m>>>0){l=t+1|0;c[f>>2]=l;A=d[(c[r>>2]|0)+(m-l|0)|0]|0;B=l}else{A=0;B=t}C=A<<n|h;l=n+8|0;if((l|0)<25){h=C;n=l;t=B}else{break}}D=C;E=i+(g&-8)|0}else{D=y;E=x}c[q>>2]=D>>>(b>>>0);c[k>>2]=E-b|0;E=a+20|0;c[E>>2]=(c[E>>2]|0)+b|0;E=D&(1<<b)-1|z;if(E>>>0<=e>>>0){p=E;return p|0}c[a+44>>2]=1;p=e;return p|0}function bu(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=b+28|0;h=c[g>>2]|0;i=h>>>(f>>>0);j=1<<f;if((d|0)==0){k=h-$(i,j-e|0)|0}else{f=h-$(i,j-d|0)|0;j=b+32|0;c[j>>2]=f+(c[j>>2]|0)|0;k=$(i,e-d|0)}c[g>>2]=k;if(k>>>0>=8388609){return}d=b+32|0;e=b+20|0;i=b+36|0;j=b+40|0;f=b+24|0;h=b+8|0;l=b+4|0;m=b|0;n=b+44|0;b=c[d>>2]|0;o=k;while(1){k=b>>>23;if((k|0)==255){c[i>>2]=(c[i>>2]|0)+1|0;p=b;q=o}else{r=b>>>31;s=c[j>>2]|0;if((s|0)>-1){t=c[f>>2]|0;if(((c[h>>2]|0)+t|0)>>>0<(c[l>>2]|0)>>>0){c[f>>2]=t+1|0;a[(c[m>>2]|0)+t|0]=s+r&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u}s=c[i>>2]|0;L2328:do{if((s|0)!=0){t=r+255&255;v=s;while(1){w=c[f>>2]|0;if(((c[h>>2]|0)+w|0)>>>0<(c[l>>2]|0)>>>0){c[f>>2]=w+1|0;a[(c[m>>2]|0)+w|0]=t;x=0;y=c[i>>2]|0}else{x=-1;y=v}c[n>>2]=c[n>>2]|x;w=y-1|0;c[i>>2]=w;if((w|0)==0){break L2328}else{v=w}}}}while(0);c[j>>2]=k&255;p=c[d>>2]|0;q=c[g>>2]|0}s=p<<8&2147483392;c[d>>2]=s;r=q<<8;c[g>>2]=r;c[e>>2]=(c[e>>2]|0)+8|0;if(r>>>0<8388609){b=s;o=r}else{break}}return}function bv(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=b+28|0;g=c[f>>2]|0;h=b+32|0;i=g>>>(e>>>0);e=g-i|0;g=(d|0)!=0;if(g){c[h>>2]=(c[h>>2]|0)+e|0}d=g?i:e;c[f>>2]=d;if(d>>>0>=8388609){return}e=b+20|0;i=b+36|0;g=b+40|0;j=b+24|0;k=b+8|0;l=b+4|0;m=b|0;n=b+44|0;b=c[h>>2]|0;o=d;while(1){d=b>>>23;if((d|0)==255){c[i>>2]=(c[i>>2]|0)+1|0;p=b;q=o}else{r=b>>>31;s=c[g>>2]|0;if((s|0)>-1){t=c[j>>2]|0;if(((c[k>>2]|0)+t|0)>>>0<(c[l>>2]|0)>>>0){c[j>>2]=t+1|0;a[(c[m>>2]|0)+t|0]=s+r&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u}s=c[i>>2]|0;L2355:do{if((s|0)!=0){t=r+255&255;v=s;while(1){w=c[j>>2]|0;if(((c[k>>2]|0)+w|0)>>>0<(c[l>>2]|0)>>>0){c[j>>2]=w+1|0;a[(c[m>>2]|0)+w|0]=t;x=0;y=c[i>>2]|0}else{x=-1;y=v}c[n>>2]=c[n>>2]|x;w=y-1|0;c[i>>2]=w;if((w|0)==0){break L2355}else{v=w}}}}while(0);c[g>>2]=d&255;p=c[h>>2]|0;q=c[f>>2]|0}s=p<<8&2147483392;c[h>>2]=s;r=q<<8;c[f>>2]=r;c[e>>2]=(c[e>>2]|0)+8|0;if(r>>>0<8388609){b=s;o=r}else{break}}return}function bw(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;h=b+28|0;i=c[h>>2]|0;j=i>>>(g>>>0);if((e|0)>0){g=f+(e-1|0)|0;k=$(d[g]|0,j);l=b+32|0;c[l>>2]=((c[l>>2]|0)+i|0)-k|0;m=$((d[g]|0)-(d[f+e|0]|0)|0,j)}else{m=i-$(d[f+e|0]|0,j)|0}c[h>>2]=m;if(m>>>0>=8388609){return}j=b+32|0;e=b+20|0;f=b+36|0;i=b+40|0;g=b+24|0;k=b+8|0;l=b+4|0;n=b|0;o=b+44|0;b=c[j>>2]|0;p=m;while(1){m=b>>>23;if((m|0)==255){c[f>>2]=(c[f>>2]|0)+1|0;q=b;r=p}else{s=b>>>31;t=c[i>>2]|0;if((t|0)>-1){u=c[g>>2]|0;if(((c[k>>2]|0)+u|0)>>>0<(c[l>>2]|0)>>>0){c[g>>2]=u+1|0;a[(c[n>>2]|0)+u|0]=t+s&255;v=0}else{v=-1}c[o>>2]=c[o>>2]|v}t=c[f>>2]|0;L2384:do{if((t|0)!=0){u=s+255&255;w=t;while(1){x=c[g>>2]|0;if(((c[k>>2]|0)+x|0)>>>0<(c[l>>2]|0)>>>0){c[g>>2]=x+1|0;a[(c[n>>2]|0)+x|0]=u;y=0;z=c[f>>2]|0}else{y=-1;z=w}c[o>>2]=c[o>>2]|y;x=z-1|0;c[f>>2]=x;if((x|0)==0){break L2384}else{w=x}}}}while(0);c[i>>2]=m&255;q=c[j>>2]|0;r=c[h>>2]|0}t=q<<8&2147483392;c[j>>2]=t;s=r<<8;c[h>>2]=s;c[e>>2]=(c[e>>2]|0)+8|0;if(s>>>0<8388609){b=t;p=s}else{break}}return}function bx(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=e-1|0;g=32-(dG(f|0)|0)|0;if(g>>>0<=8){br(b,d,d+1|0,e);return}e=g-8|0;g=d>>>(e>>>0);br(b,g,g+1|0,(f>>>(e>>>0))+1|0);f=(1<<e)-1&d;d=b+12|0;g=c[d>>2]|0;h=b+16|0;i=c[h>>2]|0;if((i+e|0)>>>0>32){j=b+24|0;k=b+8|0;l=b+4|0;m=b|0;n=b+44|0;o=7-i|0;p=((o|0)>-8?o:-8)+i|0;o=i;q=g;while(1){r=c[k>>2]|0;s=c[l>>2]|0;if((r+(c[j>>2]|0)|0)>>>0<s>>>0){t=r+1|0;c[k>>2]=t;a[(c[m>>2]|0)+(s-t|0)|0]=q&255;u=0}else{u=-1}c[n>>2]=c[n>>2]|u;v=q>>>8;t=o-8|0;if((t|0)>7){o=t;q=v}else{break}}w=(i-8|0)-(p&-8)|0;x=v}else{w=i;x=g}c[d>>2]=f<<w|x;c[h>>2]=w+e|0;w=b+20|0;c[w>>2]=(c[w>>2]|0)+e|0;return}function by(b){b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;e=c[b+28>>2]|0;f=dG(e|0)|0;g=2147483647>>>(f>>>0);h=c[b+32>>2]|0;i=h+g&(g^-1);do{if((i|g)>>>0<(h+e|0)>>>0){if((f|0)!=0){j=i;k=f;l=1643;break}m=f;n=b+40|0;break}else{o=g>>>1;j=o+h&(o^-1);k=f+1|0;l=1643;break}}while(0);if((l|0)==1643){f=b+36|0;h=b+40|0;g=b+24|0;i=b+8|0;e=b+4|0;o=b|0;p=b+44|0;q=k-1&-8;r=j;j=k;while(1){s=r>>>23;if((s|0)==255){c[f>>2]=(c[f>>2]|0)+1|0}else{t=r>>>31;u=c[h>>2]|0;if((u|0)>-1){v=c[g>>2]|0;if(((c[i>>2]|0)+v|0)>>>0<(c[e>>2]|0)>>>0){c[g>>2]=v+1|0;a[(c[o>>2]|0)+v|0]=u+t&255;w=0}else{w=-1}c[p>>2]=c[p>>2]|w}u=c[f>>2]|0;L2428:do{if((u|0)!=0){v=t+255&255;x=u;while(1){y=c[g>>2]|0;if(((c[i>>2]|0)+y|0)>>>0<(c[e>>2]|0)>>>0){c[g>>2]=y+1|0;a[(c[o>>2]|0)+y|0]=v;z=0;A=c[f>>2]|0}else{z=-1;A=x}c[p>>2]=c[p>>2]|z;y=A-1|0;c[f>>2]=y;if((y|0)==0){break L2428}else{x=y}}}}while(0);c[h>>2]=s&255}u=j-8|0;if((u|0)>0){r=r<<8&2147483392;j=u}else{break}}m=(k-8|0)-q|0;n=h}h=c[n>>2]|0;do{if((h|0)>-1){q=b+24|0;k=c[q>>2]|0;if(((c[b+8>>2]|0)+k|0)>>>0<(c[b+4>>2]|0)>>>0){c[q>>2]=k+1|0;a[(c[b>>2]|0)+k|0]=h&255;B=0}else{B=-1}k=b+44|0;c[k>>2]=c[k>>2]|B;k=c[b+36>>2]|0;if((k|0)==0){l=1668;break}else{C=k;l=1664;break}}else{k=c[b+36>>2]|0;if((k|0)==0){break}C=k;l=1664;break}}while(0);L2446:do{if((l|0)==1664){B=b+36|0;h=b+24|0;k=b+8|0;q=b+4|0;j=b|0;r=b+44|0;f=C;while(1){A=c[h>>2]|0;if(((c[k>>2]|0)+A|0)>>>0<(c[q>>2]|0)>>>0){c[h>>2]=A+1|0;a[(c[j>>2]|0)+A|0]=-1;D=0;E=c[B>>2]|0}else{D=-1;E=f}c[r>>2]=c[r>>2]|D;A=E-1|0;c[B>>2]=A;if((A|0)==0){l=1668;break L2446}else{f=A}}}}while(0);if((l|0)==1668){c[n>>2]=0}n=c[b+12>>2]|0;l=c[b+16>>2]|0;if((l|0)>7){E=b+24|0;D=b+8|0;C=b+4|0;f=b|0;B=b+44|0;r=n;j=l;while(1){h=c[D>>2]|0;q=c[C>>2]|0;if((h+(c[E>>2]|0)|0)>>>0<q>>>0){k=h+1|0;c[D>>2]=k;a[(c[f>>2]|0)+(q-k|0)|0]=r&255;F=0}else{F=-1}G=c[B>>2]|F;c[B>>2]=G;H=r>>>8;k=j-8|0;if((k|0)>7){r=H;j=k}else{break}}I=H;J=l&7;K=G}else{I=n;J=l;K=c[b+44>>2]|0}l=b+44|0;if((K|0)!=0){return}K=b|0;n=b+24|0;G=c[n>>2]|0;H=b+4|0;j=b+8|0;dF((c[K>>2]|0)+G|0,0,((c[H>>2]|0)-G|0)-(c[j>>2]|0)|0);if((J|0)<=0){return}G=c[j>>2]|0;j=c[H>>2]|0;if(G>>>0>=j>>>0){c[l>>2]=-1;return}H=-m|0;if(((c[n>>2]|0)+G|0)>>>0>=j>>>0&(J|0)>(H|0)){c[l>>2]=-1;L=I&(1<<H)-1}else{L=I}I=(c[K>>2]|0)+((j-1|0)-G|0)|0;a[I]=(d[I]|0|L)&255;return}function bz(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0,J=0,K=0.0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0.0,W=0.0,X=0,Y=0.0,Z=0.0,_=0,aa=0,ab=0.0,ac=0.0,ad=0,ae=0,af=0.0,ag=0.0;f=i;i=i+32|0;h=f|0;j=c[a+8>>2]|0;k=(j|0)>0?j:0;j=a|0;L2481:do{if((c[j>>2]|0)>0){l=a+44|0;m=a+4|0;n=0;while(1){o=d+(n<<3)|0;p=e+((b[(c[l>>2]|0)+(n<<1)>>1]|0)<<3)|0;q=c[o+4>>2]|0;c[p>>2]=c[o>>2]|0;c[p+4>>2]=q;q=e+((b[(c[l>>2]|0)+(n<<1)>>1]|0)<<3)|0;g[q>>2]=+g[m>>2]*+g[q>>2];q=e+((b[(c[l>>2]|0)+(n<<1)>>1]|0)<<3)+4|0;g[q>>2]=+g[m>>2]*+g[q>>2];q=n+1|0;if((q|0)<(c[j>>2]|0)){n=q}else{break L2481}}}}while(0);c[h>>2]=1;j=0;d=1;while(1){n=j<<1;m=b[a+12+((n|1)<<1)>>1]|0;l=$(d,b[a+12+(n<<1)>>1]|0);r=j+1|0;c[h+(r<<2)>>2]=l;if(m<<16>>16==1){break}else{j=r;d=l}}if((j|0)<=-1){i=f;return}d=a+48|0;l=b[a+12+((r<<1)-1<<1)>>1]|0;r=j;while(1){if((r|0)==0){s=1;t=0}else{j=r<<1;s=b[a+12+(j-1<<1)>>1]|0;t=j}j=b[a+12+(t<<1)>>1]|0;L2497:do{if((j|0)==3){m=c[h+(r<<2)>>2]|0;n=m<<k;q=l<<1;p=$(n,l);o=c[d>>2]|0;u=+g[o+(p<<3)+4>>2];if((m|0)<=0){break}p=n<<1;v=0;w=o;while(1){o=e+($(v,s)<<3)|0;x=l;y=w;z=w;while(1){A=o+(l<<3)|0;B=+g[A>>2];C=+g[y>>2];D=o+(l<<3)+4|0;E=+g[D>>2];F=+g[y+4>>2];G=B*C-E*F;H=C*E+B*F;I=o+(q<<3)|0;F=+g[I>>2];B=+g[z>>2];J=o+(q<<3)+4|0;E=+g[J>>2];C=+g[z+4>>2];K=F*B-E*C;L=B*E+F*C;C=G+K;F=H+L;M=o|0;g[A>>2]=+g[M>>2]-C*.5;N=o+4|0;g[D>>2]=+g[N>>2]-F*.5;E=u*(G-K);K=u*(H-L);g[M>>2]=+g[M>>2]+C;g[N>>2]=F+ +g[N>>2];g[I>>2]=K+ +g[A>>2];g[J>>2]=+g[D>>2]-E;g[A>>2]=+g[A>>2]-K;g[D>>2]=E+ +g[D>>2];D=x-1|0;if((D|0)==0){break}else{o=o+8|0;x=D;y=y+(n<<3)|0;z=z+(p<<3)|0}}z=v+1|0;if((z|0)==(m|0)){break L2497}v=z;w=c[d>>2]|0}}else if((j|0)==4){w=c[h+(r<<2)>>2]|0;v=w<<k;m=l<<1;p=l*3&-1;if((w|0)<=0){break}n=(l|0)>0;q=v<<1;z=v*3&-1;y=0;while(1){x=c[d>>2]|0;L2510:do{if(n){o=x;D=x;A=x;J=0;I=e+($(y,s)<<3)|0;while(1){N=I+(l<<3)|0;u=+g[N>>2];E=+g[A>>2];M=I+(l<<3)+4|0;K=+g[M>>2];F=+g[A+4>>2];C=u*E-K*F;L=E*K+u*F;O=I+(m<<3)|0;F=+g[O>>2];u=+g[D>>2];P=I+(m<<3)+4|0;K=+g[P>>2];E=+g[D+4>>2];H=F*u-K*E;G=u*K+F*E;Q=I+(p<<3)|0;E=+g[Q>>2];F=+g[o>>2];R=I+(p<<3)+4|0;K=+g[R>>2];u=+g[o+4>>2];B=E*F-K*u;S=F*K+E*u;T=I|0;U=I+4|0;u=+g[U>>2];E=+g[T>>2];K=E-H;F=u-G;V=H+E;g[T>>2]=V;E=G+u;g[U>>2]=E;u=C+B;G=L+S;H=C-B;B=L-S;g[O>>2]=V-u;g[P>>2]=E-G;g[T>>2]=u+ +g[T>>2];g[U>>2]=G+ +g[U>>2];g[N>>2]=K+B;g[M>>2]=F-H;g[Q>>2]=K-B;g[R>>2]=F+H;R=J+1|0;if((R|0)==(l|0)){break L2510}else{o=o+(z<<3)|0;D=D+(q<<3)|0;A=A+(v<<3)|0;J=R;I=I+8|0}}}}while(0);x=y+1|0;if((x|0)==(w|0)){break L2497}else{y=x}}}else if((j|0)==2){y=c[h+(r<<2)>>2]|0;w=y<<k;if((y|0)<=0){break}v=(l|0)>0;q=0;while(1){z=$(q,s);L2519:do{if(v){p=0;m=c[d>>2]|0;n=e+(z+l<<3)|0;x=e+(z<<3)|0;while(1){I=x|0;J=x+4|0;A=n|0;D=n+4|0;H=+g[D>>2];F=+g[A>>2];B=+g[m>>2];K=+g[m+4>>2];G=F*B-H*K;u=H*B+F*K;g[A>>2]=+g[I>>2]-G;g[D>>2]=+g[J>>2]-u;g[I>>2]=G+ +g[I>>2];g[J>>2]=u+ +g[J>>2];J=p+1|0;if((J|0)==(l|0)){break L2519}else{p=J;m=m+(w<<3)|0;n=n+8|0;x=x+8|0}}}}while(0);z=q+1|0;if((z|0)==(y|0)){break L2497}else{q=z}}}else if((j|0)==5){q=c[h+(r<<2)>>2]|0;y=q<<k;w=c[d>>2]|0;v=$(y,l);u=+g[w+(v<<3)>>2];G=+g[w+(v<<3)+4>>2];v=$(y<<1,l);K=+g[w+(v<<3)>>2];F=+g[w+(v<<3)+4>>2];if((q|0)<=0){break}v=l<<1;z=l*3&-1;x=l<<2;n=(l|0)>0;m=y*3&-1;p=0;while(1){J=$(p,s);L2528:do{if(n){I=0;D=e+(J+x<<3)|0;A=e+(J+z<<3)|0;o=e+(J+v<<3)|0;R=e+(J+l<<3)|0;Q=e+(J<<3)|0;while(1){M=Q|0;B=+g[M>>2];N=Q+4|0;H=+g[N>>2];U=R|0;E=+g[U>>2];T=$(I,y);V=+g[w+(T<<3)>>2];P=R+4|0;S=+g[P>>2];L=+g[w+(T<<3)+4>>2];C=E*V-S*L;W=V*S+E*L;T=o|0;L=+g[T>>2];O=$(I<<1,y);E=+g[w+(O<<3)>>2];X=o+4|0;S=+g[X>>2];V=+g[w+(O<<3)+4>>2];Y=L*E-S*V;Z=E*S+L*V;O=A|0;V=+g[O>>2];_=$(m,I);L=+g[w+(_<<3)>>2];aa=A+4|0;S=+g[aa>>2];E=+g[w+(_<<3)+4>>2];ab=V*L-S*E;ac=L*S+V*E;_=D|0;E=+g[_>>2];ad=$(I<<2,y);V=+g[w+(ad<<3)>>2];ae=D+4|0;S=+g[ae>>2];L=+g[w+(ad<<3)+4>>2];af=E*V-S*L;ag=V*S+E*L;L=C+af;E=W+ag;S=C-af;af=W-ag;ag=Y+ab;W=Z+ac;C=Y-ab;ab=Z-ac;g[M>>2]=B+(ag+L);g[N>>2]=H+(W+E);ac=K*ag+(B+u*L);Z=K*W+(H+u*E);Y=F*ab+G*af;V=-0.0-G*S-F*C;g[U>>2]=ac-Y;g[P>>2]=Z-V;g[_>>2]=Y+ac;g[ae>>2]=Z+V;V=u*ag+(B+K*L);L=u*W+(H+K*E);E=G*ab-F*af;af=F*S-G*C;g[T>>2]=E+V;g[X>>2]=af+L;g[O>>2]=V-E;g[aa>>2]=L-af;aa=I+1|0;if((aa|0)==(l|0)){break L2528}else{I=aa;D=D+8|0;A=A+8|0;o=o+8|0;R=R+8|0;Q=Q+8|0}}}}while(0);J=p+1|0;if((J|0)==(q|0)){break L2497}else{p=J}}}}while(0);if((r|0)>0){l=s;r=r-1|0}else{break}}i=f;return}function bA(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0,E=0.0,F=0.0,G=0.0,H=0.0,I=0,J=0,K=0.0,L=0.0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0.0,T=0,U=0,V=0.0,W=0.0,X=0,Y=0.0,Z=0.0,_=0,aa=0,ab=0.0,ac=0.0,ad=0,ae=0,af=0.0,ag=0.0;f=i;i=i+32|0;h=f|0;j=c[a+8>>2]|0;k=(j|0)>0?j:0;j=a|0;L2536:do{if((c[j>>2]|0)>0){l=a+44|0;m=0;while(1){n=d+(m<<3)|0;o=e+((b[(c[l>>2]|0)+(m<<1)>>1]|0)<<3)|0;p=c[n+4>>2]|0;c[o>>2]=c[n>>2]|0;c[o+4>>2]=p;p=m+1|0;if((p|0)<(c[j>>2]|0)){m=p}else{break L2536}}}}while(0);c[h>>2]=1;j=0;d=1;while(1){m=j<<1;l=b[a+12+((m|1)<<1)>>1]|0;p=$(d,b[a+12+(m<<1)>>1]|0);q=j+1|0;c[h+(q<<2)>>2]=p;if(l<<16>>16==1){break}else{j=q;d=p}}if((j|0)<=-1){i=f;return}d=a+48|0;p=b[a+12+((q<<1)-1<<1)>>1]|0;q=j;while(1){if((q|0)==0){r=1;s=0}else{j=q<<1;r=b[a+12+(j-1<<1)>>1]|0;s=j}j=b[a+12+(s<<1)>>1]|0;L2552:do{if((j|0)==3){l=c[h+(q<<2)>>2]|0;m=l<<k;o=p<<1;if((l|0)<=0){break}n=c[d>>2]|0;t=m<<1;u=-0.0- +g[n+($(m,p)<<3)+4>>2];v=0;w=n;while(1){n=e+($(v,r)<<3)|0;x=p;y=w;z=w;while(1){A=n+(p<<3)|0;B=+g[A>>2];C=+g[y>>2];D=n+(p<<3)+4|0;E=+g[D>>2];F=+g[y+4>>2];G=B*C+E*F;H=C*E-B*F;I=n+(o<<3)|0;F=+g[I>>2];B=+g[z>>2];J=n+(o<<3)+4|0;E=+g[J>>2];C=+g[z+4>>2];K=F*B+E*C;L=B*E-F*C;C=G+K;F=H+L;M=n|0;g[A>>2]=+g[M>>2]-C*.5;N=n+4|0;g[D>>2]=+g[N>>2]-F*.5;E=(G-K)*u;K=(H-L)*u;g[M>>2]=+g[M>>2]+C;g[N>>2]=F+ +g[N>>2];g[I>>2]=K+ +g[A>>2];g[J>>2]=+g[D>>2]-E;g[A>>2]=+g[A>>2]-K;g[D>>2]=E+ +g[D>>2];D=x-1|0;if((D|0)==0){break}else{n=n+8|0;x=D;y=y+(m<<3)|0;z=z+(t<<3)|0}}z=v+1|0;if((z|0)==(l|0)){break L2552}v=z;w=c[d>>2]|0}}else if((j|0)==4){w=c[h+(q<<2)>>2]|0;v=w<<k;l=p<<1;t=p*3&-1;if((w|0)<=0){break}m=(p|0)>0;o=v<<1;z=v*3&-1;y=0;while(1){x=c[d>>2]|0;L2565:do{if(m){n=x;D=x;A=x;J=0;I=e+($(y,r)<<3)|0;while(1){N=I+(p<<3)|0;u=+g[N>>2];E=+g[A>>2];M=I+(p<<3)+4|0;K=+g[M>>2];F=+g[A+4>>2];C=u*E+K*F;L=E*K-u*F;O=I+(l<<3)|0;F=+g[O>>2];u=+g[D>>2];P=I+(l<<3)+4|0;K=+g[P>>2];E=+g[D+4>>2];H=F*u+K*E;G=u*K-F*E;Q=I+(t<<3)|0;E=+g[Q>>2];F=+g[n>>2];R=I+(t<<3)+4|0;K=+g[R>>2];u=+g[n+4>>2];B=E*F+K*u;S=F*K-E*u;T=I|0;u=+g[T>>2];E=u-H;U=I+4|0;K=+g[U>>2];F=K-G;V=H+u;g[T>>2]=V;u=G+K;g[U>>2]=u;K=C+B;G=L+S;H=C-B;B=L-S;g[O>>2]=V-K;g[P>>2]=u-G;g[T>>2]=K+ +g[T>>2];g[U>>2]=G+ +g[U>>2];g[N>>2]=E-B;g[M>>2]=F+H;g[Q>>2]=E+B;g[R>>2]=F-H;R=J+1|0;if((R|0)==(p|0)){break L2565}else{n=n+(z<<3)|0;D=D+(o<<3)|0;A=A+(v<<3)|0;J=R;I=I+8|0}}}}while(0);x=y+1|0;if((x|0)==(w|0)){break L2552}else{y=x}}}else if((j|0)==2){y=c[h+(q<<2)>>2]|0;w=y<<k;if((y|0)<=0){break}v=(p|0)>0;o=0;while(1){z=$(o,r);L2574:do{if(v){t=c[d>>2]|0;l=e+(z+p<<3)|0;m=0;x=e+(z<<3)|0;while(1){I=l|0;H=+g[I>>2];F=+g[t>>2];J=l+4|0;B=+g[J>>2];E=+g[t+4>>2];G=H*F+B*E;K=F*B-H*E;A=x|0;g[I>>2]=+g[A>>2]-G;I=x+4|0;g[J>>2]=+g[I>>2]-K;g[A>>2]=G+ +g[A>>2];g[I>>2]=K+ +g[I>>2];I=m+1|0;if((I|0)==(p|0)){break L2574}else{t=t+(w<<3)|0;l=l+8|0;m=I;x=x+8|0}}}}while(0);z=o+1|0;if((z|0)==(y|0)){break L2552}else{o=z}}}else if((j|0)==5){o=c[h+(q<<2)>>2]|0;y=o<<k;w=c[d>>2]|0;v=$(y,p);K=+g[w+(v<<3)>>2];G=+g[w+(v<<3)+4>>2];v=$(y<<1,p);E=+g[w+(v<<3)>>2];H=+g[w+(v<<3)+4>>2];if((o|0)<=0){break}v=p<<1;z=p*3&-1;x=p<<2;m=(p|0)>0;l=y*3&-1;t=0;while(1){I=$(t,r);L2583:do{if(m){A=0;J=e+(I+x<<3)|0;D=e+(I+z<<3)|0;n=e+(I+v<<3)|0;R=e+(I+p<<3)|0;Q=e+(I<<3)|0;while(1){M=Q|0;B=+g[M>>2];N=Q+4|0;F=+g[N>>2];U=R|0;u=+g[U>>2];T=$(A,y);V=+g[w+(T<<3)>>2];P=R+4|0;S=+g[P>>2];L=+g[w+(T<<3)+4>>2];C=u*V+S*L;W=V*S-u*L;T=n|0;L=+g[T>>2];O=$(A<<1,y);u=+g[w+(O<<3)>>2];X=n+4|0;S=+g[X>>2];V=+g[w+(O<<3)+4>>2];Y=L*u+S*V;Z=u*S-L*V;O=D|0;V=+g[O>>2];_=$(l,A);L=+g[w+(_<<3)>>2];aa=D+4|0;S=+g[aa>>2];u=+g[w+(_<<3)+4>>2];ab=V*L+S*u;ac=L*S-V*u;_=J|0;u=+g[_>>2];ad=$(A<<2,y);V=+g[w+(ad<<3)>>2];ae=J+4|0;S=+g[ae>>2];L=+g[w+(ad<<3)+4>>2];af=u*V+S*L;ag=V*S-u*L;L=C+af;u=W+ag;S=C-af;af=W-ag;ag=Y+ab;W=Z+ac;C=Y-ab;ab=Z-ac;g[M>>2]=B+(ag+L);g[N>>2]=F+(W+u);ac=E*ag+(B+K*L);Z=E*W+(F+K*u);Y=-0.0-G*af-H*ab;V=H*C+G*S;g[U>>2]=ac-Y;g[P>>2]=Z-V;g[_>>2]=ac+Y;g[ae>>2]=V+Z;Z=K*ag+(B+E*L);L=K*W+(F+E*u);u=H*af-G*ab;ab=G*C-H*S;g[T>>2]=u+Z;g[X>>2]=ab+L;g[O>>2]=Z-u;g[aa>>2]=L-ab;aa=A+1|0;if((aa|0)==(p|0)){break L2583}else{A=aa;J=J+8|0;D=D+8|0;n=n+8|0;R=R+8|0;Q=Q+8|0}}}}while(0);I=t+1|0;if((I|0)==(o|0)){break L2552}else{t=I}}}}while(0);if((q|0)>0){p=r;q=q-1|0}else{break}}i=f;return}function bB(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=a+28|0;g=c[f>>2]|0;h=g>>>15;c[a+36>>2]=h;i=a+32|0;j=c[i>>2]|0;k=(j>>>0)/(h>>>0)>>>0;l=32767-k&((k+1|0)>>>0<32769)<<31>>31;do{if(l>>>0<b>>>0){m=b;n=0;o=0}else{k=($(16384-e|0,32736-b|0)>>>15)+1|0;L2593:do{if(k>>>0>1){p=b;q=1;r=k;while(1){s=r<<1;t=s+p|0;if(l>>>0<t>>>0){u=q;v=p;w=r;break L2593}x=q+1|0;y=($(s-2|0,e)>>>15)+1|0;if(y>>>0>1){p=t;q=x;r=y}else{z=t;A=x;B=y;C=1768;break L2593}}}else{z=b;A=1;B=k;C=1768}}while(0);if((C|0)==1768){k=(l-z|0)>>>1;u=k+A|0;v=(k<<1)+z|0;w=B}k=v+w|0;if(l>>>0>=k>>>0){m=w;n=u;o=k;break}m=w;n=-u|0;o=v}}while(0);v=m+o|0;m=v>>>0<32768?v:32768;v=$(32768-m|0,h);u=j-v|0;c[i>>2]=u;if((o|0)==0){D=g-v|0}else{D=$(m-o|0,h)}c[f>>2]=D;if(D>>>0>=8388609){return n|0}h=a+20|0;o=a+40|0;m=a+24|0;v=a|0;g=c[a+4>>2]|0;a=c[h>>2]|0;j=D;D=c[o>>2]|0;w=c[m>>2]|0;l=u;while(1){u=a+8|0;c[h>>2]=u;B=j<<8;c[f>>2]=B;if(w>>>0<g>>>0){z=w+1|0;c[m>>2]=z;E=d[(c[v>>2]|0)+w|0]|0;F=z}else{E=0;F=w}c[o>>2]=E;z=((E|D<<8)>>>1&255|l<<8&2147483392)^255;c[i>>2]=z;if(B>>>0<8388609){a=u;j=B;D=E;w=F;l=z}else{break}}return n|0}function bC(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=c[b>>2]|0;if((f|0)==0){g=d;h=0;i=g+h|0;bu(a,h,i,15);return}j=f>>31;k=j+f^j;l=$(16384-e|0,32736-d|0)>>>15;m=(l|0)==0;L2619:do{if((k|0)>1&(m^1)){n=d;o=1;p=l;while(1){q=p<<1;r=(n+2|0)+q|0;s=o+1|0;t=$(q,e)>>>15;q=(t|0)==0;if((s|0)<(k|0)&(q^1)){n=r;o=s;p=t}else{u=r;v=s;w=t;x=q;break L2619}}}else{u=d;v=1;w=l;x=m}}while(0);if(x){x=k-v|0;k=((f>>>31|32768)-u>>1)-1|0;f=(x|0)<(k|0)?x:k;k=(u+j|0)+(f<<1|1)|0;x=32768-k|0;c[b>>2]=(v+j|0)+f^j;g=x>>>0>1?1:x;h=k;i=g+h|0;bu(a,h,i,15);return}else{k=w+1|0;g=k;h=(k&(j^-1))+u|0;i=g+h|0;bu(a,h,i,15);return}}function bD(a,b,d,e,f,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0.0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0.0,Q=0.0,R=0.0;k=i;l=c[a>>2]>>h;m=l>>1;n=l>>2;o=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;p=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;q=.7853981852531433/+(l|0);l=f>>1;r=b+(l<<2)|0;s=l-1|0;t=b+(s+m<<2)|0;u=f+3>>2;if((u|0)>0){v=-m|0;w=u<<1;x=((l+m|0)-1|0)-w|0;y=b+(l+w<<2)|0;z=e+(s<<2)|0;s=e+(l<<2)|0;l=o;A=t;B=r;C=0;while(1){D=+g[z>>2];E=+g[s>>2];g[l>>2]=D*+g[B+(m<<2)>>2]+E*+g[A>>2];g[l+4>>2]=E*+g[B>>2]-D*+g[A+(v<<2)>>2];F=C+1|0;if((F|0)==(u|0)){break}else{z=z-8|0;s=s+8|0;l=l+8|0;A=A-8|0;B=B+8|0;C=F}}G=o+(w<<2)|0;H=b+(x<<2)|0;I=y;J=u}else{G=o;H=t;I=r;J=0}r=e+(f-1<<2)|0;f=n-u|0;if((J|0)<(f|0)){t=J+u<<1;u=n<<1;y=t-u|0;x=u-t|0;t=I+(x<<2)|0;u=G;b=H;w=I;C=J;while(1){g[u>>2]=+g[b>>2];g[u+4>>2]=+g[w>>2];B=C+1|0;if((B|0)==(f|0)){break}else{u=u+8|0;b=b-8|0;w=w+8|0;C=B}}K=G+(x<<2)|0;L=H+(y<<2)|0;M=t;N=f}else{K=G;L=H;M=I;N=J}L2641:do{if((N|0)<(n|0)){J=-m|0;I=r;H=e;G=K;f=L;t=M;y=N;while(1){g[G>>2]=+g[I>>2]*+g[f>>2]- +g[H>>2]*+g[t+(J<<2)>>2];g[G+4>>2]=+g[I>>2]*+g[t>>2]+ +g[H>>2]*+g[f+(m<<2)>>2];x=y+1|0;if((x|0)==(n|0)){break L2641}else{I=I-8|0;H=H+8|0;G=G+8|0;f=f-8|0;t=t+8|0;y=x}}}}while(0);N=a+24|0;M=c[N>>2]|0;L=(n|0)>0;L2646:do{if(L){K=o;e=0;while(1){D=+g[K>>2];r=K+4|0;E=+g[r>>2];O=+g[M+(e<<h<<2)>>2];P=+g[M+(n-e<<h<<2)>>2];Q=-0.0-D*O-E*P;R=D*P-E*O;g[K>>2]=Q+q*R;g[r>>2]=R-q*Q;r=e+1|0;if((r|0)==(n|0)){break L2646}K=K+8|0;e=r}}}while(0);bz(c[a+8+(h<<2)>>2]|0,o,p);o=c[N>>2]|0;if(!L){i=k;return}L=j<<1;N=-L|0;a=p;p=d;M=d+($(m-1|0,j)<<2)|0;j=0;while(1){Q=+g[a+4>>2];R=+g[o+(n-j<<h<<2)>>2];O=+g[a>>2];E=+g[o+(j<<h<<2)>>2];P=Q*R+O*E;D=R*O-Q*E;g[p>>2]=P-q*D;g[M>>2]=D+q*P;m=j+1|0;if((m|0)==(n|0)){break}else{a=a+8|0;p=p+(L<<2)|0;M=M+(N<<2)|0;j=m}}i=k;return}function bE(a,b,d,e,f,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0;k=i;l=c[a>>2]>>h;m=l>>1;n=l>>2;o=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;p=.7853981852531433/+(l|0);l=a+24|0;q=c[l>>2]|0;L2658:do{if((n|0)>0){r=j<<1;s=-r|0;t=o;u=b+($(m-1|0,j)<<2)|0;v=b;w=0;while(1){x=+g[u>>2];y=+g[q+(w<<h<<2)>>2];z=+g[v>>2];A=+g[q+(n-w<<h<<2)>>2];B=z*A-x*y;C=-0.0-x*A-y*z;g[t>>2]=B-p*C;g[t+4>>2]=C+p*B;D=w+1|0;if((D|0)==(n|0)){break L2658}else{t=t+8|0;u=u+(s<<2)|0;v=v+(r<<2)|0;w=D}}}}while(0);q=f>>1;b=d+(q<<2)|0;bA(c[a+8+(h<<2)>>2]|0,o,b);o=c[l>>2]|0;l=n+1>>1;L2663:do{if((l|0)>0){a=d+((q-2|0)+m<<2)|0;j=b;w=0;while(1){B=+g[j>>2];r=j+4|0;C=+g[r>>2];z=+g[o+(w<<h<<2)>>2];v=n-w|0;y=+g[o+(v<<h<<2)>>2];A=B*z-C*y;x=C*z+B*y;y=+g[a>>2];s=a+4|0;B=+g[s>>2];g[j>>2]=-0.0-(A-p*x);g[s>>2]=x+p*A;A=+g[o+(v-1<<h<<2)>>2];v=w+1|0;x=+g[o+(v<<h<<2)>>2];z=y*A-B*x;C=B*A+y*x;g[a>>2]=-0.0-(z-p*C);g[r>>2]=C+p*z;if((v|0)==(l|0)){break L2663}else{a=a-8|0;j=j+8|0;w=v}}}}while(0);l=f-1|0;h=(f|0)/2&-1;if((f|0)<=1){i=k;return}f=d+(l<<2)|0;o=d;d=e;n=e+(l<<2)|0;l=0;while(1){p=+g[f>>2];z=+g[o>>2];C=+g[n>>2];x=+g[d>>2];g[o>>2]=z*C-p*x;g[f>>2]=z*x+p*C;e=l+1|0;if((e|0)<(h|0)){f=f-4|0;o=o+4|0;d=d+4|0;n=n-4|0;l=e}else{break}}i=k;return}function bF(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0,C=0,D=0,E=0,F=0.0,G=0.0,H=0.0,I=0.0;f=i;i=i+36|0;h=f|0;j=f+20|0;k=d>>1;d=(k|0)>1;l=c[a>>2]|0;L2675:do{if(d){m=1;while(1){n=m<<1;g[b+(m<<2)>>2]=(+g[l+(n<<2)>>2]+(+g[l+(n-1<<2)>>2]+ +g[l+((n|1)<<2)>>2])*.5)*.5;n=m+1|0;if((n|0)==(k|0)){break L2675}else{m=n}}}}while(0);o=(+g[l+4>>2]*.5+ +g[l>>2])*.5;g[b>>2]=o;if((e|0)==2){e=c[a+4>>2]|0;if(d){d=1;while(1){a=d<<1;l=b+(d<<2)|0;g[l>>2]=+g[l>>2]+(+g[e+(a<<2)>>2]+(+g[e+(a-1<<2)>>2]+ +g[e+((a|1)<<2)>>2])*.5)*.5;a=d+1|0;if((a|0)==(k|0)){break}else{d=a}}p=+g[b>>2]}else{p=o}g[b>>2]=p+(+g[e+4>>2]*.5+ +g[e>>2])*.5}e=h|0;bI(b,e,0,0,4,k);p=+g[e>>2]*1.000100016593933;g[e>>2]=p;e=h+4|0;o=+g[e>>2];g[e>>2]=o-o*.00800000037997961*.00800000037997961;e=h+8|0;o=+g[e>>2];g[e>>2]=o-o*.01600000075995922*.01600000075995922;e=h+12|0;o=+g[e>>2];g[e>>2]=o-o*.024000000208616257*.024000000208616257;e=h+16|0;o=+g[e>>2];g[e>>2]=o-o*.03200000151991844*.03200000151991844;e=j|0;dF(j|0,0,16);if(p!=0.0){o=p*.0010000000474974513;q=p;d=0;while(1){if((d|0)>=4){break}L2692:do{if((d|0)>0){p=0.0;a=0;while(1){r=p+ +g[j+(a<<2)>>2]*+g[h+(d-a<<2)>>2];l=a+1|0;if((l|0)==(d|0)){s=r;break L2692}else{p=r;a=l}}}else{s=0.0}}while(0);a=d+1|0;p=(s+ +g[h+(a<<2)>>2])/q;r=-0.0-p;g[j+(d<<2)>>2]=r;l=a>>1;L2696:do{if((l|0)>0){m=d-1|0;n=0;while(1){t=j+(n<<2)|0;u=+g[t>>2];v=j+(m-n<<2)|0;w=+g[v>>2];g[t>>2]=u+w*r;g[v>>2]=w+u*r;v=n+1|0;if((v|0)==(l|0)){break L2696}else{n=v}}}}while(0);r=q-q*p*p;if(r<o){break}else{q=r;d=a}}d=j+4|0;h=j+8|0;l=j+12|0;x=+g[e>>2]*.8999999761581421;y=+g[d>>2]*.809999942779541;z=+g[h>>2]*.7289999127388;A=+g[l>>2]*.6560999155044556;B=d;C=h;D=l}else{x=0.0;y=0.0;z=0.0;A=0.0;B=j+4|0;C=j+8|0;D=j+12|0}g[e>>2]=x;g[B>>2]=y;g[C>>2]=z;g[D>>2]=A;if((k|0)>0){E=0;F=0.0;G=0.0;H=0.0;I=0.0}else{g[e>>2]=.800000011920929;i=f;return}while(1){D=b+(E<<2)|0;q=+g[D>>2];g[D>>2]=q+x*I+y*H+z*G+A*F;D=E+1|0;if((D|0)==(k|0)){break}else{E=D;F=G;G=H;H=I;I=q}}g[e>>2]=.800000011920929;e=0;I=0.0;while(1){E=b+(e<<2)|0;H=+g[E>>2];g[E>>2]=H+I*.800000011920929;E=e+1|0;if((E|0)==(k|0)){break}else{e=E;I=H}}i=f;return}function bG(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0,t=0.0,u=0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0,H=0,I=0,J=0,K=0,L=0.0,M=0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0.0,S=0.0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0.0,_=0.0,$=0.0,aa=0.0,ab=0;h=i;j=d>>2;k=i;i=i+(j*4&-1)|0;i=i+3>>2<<2;l=e+d>>2;m=i;i=i+(l*4&-1)|0;i=i+3>>2<<2;n=e>>1;o=i;i=i+(n*4&-1)|0;i=i+3>>2<<2;p=(j|0)>0;L2714:do{if(p){q=0;while(1){g[k+(q<<2)>>2]=+g[a+(q<<1<<2)>>2];r=q+1|0;if((r|0)==(j|0)){break L2714}else{q=r}}}}while(0);L2718:do{if((l|0)>0){q=0;while(1){g[m+(q<<2)>>2]=+g[b+(q<<1<<2)>>2];r=q+1|0;if((r|0)==(l|0)){break L2718}else{q=r}}}}while(0);l=e>>2;e=(l|0)>0;L2722:do{if(e){q=0;while(1){L2725:do{if(p){s=0.0;r=0;while(1){t=s+ +g[k+(r<<2)>>2]*+g[m+(r+q<<2)>>2];u=r+1|0;if((u|0)==(j|0)){v=t;break L2725}else{s=t;r=u}}}else{v=0.0}}while(0);g[o+(q<<2)>>2]=v<-1.0?-1.0:v;r=q+1|0;if((r|0)==(l|0)){break L2722}else{q=r}}}}while(0);L2730:do{if(p){v=1.0;k=0;while(1){s=+g[m+(k<<2)>>2];t=v+s*s;q=k+1|0;if((q|0)==(j|0)){w=t;break L2730}else{v=t;k=q}}}else{w=1.0}}while(0);L2734:do{if(e){v=w;t=-1.0;s=-1.0;x=0.0;y=0.0;p=0;k=0;q=1;while(1){z=+g[o+(p<<2)>>2];do{if(z>0.0){A=z*9.999999960041972e-13;B=A*A;if(x*B<=t*v){C=y;D=x;E=s;F=t;G=k;H=q;break}if(y*B>s*v){C=v;D=y;E=B;F=s;G=p;H=k;break}C=y;D=v;E=s;F=B;G=k;H=p}else{C=y;D=x;E=s;F=t;G=k;H=q}}while(0);z=+g[m+(p+j<<2)>>2];B=+g[m+(p<<2)>>2];A=v+(z*z-B*B);r=p+1|0;if((r|0)==(l|0)){I=G;J=H;break L2734}v=A<1.0?1.0:A;t=F;s=E;x=D;y=C;p=r;k=G;q=H}}else{I=0;J=1}}while(0);H=(n|0)>0;L2744:do{if(H){G=I<<1;l=J<<1;m=d>>1;j=(m|0)>0;e=0;while(1){q=o+(e<<2)|0;g[q>>2]=0.0;k=e-G|0;do{if((((k|0)>-1?k:-k|0)|0)>2){p=e-l|0;if((((p|0)>-1?p:-p|0)|0)>2){break}else{K=1872;break}}else{K=1872}}while(0);if((K|0)==1872){K=0;L2753:do{if(j){C=0.0;k=0;while(1){D=C+ +g[a+(k<<2)>>2]*+g[b+(k+e<<2)>>2];p=k+1|0;if((p|0)==(m|0)){L=D;break L2753}else{C=D;k=p}}}else{L=0.0}}while(0);g[q>>2]=L<-1.0?-1.0:L}k=e+1|0;if((k|0)==(n|0)){M=m;break L2744}else{e=k}}}else{M=d>>1}}while(0);L2759:do{if((M|0)>0){L=1.0;d=0;while(1){C=+g[b+(d<<2)>>2];D=L+C*C;a=d+1|0;if((a|0)==(M|0)){N=D;break L2759}else{L=D;d=a}}}else{N=1.0}}while(0);if(H){O=N;P=-1.0;Q=-1.0;R=0.0;S=0.0;T=0;U=0}else{V=0;W=0;X=W<<1;Y=X-V|0;c[f>>2]=Y;i=h;return}while(1){N=+g[o+(T<<2)>>2];do{if(N>0.0){L=N*9.999999960041972e-13;D=L*L;if(R*D<=P*O){Z=S;_=R;$=Q;aa=P;ab=U;break}if(S*D>Q*O){Z=O;_=S;$=D;aa=Q;ab=T;break}Z=S;_=O;$=Q;aa=D;ab=U}else{Z=S;_=R;$=Q;aa=P;ab=U}}while(0);N=+g[b+(T+M<<2)>>2];D=+g[b+(T<<2)>>2];L=O+(N*N-D*D);H=T+1|0;if((H|0)==(n|0)){break}O=L<1.0?1.0:L;P=aa;Q=$;R=_;S=Z;T=H;U=ab}if((ab|0)<=0){V=0;W=ab;X=W<<1;Y=X-V|0;c[f>>2]=Y;i=h;return}if((ab|0)>=(n-1|0)){V=0;W=ab;X=W<<1;Y=X-V|0;c[f>>2]=Y;i=h;return}Z=+g[o+(ab-1<<2)>>2];S=+g[o+(ab<<2)>>2];_=+g[o+(ab+1<<2)>>2];if(_-Z>(S-Z)*.699999988079071){V=1;W=ab;X=W<<1;Y=X-V|0;c[f>>2]=Y;i=h;return}V=(Z-_>(S-_)*.699999988079071)<<31>>31;W=ab;X=W<<1;Y=X-V|0;c[f>>2]=Y;i=h;return}function bH(a,b,d,e,f,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;i=+i;var j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0,w=0.0,x=0.0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0.0,F=0.0,G=0.0,H=0,I=0,J=0,K=0.0,L=0.0,M=0.0,N=0.0,O=0,Q=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0,Y=0.0,Z=0.0,_=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0,ae=0,af=0.0,ag=0,ah=0,ai=0,aj=0;j=(b|0)/2&-1;b=(d|0)/2&-1;k=(c[f>>2]|0)/2&-1;l=(h|0)/2&-1;h=(e|0)/2&-1;m=(k|0)<(j|0)?k:j-1|0;c[f>>2]=m;k=(e|0)>1;L2785:do{if(k){e=j-m|0;n=0;o=0.0;p=0.0;q=0.0;while(1){r=+g[a+(n+j<<2)>>2];s=+g[a+(e+n<<2)>>2];t=o+r*s;u=p+r*r;r=q+s*s;v=n+1|0;if((v|0)<(h|0)){n=v;o=t;p=u;q=r}else{w=t;x=u;y=r;break L2785}}}else{w=0.0;x=0.0;y=0.0}}while(0);q=w/+P(+(x*y+1.0));n=m<<1;p=x*2.0;x=q*.699999988079071;e=b*3&-1;o=q*.8500000238418579;v=b<<1;r=q*.8999999761581421;u=i*.5;z=m;A=2;t=q;q=w;w=y;while(1){B=A<<1;C=(A+n|0)/(B|0)&-1;if((C|0)<(b|0)){D=z;E=t;F=q;G=w;break}if((A|0)==2){H=C+m|0;I=(H|0)>(j|0)?m:H}else{I=($(n,c[5250796+(A<<2)>>2]|0)+A|0)/(B|0)&-1}L2797:do{if(k){B=j-C|0;H=j-I|0;J=0;y=0.0;s=0.0;while(1){K=+g[a+(J+j<<2)>>2];L=+g[a+(B+J<<2)>>2];M=+g[a+(H+J<<2)>>2];N=y+K*L+K*M;K=s+L*L+M*M;O=J+1|0;if((O|0)<(h|0)){J=O;y=N;s=K}else{Q=N;R=K;break L2797}}}else{Q=0.0;R=0.0}}while(0);s=Q/+P(+(p*R+1.0));J=C-l|0;H=(J|0)>-1?J:-J|0;do{if((H|0)<2){S=i}else{if((H|0)>=3){S=0.0;break}S=($(A*5&-1,A)|0)<(m|0)?u:0.0}}while(0);y=x-S;do{if((C|0)<(e|0)){K=o-S;T=K<.4000000059604645?.4000000059604645:K}else{if((C|0)>=(v|0)){T=y<.30000001192092896?.30000001192092896:y;break}K=r-S;T=K<.5?.5:K}}while(0);if(s>T){U=R;V=Q;W=s;X=C}else{U=w;V=q;W=t;X=z}H=A+1|0;if((H|0)<16){z=X;A=H;t=W;q=V;w=U}else{D=X;E=W;F=V;G=U;break}}U=F<0.0?0.0:F;if(G>U){Y=U/(G+1.0)}else{Y=1.0}X=(j+1|0)-D|0;L2818:do{if(k){A=0;G=0.0;while(1){Z=G+ +g[a+(A+j<<2)>>2]*+g[a+(X+A<<2)>>2];z=A+1|0;if((z|0)<(h|0)){A=z;G=Z}else{break}}if(!k){_=0.0;aa=Z;ab=0.0;break}A=X-1|0;C=0;G=0.0;while(1){ac=G+ +g[a+(C+j<<2)>>2]*+g[a+(A+C<<2)>>2];z=C+1|0;if((z|0)<(h|0)){C=z;G=ac}else{break}}if(!k){_=0.0;aa=Z;ab=ac;break}C=X-2|0;A=0;G=0.0;while(1){s=G+ +g[a+(A+j<<2)>>2]*+g[a+(C+A<<2)>>2];z=A+1|0;if((z|0)<(h|0)){A=z;G=s}else{_=s;aa=Z;ab=ac;break L2818}}}else{_=0.0;aa=0.0;ab=0.0}}while(0);if(_-aa>(ab-aa)*.699999988079071){ad=1;ae=Y>E;af=ae?E:Y;ag=D<<1;ah=ad+ag|0;ai=(ah|0)<(d|0);aj=ai?d:ah;c[f>>2]=aj;return+af}ad=(aa-_>(ab-_)*.699999988079071)<<31>>31;ae=Y>E;af=ae?E:Y;ag=D<<1;ah=ad+ag|0;ai=(ah|0)<(d|0);aj=ai?d:ah;c[f>>2]=aj;return+af}function bI(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0.0,m=0,n=0,o=0.0,p=0.0,q=0.0,r=0.0;h=i;j=i;i=i+(f*4&-1)|0;i=i+3>>2<<2;if((f|0)>0){dH(j|0,a|0,f<<2)}L2838:do{if((d|0)>0){k=0;while(1){l=+g[c+(k<<2)>>2];g[j+(k<<2)>>2]=+g[a+(k<<2)>>2]*l;m=(f-k|0)-1|0;g[j+(m<<2)>>2]=+g[a+(m<<2)>>2]*l;m=k+1|0;if((m|0)==(d|0)){break L2838}else{k=m}}}}while(0);if((e|0)>-1){n=e}else{o=+g[b>>2];p=o+10.0;g[b>>2]=p;i=h;return}while(1){L2846:do{if((n|0)<(f|0)){l=0.0;e=n;while(1){q=l+ +g[j+(e<<2)>>2]*+g[j+(e-n<<2)>>2];d=e+1|0;if((d|0)==(f|0)){r=q;break L2846}else{l=q;e=d}}}else{r=0.0}}while(0);g[b+(n<<2)>>2]=r;if((n|0)>0){n=n-1|0}else{break}}o=+g[b>>2];p=o+10.0;g[b>>2]=p;i=h;return}function bJ(a,b,d,e,f,h,j,k,l,m,n,o,p,q,r,s){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;var t=0,u=0,v=0,w=0,x=0,y=0,z=0.0,A=0,B=0,C=0.0,D=0,E=0,F=0.0,G=0,H=0.0,I=0.0,J=0.0,K=0.0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0.0;t=i;i=i+84|0;u=t|0;v=t+24|0;w=t+44|0;x=t+64|0;do{if((p|0)==0){if((r|0)!=0){y=0;break}z=+g[q>>2];A=d-b|0;if(z<=+($(A<<1,m)|0)){y=0;break}y=($(A,m)|0)<(o|0)}else{y=1}}while(0);z=+(s|0)*+(j>>>0>>>0)*+g[q>>2]/+(m<<9|0);s=a+8|0;p=c[s>>2]|0;A=(b|0)<(e|0);B=0;C=0.0;while(1){L2859:do{if(A){D=$(B,p);E=b;F=C;while(1){G=E+D|0;H=+g[f+(G<<2)>>2]- +g[h+(G<<2)>>2];I=F+H*H;G=E+1|0;if((G|0)==(e|0)){J=I;break L2859}else{E=G;F=I}}}else{J=C}}while(0);E=B+1|0;if((E|0)<(m|0)){B=E;C=J}else{break}}B=~~z;z=J>200.0?200.0:J;e=l+20|0;A=c[e>>2]|0;E=l+28|0;D=(dG(c[E>>2]|0)|-32)+A|0;A=(D+3|0)>>>0>j>>>0;G=A?0:y&1;if((d-b|0)>10){J=+(o|0)*.125;K=J>16.0?16.0:J}else{K=16.0}o=l;y=u;c[y>>2]=c[o>>2]|0;c[y+4>>2]=c[o+4>>2]|0;c[y+8>>2]=c[o+8>>2]|0;c[y+12>>2]=c[o+12>>2]|0;c[y+16>>2]=c[o+16>>2]|0;c[y+20>>2]=c[o+20>>2]|0;u=l+24|0;L=c[u>>2]|0;M=E;N=v;c[N>>2]=c[M>>2]|0;c[N+4>>2]=c[M+4>>2]|0;c[N+8>>2]=c[M+8>>2]|0;c[N+12>>2]=c[M+12>>2]|0;c[N+16>>2]=c[M+16>>2]|0;v=$(p,m);p=i;i=i+(v*4&-1)|0;i=i+3>>2<<2;O=i;i=i+(v*4&-1)|0;i=i+3>>2<<2;P=p;Q=h;dH(P|0,Q|0,v<<2);v=(r|0)!=0;r=v&(A^1);R=(G|0)==0;if((A|v^1)&R){S=0}else{S=bM(a,b,d,f,p,j,D,5259270+(n*84&-1)|0,O,l,m,n,1,K)|0}if(R){R=c[e>>2]|0;p=c[E>>2]|0;v=32-(dG(p|0)|0)|0;A=p>>>((v-16|0)>>>0);p=$(A,A);A=p>>>31;T=p>>>15>>>(A>>>0);p=$(T,T);T=p>>>31;U=p>>>15>>>(T>>>0);p=(R<<3)-($(U,U)>>>31|(T|(A|v<<1)<<1)<<1)|0;v=l|0;A=c[v>>2]|0;T=l+4|0;U=w;c[U>>2]=c[T>>2]|0;c[U+4>>2]=c[T+4>>2]|0;c[U+8>>2]=c[T+8>>2]|0;c[U+12>>2]=c[T+12>>2]|0;c[U+16>>2]=c[T+16>>2]|0;w=c[u>>2]|0;R=x;c[R>>2]=c[M>>2]|0;c[R+4>>2]=c[M+4>>2]|0;c[R+8>>2]=c[M+8>>2]|0;c[R+12>>2]=c[M+12>>2]|0;c[R+16>>2]=c[M+16>>2]|0;x=A+L|0;V=w-L|0;W=at()|0;X=i;i=i+V|0;i=i+3>>2<<2;dH(X|0,x|0,V);c[o>>2]=c[y>>2]|0;c[o+4>>2]=c[y+4>>2]|0;c[o+8>>2]=c[y+8>>2]|0;c[o+12>>2]=c[y+12>>2]|0;c[o+16>>2]=c[y+16>>2]|0;c[o+20>>2]=c[y+20>>2]|0;c[u>>2]=L;c[M>>2]=c[N>>2]|0;c[M+4>>2]=c[N+4>>2]|0;c[M+8>>2]=c[N+8>>2]|0;c[M+12>>2]=c[N+12>>2]|0;c[M+16>>2]=c[N+16>>2]|0;N=bM(a,b,d,f,h,j,D,5259228+(n*84&-1)|0,k,l,m,n,0,K)|0;do{if(r){if((S|0)>=(N|0)){if((S|0)!=(N|0)){Y=0;break}l=c[e>>2]|0;D=c[E>>2]|0;j=32-(dG(D|0)|0)|0;h=D>>>((j-16|0)>>>0);D=$(h,h);h=D>>>31;f=D>>>15>>>(h>>>0);D=$(f,f);f=D>>>31;d=D>>>15>>>(f>>>0);if((((l<<3)+B|0)-($(d,d)>>>31|(f|(h|j<<1)<<1)<<1)|0)<=(p|0)){Y=0;break}}c[v>>2]=A;c[T>>2]=c[U>>2]|0;c[T+4>>2]=c[U+4>>2]|0;c[T+8>>2]=c[U+8>>2]|0;c[T+12>>2]=c[U+12>>2]|0;c[T+16>>2]=c[U+16>>2]|0;c[u>>2]=w;c[M>>2]=c[R>>2]|0;c[M+4>>2]=c[R+4>>2]|0;c[M+8>>2]=c[R+8>>2]|0;c[M+12>>2]=c[R+12>>2]|0;c[M+16>>2]=c[R+16>>2]|0;dH(x|0,X|0,V);j=m<<2;dH(Q|0,P|0,$(j,c[s>>2]|0));dH(k|0,O|0,$(j,c[s>>2]|0));Y=1}else{Y=0}}while(0);au(W|0);Z=Y}else{Y=m<<2;dH(Q|0,P|0,$(Y,c[s>>2]|0));dH(k|0,O|0,$(Y,c[s>>2]|0));Z=G}if((Z|0)!=0){_=z;g[q>>2]=_;i=t;return}K=+g[5250892+(n<<2)>>2];_=z+K*K*+g[q>>2];g[q>>2]=_;i=t;return}function bK(b,d,e,f,h,i,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0.0;n=(d|0)>=(e|0);o=b+8|0;b=l+12|0;p=l+16|0;q=l+24|0;r=l+8|0;s=l+4|0;t=l|0;u=l+44|0;v=l+20|0;l=(m|0)>1?-m|0:-1;w=0;x=k;while(1){L2889:do{if(n|(x|0)<(m|0)){y=x}else{k=d;z=x;while(1){A=i+(k<<2)|0;do{if((c[A>>2]|0)>7){B=z}else{if((c[j+(k<<2)>>2]|0)==(w|0)){C=0}else{B=z;break}while(1){D=+g[h+($(c[o>>2]|0,C)+k<<2)>>2]>=0.0&1;E=c[b>>2]|0;F=c[p>>2]|0;if((F+1|0)>>>0>32){G=7-F|0;H=((G|0)>-8?G:-8)+F|0;G=F;I=E;while(1){J=c[r>>2]|0;K=c[s>>2]|0;if((J+(c[q>>2]|0)|0)>>>0<K>>>0){L=J+1|0;c[r>>2]=L;a[(c[t>>2]|0)+(K-L|0)|0]=I&255;M=0}else{M=-1}c[u>>2]=c[u>>2]|M;N=I>>>8;L=G-8|0;if((L|0)>7){G=L;I=N}else{break}}O=(F-8|0)-(H&-8)|0;P=N}else{O=F;P=E}c[b>>2]=D<<O|P;c[p>>2]=O+1|0;c[v>>2]=(c[v>>2]|0)+1|0;Q=(+(D|0)+-.5)*+(1<<13-(c[A>>2]|0)|0)*6103515625.0e-14;I=f+($(c[o>>2]|0,C)+k<<2)|0;g[I>>2]=+g[I>>2]+Q;I=C+1|0;if((I|0)<(m|0)){C=I}else{break}}B=l+z|0}}while(0);A=k+1|0;if((A|0)>=(e|0)|(B|0)<(m|0)){y=B;break L2889}else{k=A;z=B}}}}while(0);z=w+1|0;if((z|0)==2){break}else{w=z;x=y}}return}function bL(a,b,e,f,h,i,j){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0.0;if((b|0)>=(e|0)){return}k=i+12|0;l=i+16|0;m=i+8|0;n=i+4|0;o=i|0;p=i+20|0;i=a+8|0;a=b;while(1){b=h+(a<<2)|0;q=c[b>>2]|0;L2915:do{if((q|0)>=1){r=0;s=q;while(1){t=c[k>>2]|0;u=c[l>>2]|0;if(u>>>0<s>>>0){v=u+8|0;w=((v|0)>25?u+7|0:24)-u|0;x=c[n>>2]|0;y=t;z=u;A=c[m>>2]|0;while(1){if(A>>>0<x>>>0){B=A+1|0;c[m>>2]=B;C=d[(c[o>>2]|0)+(x-B|0)|0]|0;D=B}else{C=0;D=A}E=C<<z|y;B=z+8|0;if((B|0)<25){y=E;z=B;A=D}else{break}}F=E;G=v+(w&-8)|0}else{F=t;G=u}c[k>>2]=F>>>(s>>>0);c[l>>2]=G-s|0;c[p>>2]=(c[p>>2]|0)+s|0;H=(+(F&(1<<s)-1|0)+.5)*+(1<<14-(c[b>>2]|0)|0)*6103515625.0e-14+-.5;A=f+($(c[i>>2]|0,r)+a<<2)|0;g[A>>2]=+g[A>>2]+H;A=r+1|0;if((A|0)>=(j|0)){break L2915}r=A;s=c[b>>2]|0}}}while(0);b=a+1|0;if((b|0)==(e|0)){break}else{a=b}}return}function bM(a,b,e,f,h,j,k,l,m,n,o,p,q,r){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=+r;var s=0,t=0,u=0,v=0,w=0.0,x=0.0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0,O=0.0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;s=i;i=i+12|0;t=s|0;u=s+8|0;v=t;c[v>>2]=0;c[v+4>>2]=0;if((k+3|0)<=(j|0)){bv(n,q,3)}if((q|0)==0){w=+g[5250892+(p<<2)>>2];x=+g[5261200+(p<<2)>>2]}else{w=0.0;x=.149993896484375}if((b|0)>=(e|0)){y=0;i=s;return y|0}p=a+8|0;a=n+20|0;q=n+28|0;k=o*3&-1;v=0;z=b;while(1){A=$(k,e-z|0);B=(z|0)!=(b|0);C=(z|0)<20?z<<1:40;D=l+C|0;E=l+(C|1)|0;C=0;F=v;while(1){G=$(c[p>>2]|0,C)+z|0;H=+g[f+(G<<2)>>2];I=+g[h+(G<<2)>>2];J=w*(I<-9.0?-9.0:I);G=t+(C<<2)|0;K=+g[G>>2];L=H-J-K;M=~~+N(+(L+.5));c[u>>2]=M;O=(I<-28.0?-28.0:I)-r;do{if((M|0)<0&H<O){P=~~(O-H)+M|0;c[u>>2]=P;if((P|0)<=0){Q=P;break}c[u>>2]=0;Q=0}else{Q=M}}while(0);M=c[a>>2]|0;P=(j-M|0)-(dG(c[q>>2]|0)|-32)|0;M=P-A|0;do{if(B&(M|0)<30&(M|0)<24){R=(Q|0)>1?1:Q;c[u>>2]=R;if((M|0)>=16){S=R;break}T=(R|0)<-1?-1:R;c[u>>2]=T;S=T}else{S=Q}}while(0);do{if((P|0)>14){bC(n,u,(d[D]|0)<<7,(d[E]|0)<<6);U=c[u>>2]|0}else{if((P|0)>1){M=(S|0)<1?S:1;T=(M|0)<-1?-1:M;c[u>>2]=T;bw(n,T<<1^T>>31,5246204,2);U=T;break}if((P|0)>0){T=(S|0)>0?0:S;c[u>>2]=T;bv(n,-T|0,1);U=T;break}else{c[u>>2]=-1;U=-1;break}}}while(0);H=+(U|0);g[m+($(c[p>>2]|0,C)+z<<2)>>2]=L-H;P=Q-U|0;V=((P|0)>-1?P:-P|0)+F|0;g[h+($(c[p>>2]|0,C)+z<<2)>>2]=H+(J+K);g[G>>2]=H+K-x*H;P=C+1|0;if((P|0)<(o|0)){C=P;F=V}else{break}}F=z+1|0;if((F|0)==(e|0)){y=V;break}else{v=V;z=F}}i=s;return y|0}function bN(b,d,e,f,h,i,j,k){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0.0;if((d|0)>=(e|0)){return}l=b+8|0;b=j+12|0;m=j+16|0;n=j+24|0;o=j+8|0;p=j+4|0;q=j|0;r=j+44|0;s=j+20|0;j=d;while(1){d=i+(j<<2)|0;t=c[d>>2]|0;L2970:do{if((t|0)>=1){u=65536<<t>>16;v=+(u|0);w=u-1|0;u=0;x=t;while(1){y=~~+N(+(v*(+g[h+($(c[l>>2]|0,u)+j<<2)>>2]+.5)));z=(y|0)>(w|0)?w:y;y=(z|0)<0?0:z;z=c[b>>2]|0;A=c[m>>2]|0;if((A+x|0)>>>0>32){B=7-A|0;C=((B|0)>-8?B:-8)+A|0;B=A;D=z;while(1){E=c[o>>2]|0;F=c[p>>2]|0;if((E+(c[n>>2]|0)|0)>>>0<F>>>0){G=E+1|0;c[o>>2]=G;a[(c[q>>2]|0)+(F-G|0)|0]=D&255;H=0}else{H=-1}c[r>>2]=c[r>>2]|H;I=D>>>8;G=B-8|0;if((G|0)>7){B=G;D=I}else{break}}J=(A-8|0)-(C&-8)|0;K=I}else{J=A;K=z}c[b>>2]=y<<J|K;c[m>>2]=J+x|0;c[s>>2]=(c[s>>2]|0)+x|0;L=(+(y|0)+.5)*+(1<<14-(c[d>>2]|0)|0)*6103515625.0e-14+-.5;D=f+($(c[l>>2]|0,u)+j<<2)|0;g[D>>2]=+g[D>>2]+L;D=h+($(c[l>>2]|0,u)+j<<2)|0;g[D>>2]=+g[D>>2]-L;D=u+1|0;if((D|0)>=(k|0)){break L2970}u=D;x=c[d>>2]|0}}}while(0);d=j+1|0;if((d|0)==(e|0)){break}else{j=d}}return}function bO(a,b,e,f,h,j,k,l){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0.0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0.0,aa=0.0;m=i;i=i+8|0;n=m|0;o=n;c[o>>2]=0;c[o+4>>2]=0;if((h|0)==0){p=+g[5250892+(l<<2)>>2];q=+g[5261200+(l<<2)>>2]}else{p=0.0;q=.149993896484375}o=j+4|0;r=c[o>>2]<<3;if((b|0)>=(e|0)){i=m;return}s=j+20|0;t=j+28|0;u=a+8|0;a=j+32|0;v=j+40|0;w=j+24|0;x=j|0;y=b;while(1){b=(y|0)<20?y<<1:40;z=5259228+(l*84&-1)+(h*42&-1)+b|0;A=(b|1)+(5259228+(l*84&-1)+(h*42&-1))|0;b=0;while(1){B=c[s>>2]|0;C=c[t>>2]|0;D=(r-B|0)-(dG(C|0)|-32)|0;do{if((D|0)>14){E=bB(j,(d[z]|0)<<7,(d[A]|0)<<6)|0}else{if((D|0)>1){F=c[a>>2]|0;G=C>>>2;H=-1;I=C;while(1){J=H+1|0;K=$(d[J+5246204|0]|0,G);if(F>>>0<K>>>0){H=J;I=K}else{break}}H=F-K|0;c[a>>2]=H;G=I-K|0;c[t>>2]=G;L3004:do{if(G>>>0<8388609){L=c[o>>2]|0;M=B;N=G;O=c[v>>2]|0;P=c[w>>2]|0;Q=H;while(1){R=M+8|0;c[s>>2]=R;S=N<<8;c[t>>2]=S;if(P>>>0<L>>>0){T=P+1|0;c[w>>2]=T;U=d[(c[x>>2]|0)+P|0]|0;V=T}else{U=0;V=P}c[v>>2]=U;T=((U|O<<8)>>>1&255|Q<<8&2147483392)^255;c[a>>2]=T;if(S>>>0<8388609){M=R;N=S;O=U;P=V;Q=T}else{break L3004}}}}while(0);E=J>>1^-(J&1);break}if((D|0)<=0){E=-1;break}H=c[a>>2]|0;G=C>>>1;I=H>>>0<G>>>0;F=I&1;if(I){W=G;X=H}else{I=H-G|0;c[a>>2]=I;W=C-G|0;X=I}c[t>>2]=W;L3017:do{if(W>>>0<8388609){I=c[o>>2]|0;G=B;H=W;Q=c[v>>2]|0;P=c[w>>2]|0;O=X;while(1){N=G+8|0;c[s>>2]=N;M=H<<8;c[t>>2]=M;if(P>>>0<I>>>0){L=P+1|0;c[w>>2]=L;Y=d[(c[x>>2]|0)+P|0]|0;Z=L}else{Y=0;Z=P}c[v>>2]=Y;L=((Y|Q<<8)>>>1&255|O<<8&2147483392)^255;c[a>>2]=L;if(M>>>0<8388609){G=N;H=M;Q=Y;P=Z;O=L}else{break L3017}}}}while(0);E=-F|0}}while(0);_=+(E|0);B=f+($(c[u>>2]|0,b)+y<<2)|0;aa=+g[B>>2];g[B>>2]=aa<-9.0?-9.0:aa;B=f+($(c[u>>2]|0,b)+y<<2)|0;C=n+(b<<2)|0;aa=+g[C>>2];g[B>>2]=_+(p*+g[B>>2]+aa);g[C>>2]=_+aa-q*_;C=b+1|0;if((C|0)<(k|0)){b=C}else{break}}b=y+1|0;if((b|0)==(e|0)){break}else{y=b}}i=m;return}function bP(a,b,e,f,h,i,j,k,l){a=a|0;b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0;m=(b|0)>=(e|0);n=k+12|0;o=k+16|0;p=k+8|0;q=k+4|0;r=k|0;s=k+20|0;k=a+8|0;a=(l|0)>1?-l|0:-1;t=0;u=j;while(1){L3032:do{if(m|(u|0)<(l|0)){v=u}else{j=b;w=u;while(1){x=h+(j<<2)|0;do{if((c[x>>2]|0)>7){y=w}else{if((c[i+(j<<2)>>2]|0)==(t|0)){z=0}else{y=w;break}while(1){A=c[n>>2]|0;B=c[o>>2]|0;if((B|0)==0){C=c[p>>2]|0;D=c[q>>2]|0;if(C>>>0<D>>>0){E=C+1|0;c[p>>2]=E;F=d[(c[r>>2]|0)+(D-E|0)|0]|0;G=E}else{F=0;G=C}if(G>>>0<D>>>0){C=G+1|0;c[p>>2]=C;H=(d[(c[r>>2]|0)+(D-C|0)|0]|0)<<8;I=C}else{H=0;I=G}if(I>>>0<D>>>0){C=I+1|0;c[p>>2]=C;J=(d[(c[r>>2]|0)+(D-C|0)|0]|0)<<16;K=C}else{J=0;K=I}if(K>>>0<D>>>0){C=K+1|0;c[p>>2]=C;L=(d[(c[r>>2]|0)+(D-C|0)|0]|0)<<24}else{L=0}M=L|(J|(H|(F|A)));N=32}else{M=A;N=B}c[n>>2]=M>>>1;c[o>>2]=N-1|0;c[s>>2]=(c[s>>2]|0)+1|0;O=(+(M&1|0)+-.5)*+(1<<13-(c[x>>2]|0)|0)*6103515625.0e-14;B=f+($(c[k>>2]|0,z)+j<<2)|0;g[B>>2]=+g[B>>2]+O;B=z+1|0;if((B|0)<(l|0)){z=B}else{break}}y=a+w|0}}while(0);x=j+1|0;if((x|0)>=(e|0)|(y|0)<(l|0)){v=y;break L3032}else{j=x;w=y}}}}while(0);w=t+1|0;if((w|0)==2){break}else{t=w;u=v}}return}function bQ(a,e,f,g,h,j,k,l,m,n,o,p,q,r,s,t,u,v,w){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;u=u|0;v=v|0;w=w|0;var x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0;x=i;y=(m|0)>0?m:0;m=c[a+8>>2]|0;z=(y|0)>7?8:0;A=y-z|0;y=(r|0)==2;do{if(y){B=d[5263088+(f-e|0)|0]|0;if((B|0)>(A|0)){C=A;D=0;E=0;break}F=A-B|0;G=(F|0)>7?8:0;C=F-G|0;D=G;E=B}else{C=A;D=0;E=0}}while(0);A=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;B=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;G=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;F=i;i=i+(m*4&-1)|0;i=i+3>>2<<2;H=(e|0)<(f|0);L3063:do{if(H){I=r<<3;J=a+32|0;K=c[J>>2]|0;L=f-1|0;M=$((j-5|0)-s|0,r);N=s+3|0;O=e;P=b[K+(e<<1)>>1]|0;while(1){Q=O+1|0;R=b[K+(Q<<1)>>1]|0;S=(R<<16>>16)-(P<<16>>16)|0;T=(S*3&-1)<<s<<3>>4;c[G+(O<<2)>>2]=(I|0)>(T|0)?I:T;c[F+(O<<2)>>2]=($($(M,L-O|0),S)<<N>>6)-((S<<s|0)==1?I:0)|0;if((Q|0)==(f|0)){U=J;V=I;break L3063}else{O=Q;P=R}}}else{U=a+32|0;V=r<<3}}while(0);j=c[a+48>>2]|0;P=a+52|0;O=1;I=j-1|0;while(1){J=O+I>>1;L3071:do{if(H){N=c[U>>2]|0;L=$(J,m);M=c[P>>2]|0;K=1;R=0;Q=f;S=b[N+(f<<1)>>1]|0;while(1){T=R;W=Q;X=S;while(1){Y=W-1|0;Z=b[N+(Y<<1)>>1]|0;_=$((X<<16>>16)-(Z<<16>>16)|0,r);aa=$(_,d[M+(Y+L|0)|0]|0)<<s>>2;if((aa|0)>0){_=(c[F+(Y<<2)>>2]|0)+aa|0;ab=(_|0)<0?0:_}else{ab=aa}ac=(c[g+(Y<<2)>>2]|0)+ab|0;if(!((ac|0)<(c[G+(Y<<2)>>2]|0)&K)){break}aa=((ac|0)<(V|0)?0:V)+T|0;if((Y|0)>(e|0)){T=aa;W=Y;X=Z}else{ad=aa;break L3071}}X=c[h+(Y<<2)>>2]|0;W=((ac|0)<(X|0)?ac:X)+T|0;if((Y|0)>(e|0)){K=0;R=W;Q=Y;S=Z}else{ad=W;break L3071}}}else{ad=0}}while(0);S=(ad|0)>(C|0);Q=S?J-1|0:I;ae=S?O:J+1|0;if((ae|0)>(Q|0)){break}else{O=ae;I=Q}}I=ae-1|0;L3084:do{if(H){O=c[U>>2]|0;ad=$(I,m);Z=c[P>>2]|0;Y=(ae|0)<(j|0);ac=$(ae,m);ab=(I|0)>0;Q=e;S=e;R=b[O+(e<<1)>>1]|0;while(1){K=S+1|0;L=b[O+(K<<1)>>1]|0;M=$((L<<16>>16)-(R<<16>>16)|0,r);N=$(M,d[Z+(S+ad|0)|0]|0)<<s>>2;if(Y){af=$(d[Z+(S+ac|0)|0]|0,M)<<s>>2}else{af=c[h+(S<<2)>>2]|0}if((N|0)>0){M=(c[F+(S<<2)>>2]|0)+N|0;ag=(M|0)<0?0:M}else{ag=N}if((af|0)>0){N=(c[F+(S<<2)>>2]|0)+af|0;ah=(N|0)<0?0:N}else{ah=af}N=c[g+(S<<2)>>2]|0;M=ag+(ab?N:0)|0;W=(N|0)>0?S:Q;X=(ah-M|0)+N|0;c[A+(S<<2)>>2]=M;c[B+(S<<2)>>2]=(X|0)<0?0:X;if((K|0)==(f|0)){ai=W;break L3084}else{Q=W;S=K;R=L}}}else{ai=e}}while(0);ah=(r|0)>1;ag=0;g=64;af=0;while(1){F=g+af>>1;L3101:do{if(H){I=1;m=0;ae=f;while(1){j=m;P=ae;while(1){aj=P-1|0;R=c[A+(aj<<2)>>2]|0;ak=($(c[B+(aj<<2)>>2]|0,F)>>6)+R|0;if(!((ak|0)<(c[G+(aj<<2)>>2]|0)&I)){break}R=((ak|0)<(V|0)?0:V)+j|0;if((aj|0)>(e|0)){j=R;P=aj}else{al=R;break L3101}}P=c[h+(aj<<2)>>2]|0;T=((ak|0)<(P|0)?ak:P)+j|0;if((aj|0)>(e|0)){I=0;m=T;ae=aj}else{al=T;break L3101}}}else{al=0}}while(0);ae=(al|0)>(C|0);am=ae?af:F;m=ag+1|0;if((m|0)==6){break}else{ag=m;g=ae?F:g;af=am}}af=ah&1;g=s<<3;L3110:do{if(H){ag=0;al=0;aj=f;while(1){ak=aj-1|0;ae=c[A+(ak<<2)>>2]|0;m=($(c[B+(ak<<2)>>2]|0,am)>>6)+ae|0;if((m|0)<(c[G+(ak<<2)>>2]|0)&(ag|0)==0){an=(m|0)<(V|0)?0:V;ao=0}else{an=m;ao=1}m=c[h+(ak<<2)>>2]|0;ae=(an|0)<(m|0)?an:m;c[o+(ak<<2)>>2]=ae;m=ae+al|0;if((ak|0)>(e|0)){ag=ao;al=m;aj=ak}else{ap=m;break L3110}}}else{ap=0}}while(0);ao=f-1|0;L3117:do{if((ao|0)>(ai|0)){an=V+8|0;am=(u|0)==0;B=t+28|0;A=t+32|0;H=t+20|0;aj=t+40|0;al=t+24|0;ag=t+4|0;F=t|0;m=e+2|0;ak=f;ae=ap;I=E;T=ao;while(1){P=C-ae|0;R=c[U>>2]|0;S=b[R+(ak<<1)>>1]|0;Q=b[R+(e<<1)>>1]|0;ab=S-Q|0;ac=(P|0)/(ab|0)&-1;Z=P-$(ab,ac)|0;ab=b[R+(T<<1)>>1]|0;R=Z+(Q-ab|0)|0;Q=S-ab|0;ab=o+(T<<2)|0;S=c[ab>>2]|0;Z=($(Q,ac)+S|0)+((R|0)>0?R:0)|0;R=c[G+(T<<2)>>2]|0;if((Z|0)<(((R|0)>(an|0)?R:an)|0)){aq=ae;ar=Z;as=S}else{if(am){S=c[B>>2]|0;R=c[A>>2]|0;ac=S>>>1;P=R>>>0<ac>>>0;if(P){at=ac;au=R}else{Y=R-ac|0;c[A>>2]=Y;at=S-ac|0;au=Y}c[B>>2]=at;L3128:do{if(at>>>0<8388609){Y=c[ag>>2]|0;ac=c[H>>2]|0;S=at;R=c[aj>>2]|0;ad=c[al>>2]|0;O=au;while(1){J=ac+8|0;c[H>>2]=J;L=S<<8;c[B>>2]=L;if(ad>>>0<Y>>>0){K=ad+1|0;c[al>>2]=K;av=d[(c[F>>2]|0)+ad|0]|0;aw=K}else{av=0;aw=ad}c[aj>>2]=av;K=((av|R<<8)>>>1&255|O<<8&2147483392)^255;c[A>>2]=K;if(L>>>0<8388609){ac=J;S=L;R=av;ad=aw;O=K}else{break L3128}}}}while(0);if(P){ax=C;ay=ak;az=ae;aA=I;break L3117}}else{if((ak|0)<=(m|0)){break}if(!((Z|0)<=($(Q,(T|0)<(v|0)?7:9)<<s<<3>>4|0)|(T|0)>(w|0))){break}bv(t,0,1)}aq=ae+8|0;ar=Z-8|0;as=c[ab>>2]|0}if((I|0)>0){aB=d[5263088+(T-e|0)|0]|0}else{aB=I}O=(ar|0)<(V|0)?0:V;ad=((aq-(as+I|0)|0)+O|0)+aB|0;c[ab>>2]=O;O=T-1|0;if((O|0)>(ai|0)){ak=T;ae=ad;I=aB;T=O}else{aC=T;aD=ad;aE=aB;aF=2128;break L3117}}bv(t,1,1);ax=C;ay=ak;az=ae;aA=I;break}else{aC=f;aD=ap;aE=E;aF=2128}}while(0);if((aF|0)==2128){ax=C+z|0;ay=aC;az=aD;aA=aE}do{if((aA|0)>0){if((u|0)==0){aE=(bt(t,(1-e|0)+ay|0)|0)+e|0;c[k>>2]=aE;aG=aE;break}else{aE=c[k>>2]|0;aD=(aE|0)<(ay|0)?aE:ay;c[k>>2]=aD;bx(t,aD-e|0,(1-e|0)+ay|0);aG=c[k>>2]|0;break}}else{c[k>>2]=0;aG=0}}while(0);aA=(aG|0)>(e|0);aG=aA?0:D;do{if(aA&(D|0)!=0){if((u|0)!=0){bv(t,c[l>>2]|0,1);break}aD=t+28|0;aE=c[aD>>2]|0;aC=t+32|0;z=c[aC>>2]|0;C=aE>>>1;aF=z>>>0<C>>>0;E=aF&1;if(aF){aH=C;aI=z}else{aF=z-C|0;c[aC>>2]=aF;aH=aE-C|0;aI=aF}c[aD>>2]=aH;L3163:do{if(aH>>>0<8388609){aF=t+20|0;C=t+40|0;aE=t+24|0;z=t|0;ap=c[t+4>>2]|0;aB=c[aF>>2]|0;ai=aH;as=c[C>>2]|0;aq=c[aE>>2]|0;ar=aI;while(1){w=aB+8|0;c[aF>>2]=w;v=ai<<8;c[aD>>2]=v;if(aq>>>0<ap>>>0){aw=aq+1|0;c[aE>>2]=aw;aJ=d[(c[z>>2]|0)+aq|0]|0;aK=aw}else{aJ=0;aK=aq}c[C>>2]=aJ;aw=((aJ|as<<8)>>>1&255|ar<<8&2147483392)^255;c[aC>>2]=aw;if(v>>>0<8388609){aB=w;ai=v;as=aJ;aq=aK;ar=aw}else{break L3163}}}}while(0);c[l>>2]=E}else{c[l>>2]=0}}while(0);aK=aG+(ax-az|0)|0;az=c[U>>2]|0;ax=b[az+(e<<1)>>1]|0;aG=(b[az+(ay<<1)>>1]|0)-ax|0;aJ=(aK|0)/(aG|0)&-1;aI=aK-$(aG,aJ)|0;L3173:do{if((ay|0)>(e|0)){aG=e+1|0;aK=$((b[az+(aG<<1)>>1]|0)-ax|0,aJ);aH=o+(e<<2)|0;c[aH>>2]=aK+(c[aH>>2]|0)|0;L3175:do{if((aG|0)==(ay|0)){aL=aI;aM=e}else{aH=aG;while(1){aK=c[U>>2]|0;t=aH+1|0;u=$((b[aK+(t<<1)>>1]|0)-(b[aK+(aH<<1)>>1]|0)|0,aJ);aK=o+(aH<<2)|0;c[aK>>2]=u+(c[aK>>2]|0)|0;if((t|0)==(ay|0)){aL=aI;aM=e;break L3175}else{aH=t}}}}while(0);while(1){aG=aM+1|0;E=c[U>>2]|0;aH=(b[E+(aG<<1)>>1]|0)-(b[E+(aM<<1)>>1]|0)|0;E=(aL|0)<(aH|0)?aL:aH;aH=o+(aM<<2)|0;c[aH>>2]=E+(c[aH>>2]|0)|0;if((aG|0)==(ay|0)){break}aL=aL-E|0;aM=aG}aG=a+56|0;E=ah?4:3;aH=0;t=e;while(1){aK=t+1|0;u=c[U>>2]|0;D=(b[u+(aK<<1)>>1]|0)-(b[u+(t<<1)>>1]|0)<<s;u=o+(t<<2)|0;aA=(c[u>>2]|0)+aH|0;if((D|0)>1){aC=aA-(c[h+(t<<2)>>2]|0)|0;aD=(aC|0)>0?aC:0;aC=aA-aD|0;c[u>>2]=aC;I=$(D,r);do{if(y&(D|0)>2){if((c[l>>2]|0)!=0){aN=0;break}aN=(t|0)<(c[k>>2]|0)}else{aN=0}}while(0);ae=(aN&1)+I|0;ak=$((b[(c[aG>>2]|0)+(t<<1)>>1]|0)+g|0,ae);ar=(ak>>1)+(ae*-21&-1)|0;if((D|0)==2){aO=ar+(ae<<3>>2)|0}else{aO=ar}ar=aO+aC|0;do{if((ar|0)<(ae<<4|0)){aP=aO+(ak>>2)|0}else{if((ar|0)>=(ae*24&-1|0)){aP=aO;break}aP=aO+(ak>>3)|0}}while(0);ak=ae<<3;ar=(((ae<<2)+aC|0)+aP|0)/(ak|0)&-1;D=(ar|0)<0?0:ar;ar=p+(t<<2)|0;c[ar>>2]=D;I=$(D,r);aq=c[u>>2]|0;if((I|0)>(aq>>3|0)){I=aq>>af>>3;c[ar>>2]=I;aQ=I}else{aQ=D}D=(aQ|0)<8?aQ:8;c[ar>>2]=D;I=$(D,ak);c[q+(t<<2)>>2]=(I|0)>=((c[u>>2]|0)+aP|0)&1;I=$(c[ar>>2]|0,V);c[u>>2]=(c[u>>2]|0)-I|0;aR=aD}else{I=aA-V|0;ar=(I|0)<0?0:I;c[u>>2]=aA-ar|0;c[p+(t<<2)>>2]=0;c[q+(t<<2)>>2]=1;aR=ar}if((aR|0)>0){ar=aR>>E;I=p+(t<<2)|0;ak=c[I>>2]|0;D=8-ak|0;aq=(ar|0)<(D|0)?ar:D;c[I>>2]=aq+ak|0;ak=$(aq,V);c[q+(t<<2)>>2]=(ak|0)>=(aR-aH|0)&1;aS=aR-ak|0}else{aS=aR}if((aK|0)==(ay|0)){aT=aS;aU=ay;break L3173}else{aH=aS;t=aK}}}else{aT=0;aU=e}}while(0);c[n>>2]=aT;if((aU|0)<(f|0)){aV=aU}else{i=x;return ay|0}while(1){aU=o+(aV<<2)|0;aT=p+(aV<<2)|0;c[aT>>2]=c[aU>>2]>>af>>3;c[aU>>2]=0;c[q+(aV<<2)>>2]=(c[aT>>2]|0)<1&1;aT=aV+1|0;if((aT|0)==(f|0)){break}else{aV=aT}}i=x;return ay|0}function bR(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0,z=0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0,G=0,H=0,I=0;j=i;k=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;l=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;m=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;bS(a,b,1,f,d,e);e=(b|0)>1?b<<2:4;dF(l|0,0,e|0);dF(k|0,0,e|0);e=0;while(1){n=a+(e<<2)|0;o=+g[n>>2];p=m+(e<<2)|0;if(o>0.0){g[p>>2]=1.0}else{g[p>>2]=-1.0;g[n>>2]=-0.0-o}n=e+1|0;if((n|0)<(b|0)){e=n}else{break}}L3220:do{if((b>>1|0)<(d|0)){e=0;o=0.0;while(1){q=o+ +g[a+(e<<2)>>2];n=e+1|0;if((n|0)<(b|0)){e=n;o=q}else{break}}if(q>1.0000000036274937e-15&q<64.0){r=q}else{g[a>>2]=1.0;dF(a+4|0,0,((b|0)>2?(b<<2)-4|0:4)|0);r=1.0}o=+(d-1|0)*(1.0/r);e=0;n=d;s=0.0;t=0.0;while(1){u=+g[a+(e<<2)>>2];p=~~+N(+(o*u));c[l+(e<<2)>>2]=p;v=+(p|0);w=t+v*v;x=s+u*v;g[k+(e<<2)>>2]=v*2.0;y=n-p|0;p=e+1|0;if((p|0)<(b|0)){e=p;n=y;s=x;t=w}else{z=y;A=x;B=w;break L3220}}}else{z=d;A=0.0;B=0.0}}while(0);L3230:do{if((z|0)>(b+3|0)){c[l>>2]=(c[l>>2]|0)+z|0;C=0;break}else{if((z|0)>0){D=B;E=A;F=0}else{C=0;break}while(1){r=D+1.0;n=0;q=0.0;t=-999999986991104.0;e=0;while(1){s=E+ +g[a+(n<<2)>>2];o=r+ +g[k+(n<<2)>>2];w=s*s;y=q*w>t*o;G=y?n:e;p=n+1|0;if((p|0)>=(b|0)){break}n=p;q=y?o:q;t=y?w:t;e=G}t=E+ +g[a+(G<<2)>>2];e=k+(G<<2)|0;q=+g[e>>2];g[e>>2]=q+2.0;e=l+(G<<2)|0;c[e>>2]=(c[e>>2]|0)+1|0;e=F+1|0;if((e|0)==(z|0)){C=0;break L3230}else{D=r+q;E=t;F=e}}}}while(0);while(1){E=+g[m+(C<<2)>>2];F=a+(C<<2)|0;g[F>>2]=E*+g[F>>2];if(E<0.0){F=l+(C<<2)|0;c[F>>2]=-(c[F>>2]|0)|0}F=C+1|0;if((F|0)<(b|0)){C=F}else{break}}bq(l,b,d,h);if((f|0)<2){H=1;i=j;return H|0}h=(b|0)/(f|0)&-1;b=0;d=0;while(1){C=$(b,h);a=0;m=d;while(1){I=((c[l+(a+C<<2)>>2]|0)!=0&1)<<b|m;F=a+1|0;if((F|0)<(h|0)){a=F;m=I}else{break}}m=b+1|0;if((m|0)==(f|0)){H=I;break}else{b=m;d=I}}i=j;return H|0}function bS(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0.0,j=0.0,k=0.0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0.0,v=0,w=0,x=0,y=0.0,z=0,A=0.0,B=0.0,C=0,D=0;if((f<<1|0)>=(b|0)|(h|0)==0){return}i=+(b|0)/+($(c[5259172+(h-1<<2)>>2]|0,f)+b|0);j=i*i*.5;i=+R(+(j*1.5707963705062866));k=+R(+((1.0-j)*1.5707963705062866));L3258:do{if((e<<3|0)>(b|0)){l=0}else{f=e>>2;h=1;while(1){if(($($(h,h)+h|0,e)+f|0)<(b|0)){h=h+1|0}else{l=h;break L3258}}}}while(0);h=(b|0)/(e|0)&-1;if((e|0)<=0){return}b=(d|0)<0;d=(l|0)==0;f=h-1|0;m=(f|0)>0;n=h-3|0;o=(h-2|0)>0;p=h-l|0;q=(p|0)>0;r=h-(l<<1)|0;s=r-1|0;t=(r|0)>0;j=-0.0-k;u=-0.0-i;r=0;while(1){v=$(r,h);L3268:do{if(b){L3289:do{if(!d){L3291:do{if(q){w=a+(v<<2)|0;x=0;while(1){y=+g[w>>2];z=w+(l<<2)|0;A=+g[z>>2];g[z>>2]=i*y+k*A;g[w>>2]=k*y-i*A;z=x+1|0;if((z|0)==(p|0)){break L3291}else{w=w+4|0;x=z}}}}while(0);if(!t){break}x=a+(v+s<<2)|0;w=s;while(1){A=+g[x>>2];z=x+(l<<2)|0;y=+g[z>>2];g[z>>2]=i*A+k*y;g[x>>2]=k*A-i*y;if((w|0)>0){x=x-4|0;w=w-1|0}else{break L3289}}}}while(0);L3300:do{if(m){w=a+(v<<2)|0;x=w;z=0;y=+g[w>>2];while(1){w=x+4|0;A=+g[w>>2];B=k*y+i*A;g[w>>2]=B;g[x>>2]=i*y-k*A;C=z+1|0;if((C|0)==(f|0)){break L3300}else{x=w;z=C;y=B}}}}while(0);if(!o){break}z=a+(v+n<<2)|0;x=n;while(1){y=+g[z>>2];C=z+4|0;B=+g[C>>2];g[C>>2]=k*y+i*B;g[z>>2]=i*y-k*B;if((x|0)>0){z=z-4|0;x=x-1|0}else{break L3268}}}else{x=a+(v<<2)|0;L3270:do{if(m){z=x;C=0;B=+g[x>>2];while(1){w=z+4|0;y=+g[w>>2];A=B*j+i*y;g[w>>2]=A;g[z>>2]=i*B-y*j;D=C+1|0;if((D|0)==(f|0)){break L3270}else{z=w;C=D;B=A}}}}while(0);L3275:do{if(o){C=a+(v+n<<2)|0;z=n;while(1){B=+g[C>>2];D=C+4|0;A=+g[D>>2];g[D>>2]=B*j+i*A;g[C>>2]=i*B-A*j;if((z|0)>0){C=C-4|0;z=z-1|0}else{break L3275}}}}while(0);if(d){break}L3281:do{if(q){z=x;C=0;while(1){A=+g[z>>2];D=z+(l<<2)|0;B=+g[D>>2];g[D>>2]=A*u+k*B;g[z>>2]=k*A-B*u;D=C+1|0;if((D|0)==(p|0)){break L3281}else{z=z+4|0;C=D}}}}while(0);if(!t){break}x=a+(v+s<<2)|0;C=s;while(1){B=+g[x>>2];z=x+(l<<2)|0;A=+g[z>>2];g[z>>2]=B*u+k*A;g[x>>2]=k*B-A*u;if((C|0)>0){x=x-4|0;C=C-1|0}else{break L3268}}}}while(0);v=r+1|0;if((v|0)==(e|0)){break}else{r=v}}return}function bT(a,b,d,e,f,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=+j;var k=0,l=0,m=0.0,n=0.0,o=0.0,p=0,q=0,r=0,s=0;k=i;l=i;i=i+(b*4&-1)|0;i=i+3>>2<<2;bs(l,b,d,h);h=0;m=0.0;while(1){n=+(c[l+(h<<2)>>2]|0);o=m+n*n;p=h+1|0;if((p|0)<(b|0)){h=p;m=o}else{break}}m=1.0/+P(+o)*j;h=0;while(1){g[a+(h<<2)>>2]=m*+(c[l+(h<<2)>>2]|0);p=h+1|0;if((p|0)<(b|0)){h=p}else{break}}bS(a,b,-1,f,d,e);if((f|0)<2){q=1;i=k;return q|0}e=(b|0)/(f|0)&-1;b=0;d=0;while(1){a=$(b,e);h=0;p=d;while(1){r=((c[l+(h+a<<2)>>2]|0)!=0&1)<<b|p;s=h+1|0;if((s|0)<(e|0)){h=s;p=r}else{break}}p=b+1|0;if((p|0)==(f|0)){q=r;break}else{b=p;d=r}}i=k;return q|0}function bU(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;k=i;i=i+4|0;l=k|0;a[l+1|0]=0;m=((g<<1)+h<<16>>16)*7&-1;h=f+8>>4;if((h|0)<=0){i=k;return}f=l|0;g=b+28|0;n=b+32|0;o=b+20|0;p=b+40|0;q=b+24|0;r=b+4|0;s=b|0;b=0;t=e;while(1){e=c[j+(b<<2)>>2]|0;L3332:do{if((e|0)>0){u=e&31;a[f]=a[5246312+((u>>>0<6?u:6)+m|0)|0]|0;u=0;while(1){v=t+(u<<2)|0;if((c[v>>2]|0)>0){w=c[g>>2]|0;x=c[n>>2]|0;y=w>>>8;z=0;A=w;while(1){B=$(d[l+z|0]|0,y);if(x>>>0>=B>>>0){break}z=z+1|0;A=B}y=x-B|0;c[n>>2]=y;w=A-B|0;c[g>>2]=w;L3342:do{if(w>>>0<8388609){C=c[r>>2]|0;D=c[o>>2]|0;E=w;F=c[p>>2]|0;G=c[q>>2]|0;H=y;while(1){I=D+8|0;c[o>>2]=I;J=E<<8;c[g>>2]=J;if(G>>>0<C>>>0){K=G+1|0;c[q>>2]=K;L=d[(c[s>>2]|0)+G|0]|0;M=K}else{L=0;M=G}c[p>>2]=L;K=((L|F<<8)>>>1&255|H<<8&2147483392)^255;c[n>>2]=K;if(J>>>0<8388609){D=I;E=J;F=L;G=M;H=K}else{break L3342}}}}while(0);c[v>>2]=$(c[v>>2]|0,(z<<1)-1|0)}y=u+1|0;if((y|0)==16){break L3332}else{u=y}}}}while(0);e=b+1|0;if((e|0)==(h|0)){break}else{b=e;t=t+64|0}}i=k;return}function bV(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0;g=i;i=i+1376|0;h=g|0;j=g+32|0;k=a+2772|0;l=a+2316|0;m=c[l>>2]|0;n=a+4156|0;if((m|0)!=(c[n>>2]|0)){o=a+2340|0;p=c[o>>2]|0;q=32767/(p+1|0)&-1;if((p|0)>0){p=0;r=0;while(1){s=r+q|0;b[a+4052+(p<<1)>>1]=s&65535;t=p+1|0;if((t|0)<(c[o>>2]|0)){p=t;r=s}else{break}}u=c[l>>2]|0}else{u=m}c[a+4148>>2]=0;c[a+4152>>2]=3176576;c[n>>2]=u}u=a+4160|0;do{if((c[u>>2]|0)==0){if((c[a+4164>>2]|0)==0){n=a+2340|0;L3366:do{if((c[n>>2]|0)>0){m=0;while(1){l=a+4052+(m<<1)|0;r=b[l>>1]|0;p=(b[a+2344+(m<<1)>>1]|0)-r|0;b[l>>1]=(((p>>16)*16348&-1)+r|0)+(((p&65535)*16348&-1)>>>16)&65535;p=m+1|0;if((p|0)<(c[n>>2]|0)){m=p}else{break L3366}}}}while(0);n=a+2324|0;m=c[n>>2]|0;L3370:do{if((m|0)>0){p=0;r=0;l=0;while(1){o=c[d+16+(l<<2)>>2]|0;q=(o|0)>(r|0);s=q?l:p;t=l+1|0;if((t|0)<(m|0)){p=s;r=q?o:r;l=t}else{v=s;break L3370}}}else{v=0}}while(0);l=a+2332|0;r=c[l>>2]|0;p=k;dI(a+2772+(r<<2)|0,p|0,$((m<<2)-4|0,r)|0);r=c[l>>2]|0;dH(p|0,a+4+($(r,v)<<2)|0,r<<2);r=c[n>>2]|0;L3374:do{if((r|0)>0){p=a+4148|0;l=0;s=c[p>>2]|0;while(1){t=(c[d+16+(l<<2)>>2]|0)-s|0;o=(((t>>16)*4634&-1)+s|0)+(((t&65535)*4634&-1)>>>16)|0;c[p>>2]=o;t=l+1|0;if((t|0)<(r|0)){l=t;s=o}else{break L3374}}}}while(0);if((c[u>>2]|0)!=0){break}}dF(a+4084|0,0,c[a+2340>>2]<<2|0);i=g;return}}while(0);u=c[a+4148>>2]|0;d=255;while(1){if((d|0)>(f|0)){d=d>>1}else{break}}v=a+4152|0;k=c[v>>2]|0;r=(f|0)>0;L3385:do{if(r){n=u>>>4<<16>>16;m=(u>>19)+1>>1;s=0;l=k;while(1){p=$(l,196314165)+907633515|0;o=c[a+2772+((p>>24&d)<<2)>>2]|0;t=$(o>>16,n);q=$(o&65535,n)>>16;w=(t+$(o,m)|0)+q|0;do{if((w|0)>32767){x=32767}else{if((w|0)<-32768){x=-32768;break}x=w<<16>>16}}while(0);c[j+(s+16<<2)>>2]=x;w=s+1|0;if((w|0)==(f|0)){y=p;break L3385}else{s=w;l=p}}}else{y=k}}while(0);c[v>>2]=y;y=h|0;v=a+2340|0;cr(y,a+4052|0,c[v>>2]|0);k=a+4084|0;dH(j|0,k|0,64);L3394:do{if(r){a=b[y>>1]|0;x=b[h+2>>1]|0;d=b[h+4>>1]|0;u=b[h+6>>1]|0;l=b[h+8>>1]|0;s=b[h+10>>1]|0;m=b[h+12>>1]|0;n=b[h+14>>1]|0;w=b[h+16>>1]|0;q=b[h+18>>1]|0;o=b[h+20>>1]|0;t=b[h+22>>1]|0;z=b[h+24>>1]|0;A=b[h+26>>1]|0;B=b[h+28>>1]|0;C=b[h+30>>1]|0;D=0;E=c[j+60>>2]|0;F=c[j+52>>2]|0;G=c[j+44>>2]|0;H=c[j+36>>2]|0;I=c[j+28>>2]|0;while(1){J=c[v>>2]|0;K=$(a,E>>16);L=$(a,E&65535)>>16;M=c[j+(D+14<<2)>>2]|0;N=$(x,M>>16);O=$(x,M&65535)>>16;P=$(d,F>>16);Q=$(d,F&65535)>>16;R=c[j+(D+12<<2)>>2]|0;S=$(u,R>>16);T=$(u,R&65535)>>16;U=$(l,G>>16);V=$(l,G&65535)>>16;W=c[j+(D+10<<2)>>2]|0;X=$(s,W>>16);Y=$(s,W&65535)>>16;Z=$(m,H>>16);_=$(m,H&65535)>>16;aa=c[j+(D+8<<2)>>2]|0;ab=$(n,aa>>16);ac=$(n,aa&65535)>>16;ad=$(w,I>>16);ae=$(w,I&65535)>>16;af=c[j+(D+6<<2)>>2]|0;ag=$(q,af>>16);ah=(((((((((((((((((((K+(J>>1)|0)+L|0)+N|0)+O|0)+P|0)+Q|0)+S|0)+T|0)+U|0)+V|0)+X|0)+Y|0)+Z|0)+_|0)+ab|0)+ac|0)+ad|0)+ae|0)+ag|0)+($(q,af&65535)>>16)|0;if((J|0)==16){J=c[j+(D+5<<2)>>2]|0;af=$(o,J>>16);ag=$(o,J&65535)>>16;J=c[j+(D+4<<2)>>2]|0;ae=$(t,J>>16);ad=$(t,J&65535)>>16;J=c[j+(D+3<<2)>>2]|0;ac=$(z,J>>16);ab=$(z,J&65535)>>16;J=c[j+(D+2<<2)>>2]|0;_=$(A,J>>16);Z=$(A,J&65535)>>16;J=c[j+(D+1<<2)>>2]|0;Y=$(B,J>>16);X=$(B,J&65535)>>16;J=c[j+(D<<2)>>2]|0;V=$(C,J>>16);ai=(((((((((((af+ah|0)+ag|0)+ae|0)+ad|0)+ac|0)+ab|0)+_|0)+Z|0)+Y|0)+X|0)+V|0)+($(C,J&65535)>>16)|0}else{ai=ah}ah=j+(D+16<<2)|0;J=(c[ah>>2]|0)+(ai<<4)|0;c[ah>>2]=J;ah=e+(D<<1)|0;V=(b[ah>>1]|0)+((ai>>5)+1>>1)|0;if((V|0)>32767){aj=32767}else{aj=(V|0)<-32768?-32768:V&65535}b[ah>>1]=aj;ah=D+1|0;if((ah|0)==(f|0)){break L3394}else{D=ah;E=J;F=M;G=R;H=W;I=aa}}}}while(0);dH(k|0,j+(f<<2)|0,64);i=g;return}function bW(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0;if(a>>>0<=65535){b=a<<16>>16;do{if((a&65535)<<16>>16==0){c=16}else{do{if((b&65280|0)==0){d=(b&65520|0)==0;e=d?12:8;f=d?a:b>>>4}else{if((b&61440|0)==0){e=4;f=b>>>8;break}else{e=0;f=b>>>12;break}}}while(0);d=f<<16>>16;if((d&12|0)!=0){c=(d>>>3&1|e)^1;break}if((d&14|0)==0){c=e|3;break}else{c=e|2;break}}}while(0);g=c+16|0;return g|0}c=a>>>16;a=c<<16>>16;if((c|0)==0){g=16;return g|0}do{if((a&65280|0)==0){e=(a&65520|0)==0;h=e?12:8;i=e?c:a>>>4}else{if((a&61440|0)==0){h=4;i=a>>>8;break}else{h=0;i=a>>>12;break}}}while(0);a=i<<16>>16;if((a&12|0)!=0){g=(a>>>3&1|h)^1;return g|0}if((a&14|0)==0){g=h|3;return g|0}else{g=h|2;return g|0}return 0}function bX(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0;h=i;i=i+32|0;j=h|0;k=d+2336|0;l=c[k>>2]|0;m=i;i=i+(l*2&-1)|0;i=i+3>>2<<2;n=d+2328|0;o=c[n>>2]|0;p=i;i=i+((o+l|0)*4&-1)|0;i=i+3>>2<<2;l=d+2332|0;q=c[l>>2]|0;r=i;i=i+(q*4&-1)|0;i=i+3>>2<<2;s=i;i=i+((q+16|0)*4&-1)|0;i=i+3>>2<<2;q=d+2765|0;t=a[d+2767|0]|0;L3447:do{if((o|0)>0){u=(b[5248016+((a[q]|0)>>1<<2)+((a[d+2766|0]|0)<<1)>>1]|0)<<4;v=a[d+2770|0]|0;w=0;while(1){x=$(v,196314165)+907633515|0;y=g+(w<<2)|0;z=c[y>>2]<<14;A=d+4+(w<<2)|0;c[A>>2]=z;do{if((z|0)>0){B=z-1280|0;c[A>>2]=B;C=B}else{if((z|0)>=0){C=0;break}B=z|1280;c[A>>2]=B;C=B}}while(0);z=C+u|0;c[A>>2]=(x|0)<0?-z|0:z;z=w+1|0;if((z|0)<(c[n>>2]|0)){v=(c[y>>2]|0)+x|0;w=z}else{break L3447}}}}while(0);n=s;C=d+1284|0;dH(n|0,C|0,64);g=d+2324|0;if((c[g>>2]|0)<=0){dH(C|0,n|0,64);i=h;return}o=d+2340|0;w=j;v=d|0;u=d+4160|0;z=e+136|0;B=t<<24>>24>3;t=f;E=j|0;F=j+2|0;G=j+4|0;H=j+6|0;I=j+8|0;J=j+10|0;K=j+12|0;L=j+14|0;M=j+16|0;N=j+18|0;O=j+20|0;P=j+22|0;Q=j+24|0;R=j+26|0;S=j+28|0;T=j+30|0;j=d+4164|0;U=d+2308|0;V=f;f=c[k>>2]|0;W=0;X=d+4|0;while(1){Y=e+32+(W>>1<<5)|0;dH(w|0,Y|0,c[o>>2]<<1);Z=W*5&-1;_=e+96+(Z<<1)|0;aa=a[q]|0;ab=c[e+16+(W<<2)>>2]|0;ac=ab>>>6;ad=bW((ab|0)>0?ab:-ab|0)|0;ae=ab<<ad-1;af=ae>>16;ag=536870911/(af|0)&-1;ah=ag<<16;ai=ah>>16;aj=$(af,ai);af=(536870912-aj|0)-($(ae&65535,ai)>>16)<<3;aj=$(af>>16,ai);ak=$(af&65528,ai)>>16;al=(($(af,(ag>>15)+1>>1)+ah|0)+aj|0)+ak|0;ak=62-ad|0;aj=ak-47|0;if((aj|0)<1){ah=47-ak|0;ak=-2147483648>>ah;ag=2147483647>>>(ah>>>0);do{if((ak|0)>(ag|0)){if((al|0)>(ak|0)){am=ak;break}am=(al|0)<(ag|0)?ag:al}else{if((al|0)>(ag|0)){am=ag;break}am=(al|0)<(ak|0)?ak:al}}while(0);an=am<<ah}else{an=(aj|0)<32?al>>aj:0}ak=c[v>>2]|0;L3472:do{if((ab|0)==(ak|0)){ao=65536}else{ag=bW((ak|0)>0?ak:-ak|0)|0;af=ak<<ag-1;ap=$(ai,af>>16);aq=($(ai,af&65535)>>16)+ap|0;ap=ae;ar=(ae|0)<0?-1:0;as=aq;at=(aq|0)<0?-1:0;dT(as,at,ap,ar);ar=D;ap=af-(ar<<3|0>>>29)|0;ar=$(ap>>16,ai);af=(ar+aq|0)+($(ap&65535,ai)>>16)|0;ap=(ag+28|0)+(1-ad|0)|0;ag=ap-16|0;if((ag|0)<0){aq=16-ap|0;ap=-2147483648>>aq;ar=2147483647>>>(aq>>>0);do{if((ap|0)>(ar|0)){if((af|0)>(ap|0)){au=ap;break}au=(af|0)<(ar|0)?ar:af}else{if((af|0)>(ar|0)){au=ar;break}au=(af|0)<(ap|0)?ap:af}}while(0);av=au<<aq}else{av=(ag|0)<32?af>>ag:0}ap=av>>16;ar=av&65535;x=0;while(1){y=s+(x<<2)|0;A=c[y>>2]|0;at=A<<16>>16;as=$(at,ap);aw=($(at,ar)>>16)+as|0;c[y>>2]=aw+$((A>>15)+1>>1,av)|0;A=x+1|0;if((A|0)==16){ao=av;break L3472}else{x=A}}}}while(0);c[v>>2]=ab;do{if((c[u>>2]|0)==0){ax=2386}else{if((c[j>>2]|0)!=2){ax=2386;break}if(!(aa<<24>>24!=2&(W|0)<2)){ax=2386;break}dF(_|0,0,10);b[e+96+(Z+2<<1)>>1]=4096;ad=c[U>>2]|0;c[e+(W<<2)>>2]=ad;ay=ad;ax=2389;break}}while(0);do{if((ax|0)==2386){ax=0;if(aa<<24>>24==2){ay=c[e+(W<<2)>>2]|0;ax=2389;break}else{az=X;aA=f;aB=c[l>>2]|0;ax=2405;break}}}while(0);L3496:do{if((ax|0)==2389){ax=0;aa=(W|0)==0;L3498:do{if(aa){ad=c[k>>2]|0;ai=c[o>>2]|0;aC=((-2-ay|0)+ad|0)-ai|0;aD=ad;aE=ai;ax=2393;break}else{if(!((W|0)!=2|B)){ai=c[k>>2]|0;ad=((-2-ay|0)+ai|0)-(c[o>>2]|0)|0;dH(d+1348+(ai<<1)|0,t|0,c[l>>2]<<2);aC=ad;aD=c[k>>2]|0;aE=c[o>>2]|0;ax=2393;break}if((ao|0)==65536){break}ad=ay+2|0;if((ad|0)<=0){break}ai=ao>>16;ae=f-1|0;ak=ao&65535;aj=0;while(1){al=p+(ae-aj<<2)|0;ah=c[al>>2]|0;x=ah<<16>>16;ar=$(x,ai);ap=($(x,ak)>>16)+ar|0;c[al>>2]=ap+$((ah>>15)+1>>1,ao)|0;ah=aj+1|0;if((ah|0)==(ad|0)){break L3498}else{aj=ah}}}}while(0);L3508:do{if((ax|0)==2393){ax=0;co(m+(aC<<1)|0,d+1348+($(c[l>>2]|0,W)+aC<<1)|0,Y,aD-aC|0,aE);if(aa){aj=c[z>>2]<<16>>16;ad=$(aj,an>>16);aF=($(aj,an&65535)>>16)+ad<<2}else{aF=an}ad=ay+2|0;if((ad|0)<=0){break}aj=aF>>16;ak=c[k>>2]|0;ai=aF&65535;ae=f-1|0;ah=0;ap=0;while(1){al=b[m+((ap-1|0)+ak<<1)>>1]|0;ar=$(al,aj);c[p+(ae+ap<<2)>>2]=($(al,ai)>>16)+ar|0;ar=ah+1|0;al=ah^-1;if((ar|0)==(ad|0)){break L3508}else{ah=ar;ap=al}}}}while(0);aa=c[l>>2]|0;if((aa|0)<=0){aG=aa;aH=f;break}ap=b[_>>1]|0;ah=b[e+96+(Z+1<<1)>>1]|0;ad=b[e+96+(Z+2<<1)>>1]|0;ai=b[e+96+(Z+3<<1)>>1]|0;ae=b[e+96+(Z+4<<1)>>1]|0;aj=f;ak=p+((f+2|0)-ay<<2)|0;al=0;while(1){ar=c[ak>>2]|0;x=ap<<16>>16;ag=$(x,ar>>16);af=$(x,ar&65535)>>16;ar=c[ak-4>>2]|0;x=ah<<16>>16;aq=$(x,ar>>16);A=$(x,ar&65535)>>16;ar=c[ak-8>>2]|0;x=ad<<16>>16;aw=$(x,ar>>16);y=$(x,ar&65535)>>16;ar=c[ak-12>>2]|0;x=ai<<16>>16;as=$(x,ar>>16);at=$(x,ar&65535)>>16;ar=c[ak-16>>2]|0;x=ae<<16>>16;aI=$(x,ar>>16);aJ=(((((((((ag+2|0)+af|0)+aq|0)+A|0)+aw|0)+y|0)+as|0)+at|0)+aI|0)+($(x,ar&65535)>>16)|0;ar=(aJ<<1)+(c[X+(al<<2)>>2]|0)|0;c[r+(al<<2)>>2]=ar;c[p+(aj<<2)>>2]=ar<<1;ar=aj+1|0;aJ=al+1|0;if((aJ|0)<(aa|0)){aj=ar;ak=ak+4|0;al=aJ}else{az=r;aA=ar;aB=aa;ax=2405;break L3496}}}}while(0);L3520:do{if((ax|0)==2405){ax=0;if((aB|0)<=0){aG=aB;aH=aA;break}Z=ac<<16>>16;_=(ab>>21)+1>>1;Y=0;while(1){aa=c[o>>2]|0;al=c[s+(Y+15<<2)>>2]|0;ak=b[E>>1]|0;aj=$(ak,al>>16);ae=$(ak,al&65535)>>16;al=c[s+(Y+14<<2)>>2]|0;ak=b[F>>1]|0;ai=$(ak,al>>16);ad=$(ak,al&65535)>>16;al=c[s+(Y+13<<2)>>2]|0;ak=b[G>>1]|0;ah=$(ak,al>>16);ap=$(ak,al&65535)>>16;al=c[s+(Y+12<<2)>>2]|0;ak=b[H>>1]|0;ar=$(ak,al>>16);aJ=$(ak,al&65535)>>16;al=c[s+(Y+11<<2)>>2]|0;ak=b[I>>1]|0;x=$(ak,al>>16);aI=$(ak,al&65535)>>16;al=c[s+(Y+10<<2)>>2]|0;ak=b[J>>1]|0;at=$(ak,al>>16);as=$(ak,al&65535)>>16;al=c[s+(Y+9<<2)>>2]|0;ak=b[K>>1]|0;y=$(ak,al>>16);aw=$(ak,al&65535)>>16;al=c[s+(Y+8<<2)>>2]|0;ak=b[L>>1]|0;A=$(ak,al>>16);aq=$(ak,al&65535)>>16;al=c[s+(Y+7<<2)>>2]|0;ak=b[M>>1]|0;af=$(ak,al>>16);ag=$(ak,al&65535)>>16;al=c[s+(Y+6<<2)>>2]|0;ak=b[N>>1]|0;aK=$(ak,al>>16);aL=(((((((((((((((((((aj+(aa>>1)|0)+ae|0)+ai|0)+ad|0)+ah|0)+ap|0)+ar|0)+aJ|0)+x|0)+aI|0)+at|0)+as|0)+y|0)+aw|0)+A|0)+aq|0)+af|0)+ag|0)+aK|0)+($(ak,al&65535)>>16)|0;if((aa|0)==16){aa=c[s+(Y+5<<2)>>2]|0;al=b[O>>1]|0;ak=$(al,aa>>16);aK=$(al,aa&65535)>>16;aa=c[s+(Y+4<<2)>>2]|0;al=b[P>>1]|0;ag=$(al,aa>>16);af=$(al,aa&65535)>>16;aa=c[s+(Y+3<<2)>>2]|0;al=b[Q>>1]|0;aq=$(al,aa>>16);A=$(al,aa&65535)>>16;aa=c[s+(Y+2<<2)>>2]|0;al=b[R>>1]|0;aw=$(al,aa>>16);y=$(al,aa&65535)>>16;aa=c[s+(Y+1<<2)>>2]|0;al=b[S>>1]|0;as=$(al,aa>>16);at=$(al,aa&65535)>>16;aa=c[s+(Y<<2)>>2]|0;al=b[T>>1]|0;aI=$(al,aa>>16);aM=(((((((((((ak+aL|0)+aK|0)+ag|0)+af|0)+aq|0)+A|0)+aw|0)+y|0)+as|0)+at|0)+aI|0)+($(al,aa&65535)>>16)|0}else{aM=aL}aL=(c[az+(Y<<2)>>2]|0)+(aM<<4)|0;c[s+(Y+16<<2)>>2]=aL;aa=$(aL>>16,Z);al=$(aL&65535,Z)>>16;aI=((aa+$(aL,_)|0)+al>>7)+1>>1;if((aI|0)>32767){aN=32767}else{aN=(aI|0)<-32768?-32768:aI&65535}b[V+(Y<<1)>>1]=aN;aI=Y+1|0;al=c[l>>2]|0;if((aI|0)<(al|0)){Y=aI}else{aG=al;aH=aA;break L3520}}}}while(0);dH(n|0,s+(aG<<2)|0,64);ab=W+1|0;if((ab|0)>=(c[g>>2]|0)){break}V=V+(aG<<1)|0;f=aH;W=ab;X=X+(aG<<2)|0}dH(C|0,n|0,64);i=h;return}function bY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;j=i;i=i+140|0;k=j|0;l=b+2328|0;m=c[l>>2]|0;n=i;i=i+((m+15&-16)*4&-1)|0;i=i+3>>2<<2;o=k|0;c[k+136>>2]=0;do{if((g|0)==0){p=c[b+2388>>2]|0;q=2420;break}else if((g|0)==2){r=c[b+2388>>2]|0;if((c[b+2420+(r<<2)>>2]|0)==1){p=r;q=2420;break}else{q=2421;break}}else{q=2421}}while(0);if((q|0)==2421){r=c[b+2316>>2]|0;s=b+4248|0;if((r|0)!=(c[s>>2]|0)){c[b+4168>>2]=m<<7;c[b+4240>>2]=65536;c[b+4244>>2]=65536;c[b+4256>>2]=20;c[b+4252>>2]=2;c[s>>2]=r}b9(b,o,e);r=b+4160|0;c[r>>2]=(c[r>>2]|0)+1|0}else if((q|0)==2420){b_(b,d,p,g,h);g=b+2765|0;b$(d,n,a[g]|0,a[b+2766|0]|0,c[l>>2]|0);bZ(b,o,h);bX(b,o,e,n);b8(b,o,e,0);c[b+4160>>2]=0;c[b+4164>>2]=a[g]|0;c[b+2376>>2]=0}g=c[l>>2]|0;n=(c[b+2336>>2]|0)-g|0;dI(b+1348|0,b+1348+(g<<1)|0,n<<1|0);dH(b+1348+(n<<1)|0,e|0,c[l>>2]<<1);cb(b,e,m);bV(b,o,e,m);c[b+2308>>2]=c[k+((c[b+2324>>2]|0)-1<<2)>>2]|0;c[f>>2]=m;i=j;return 0}function bZ(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+64|0;h=g|0;j=g+32|0;k=d+2324|0;b4(e+16|0,d+2736|0,d+2312|0,(f|0)==2&1,c[k>>2]|0);f=h|0;b7(f,d+2744|0,c[d+2732>>2]|0);l=e+32|0;m=e+64|0;n=d+2340|0;cr(m|0,f,c[n>>2]|0);f=d+2767|0;do{if((c[d+2376>>2]|0)==1){a[f]=4;o=2432;break}else{p=a[f]|0;if(p<<24>>24>=4){o=2432;break}q=c[n>>2]|0;L3549:do{if((q|0)>0){r=p<<24>>24;s=0;while(1){t=b[d+2344+(s<<1)>>1]|0;b[j+(s<<1)>>1]=($((b[h+(s<<1)>>1]|0)-t|0,r)>>>2)+t&65535;t=s+1|0;if((t|0)<(q|0)){s=t}else{break L3549}}}}while(0);cr(l|0,j|0,q);break}}while(0);if((o|0)==2432){dH(l|0,m|0,c[n>>2]<<1)}m=c[n>>2]|0;dH(d+2344|0,h|0,m<<1);if((c[d+4160>>2]|0)!=0){h=m-1|0;L3560:do{if((h|0)>0){m=0;l=63570;while(1){o=e+32+(m<<1)|0;b[o>>1]=(($(b[o>>1]|0,l)>>>15)+1|0)>>>1&65535;o=(((l*-1966&-1)>>15)+1>>1)+l|0;j=m+1|0;if((j|0)==(h|0)){u=o;break L3560}else{m=j;l=o}}}else{u=63570}}while(0);l=e+32+(h<<1)|0;b[l>>1]=(($(b[l>>1]|0,u)>>>15)+1|0)>>>1&65535;u=(c[n>>2]|0)-1|0;L3564:do{if((u|0)>0){n=0;l=63570;while(1){h=e+64+(n<<1)|0;b[h>>1]=(($(b[h>>1]|0,l)>>>15)+1|0)>>>1&65535;h=(((l*-1966&-1)>>15)+1>>1)+l|0;m=n+1|0;if((m|0)==(u|0)){v=h;break L3564}else{n=m;l=h}}}else{v=63570}}while(0);l=e+64+(u<<1)|0;b[l>>1]=(($(b[l>>1]|0,v)>>>15)+1|0)>>>1&65535}if((a[d+2765|0]|0)!=2){dF(e|0,0,c[k>>2]<<2|0);dF(e+96|0,0,(c[k>>2]|0)*10&-1|0);a[d+2768|0]=0;c[e+136>>2]=0;i=g;return}v=c[d+2316>>2]|0;l=c[k>>2]|0;u=(l|0)==4;if((v|0)==8){w=u?5250752:5250744;x=u?11:3}else{w=u?5250608:5250584;x=u?34:12}u=v<<16;v=u>>15;n=(u>>16)*18&-1;u=v+(b[d+2762>>1]|0)|0;L3577:do{if((l|0)>0){h=a[d+2764|0]|0;m=(v|0)>(n|0);q=0;while(1){o=u+(a[w+($(q,x)+h|0)|0]|0)|0;j=e+(q<<2)|0;c[j>>2]=o;do{if(m){if((o|0)>(v|0)){y=v;break}y=(o|0)<(n|0)?n:o}else{if((o|0)>(n|0)){y=n;break}y=(o|0)<(v|0)?v:o}}while(0);c[j>>2]=y;o=q+1|0;if((o|0)==(l|0)){break}else{q=o}}q=c[5249920+((a[d+2768|0]|0)<<2)>>2]|0;if((c[k>>2]|0)>0){z=0}else{break}while(1){m=(a[z+(d+2740)|0]|0)*5&-1;h=z*5&-1;b[e+96+(h<<1)>>1]=(a[q+m|0]|0)<<7;b[e+96+(h+1<<1)>>1]=(a[q+(m+1|0)|0]|0)<<7;b[e+96+(h+2<<1)>>1]=(a[q+(m+2|0)|0]|0)<<7;b[e+96+(h+3<<1)>>1]=(a[q+(m+3|0)|0]|0)<<7;b[e+96+(h+4<<1)>>1]=(a[q+(m+4|0)|0]|0)<<7;m=z+1|0;if((m|0)<(c[k>>2]|0)){z=m}else{break L3577}}}}while(0);c[e+136>>2]=b[5250284+((a[d+2769|0]|0)<<1)>>1]|0;i=g;return}function b_(f,g,h,j,k){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0;l=i;i=i+32|0;m=l|0;L3593:do{if((j|0)==0){if((c[f+2404+(h<<2)>>2]|0)!=0){n=2460;break}o=g+28|0;p=c[o>>2]|0;q=g+32|0;r=c[q>>2]|0;s=p>>>8;t=-1;u=p;while(1){v=t+1|0;w=$(d[v+5246240|0]|0,s);if(r>>>0<w>>>0){t=v;u=w}else{break}}t=r-w|0;c[q>>2]=t;s=u-w|0;c[o>>2]=s;if(s>>>0>=8388609){x=v;break}p=g+20|0;y=g+40|0;z=g+24|0;A=g|0;B=c[g+4>>2]|0;C=c[p>>2]|0;D=s;s=c[y>>2]|0;E=c[z>>2]|0;F=t;while(1){t=C+8|0;c[p>>2]=t;G=D<<8;c[o>>2]=G;if(E>>>0<B>>>0){H=E+1|0;c[z>>2]=H;I=d[(c[A>>2]|0)+E|0]|0;J=H}else{I=0;J=E}c[y>>2]=I;H=((I|s<<8)>>>1&255|F<<8&2147483392)^255;c[q>>2]=H;if(G>>>0<8388609){C=t;D=G;s=I;E=J;F=H}else{x=v;break L3593}}}else{n=2460}}while(0);if((n|0)==2460){v=g+28|0;J=c[v>>2]|0;I=g+32|0;w=c[I>>2]|0;h=J>>>8;j=-1;F=J;while(1){J=j+1|0;K=$(d[J+5246244|0]|0,h);if(w>>>0<K>>>0){j=J;F=K}else{break}}h=w-K|0;c[I>>2]=h;w=F-K|0;c[v>>2]=w;L3610:do{if(w>>>0<8388609){K=g+20|0;F=g+40|0;J=g+24|0;E=g|0;s=c[g+4>>2]|0;D=c[K>>2]|0;C=w;q=c[F>>2]|0;y=c[J>>2]|0;A=h;while(1){z=D+8|0;c[K>>2]=z;B=C<<8;c[v>>2]=B;if(y>>>0<s>>>0){o=y+1|0;c[J>>2]=o;L=d[(c[E>>2]|0)+y|0]|0;M=o}else{L=0;M=y}c[F>>2]=L;o=((L|q<<8)>>>1&255|A<<8&2147483392)^255;c[I>>2]=o;if(B>>>0<8388609){D=z;C=B;q=L;y=M;A=o}else{break L3610}}}}while(0);x=j+3|0}j=x>>>1;M=f+2736|0;L=f+2765|0;a[L]=j&255;a[f+2766|0]=x&1;x=(k|0)==2;if(x){I=g+28|0;v=c[I>>2]|0;h=g+32|0;w=c[h>>2]|0;A=v>>>8;y=-1;q=v;while(1){N=y+1|0;O=$(d[N+5247612|0]|0,A);if(w>>>0<O>>>0){y=N;q=O}else{break}}y=w-O|0;c[h>>2]=y;w=q-O|0;c[I>>2]=w;L3647:do{if(w>>>0<8388609){O=g+20|0;q=g+40|0;A=g+24|0;v=g|0;C=c[g+4>>2]|0;D=c[O>>2]|0;F=w;E=c[q>>2]|0;J=c[A>>2]|0;s=y;while(1){K=D+8|0;c[O>>2]=K;o=F<<8;c[I>>2]=o;if(J>>>0<C>>>0){B=J+1|0;c[A>>2]=B;P=d[(c[v>>2]|0)+J|0]|0;Q=B}else{P=0;Q=J}c[q>>2]=P;B=((P|E<<8)>>>1&255|s<<8&2147483392)^255;c[h>>2]=B;if(o>>>0<8388609){D=K;F=o;E=P;J=Q;s=B}else{break L3647}}}}while(0);a[M|0]=N&255}else{N=j<<24>>24;j=g+28|0;Q=c[j>>2]|0;P=g+32|0;h=c[P>>2]|0;I=Q>>>8;y=-1;w=Q;while(1){R=y+1|0;S=$(d[5247588+(N<<3)+R|0]|0,I);if(h>>>0<S>>>0){y=R;w=S}else{break}}y=h-S|0;c[P>>2]=y;h=w-S|0;c[j>>2]=h;L3624:do{if(h>>>0<8388609){S=g+20|0;w=g+40|0;I=g+24|0;N=g|0;Q=c[g+4>>2]|0;s=c[S>>2]|0;J=h;E=c[w>>2]|0;F=c[I>>2]|0;D=y;while(1){q=s+8|0;c[S>>2]=q;v=J<<8;c[j>>2]=v;if(F>>>0<Q>>>0){A=F+1|0;c[I>>2]=A;T=d[(c[N>>2]|0)+F|0]|0;U=A}else{T=0;U=F}c[w>>2]=T;A=((T|E<<8)>>>1&255|D<<8&2147483392)^255;c[P>>2]=A;if(v>>>0<8388609){s=q;J=v;E=T;F=U;D=A}else{break L3624}}}}while(0);U=M|0;a[U]=R<<3&255;R=c[j>>2]|0;M=c[P>>2]|0;T=R>>>8;y=-1;h=R;while(1){V=y+1|0;W=$(d[V+5246208|0]|0,T);if(M>>>0<W>>>0){y=V;h=W}else{break}}y=M-W|0;c[P>>2]=y;M=h-W|0;c[j>>2]=M;L3635:do{if(M>>>0<8388609){W=g+20|0;h=g+40|0;T=g+24|0;R=g|0;D=c[g+4>>2]|0;F=c[W>>2]|0;E=M;J=c[h>>2]|0;s=c[T>>2]|0;w=y;while(1){N=F+8|0;c[W>>2]=N;I=E<<8;c[j>>2]=I;if(s>>>0<D>>>0){Q=s+1|0;c[T>>2]=Q;X=d[(c[R>>2]|0)+s|0]|0;Y=Q}else{X=0;Y=s}c[h>>2]=X;Q=((X|J<<8)>>>1&255|w<<8&2147483392)^255;c[P>>2]=Q;if(I>>>0<8388609){F=N;E=I;J=X;s=Y;w=Q}else{break L3635}}}}while(0);a[U]=(d[U]|0)+V&255}V=f+2324|0;U=g+28|0;Y=g+32|0;L3656:do{if((c[V>>2]|0)>1){X=g+20|0;P=g+40|0;j=g+24|0;y=g+4|0;M=g|0;w=1;while(1){s=c[U>>2]|0;J=c[Y>>2]|0;E=s>>>8;F=-1;h=s;while(1){Z=F+1|0;_=$(d[Z+5247612|0]|0,E);if(J>>>0<_>>>0){F=Z;h=_}else{break}}F=J-_|0;c[Y>>2]=F;E=h-_|0;c[U>>2]=E;L3663:do{if(E>>>0<8388609){s=c[y>>2]|0;R=c[X>>2]|0;T=E;D=c[P>>2]|0;W=c[j>>2]|0;Q=F;while(1){I=R+8|0;c[X>>2]=I;N=T<<8;c[U>>2]=N;if(W>>>0<s>>>0){S=W+1|0;c[j>>2]=S;aa=d[(c[M>>2]|0)+W|0]|0;ab=S}else{aa=0;ab=W}c[P>>2]=aa;S=((aa|D<<8)>>>1&255|Q<<8&2147483392)^255;c[Y>>2]=S;if(N>>>0<8388609){R=I;T=N;D=aa;W=ab;Q=S}else{break L3663}}}}while(0);a[w+(f+2736)|0]=Z&255;F=w+1|0;if((F|0)<(c[V>>2]|0)){w=F}else{break L3656}}}}while(0);Z=f+2732|0;ab=c[Z>>2]|0;aa=$(b[ab>>1]|0,(a[L]|0)>>1);_=c[ab+12>>2]|0;ab=c[U>>2]|0;w=c[Y>>2]|0;P=ab>>>8;M=-1;j=ab;while(1){ac=M+1|0;ad=$(d[_+(ac+aa|0)|0]|0,P);if(w>>>0<ad>>>0){M=ac;j=ad}else{break}}M=w-ad|0;c[Y>>2]=M;w=j-ad|0;c[U>>2]=w;L3675:do{if(w>>>0<8388609){ad=g+20|0;j=g+40|0;P=g+24|0;aa=g|0;_=c[g+4>>2]|0;ab=c[ad>>2]|0;X=w;y=c[j>>2]|0;F=c[P>>2]|0;E=M;while(1){h=ab+8|0;c[ad>>2]=h;J=X<<8;c[U>>2]=J;if(F>>>0<_>>>0){Q=F+1|0;c[P>>2]=Q;ae=d[(c[aa>>2]|0)+F|0]|0;af=Q}else{ae=0;af=F}c[j>>2]=ae;Q=((ae|y<<8)>>>1&255|E<<8&2147483392)^255;c[Y>>2]=Q;if(J>>>0<8388609){ab=h;X=J;y=ae;F=af;E=Q}else{break L3675}}}}while(0);a[f+2744|0]=ac&255;af=c[Z>>2]|0;ae=b[af+2>>1]|0;M=ae<<16>>16>0;L3683:do{if(M){w=ae<<16>>16;E=$(w,ac<<24>>24);F=0;y=(c[af+20>>2]|0)+((E|0)/2&-1)|0;while(1){E=a[y]|0;b[m+(F<<1)>>1]=((E&255)>>>1&7)*9&65535;b[m+((F|1)<<1)>>1]=((E&255)>>>5&255)*9&65535;E=F+2|0;if((E|0)<(w|0)){F=E;y=y+1|0}else{break}}if(!M){break}y=g+20|0;F=g+40|0;w=g+24|0;E=g+4|0;X=g|0;ab=0;j=af;while(1){aa=b[m+(ab<<1)>>1]|0;P=c[j+24>>2]|0;_=c[U>>2]|0;ad=c[Y>>2]|0;Q=_>>>8;J=-1;h=_;while(1){ag=J+1|0;ah=$(d[P+(ag+aa|0)|0]|0,Q);if(ad>>>0<ah>>>0){J=ag;h=ah}else{break}}Q=ad-ah|0;c[Y>>2]=Q;aa=h-ah|0;c[U>>2]=aa;L3694:do{if(aa>>>0<8388609){P=c[E>>2]|0;_=c[y>>2]|0;W=aa;D=c[F>>2]|0;T=c[w>>2]|0;R=Q;while(1){s=_+8|0;c[y>>2]=s;S=W<<8;c[U>>2]=S;if(T>>>0<P>>>0){N=T+1|0;c[w>>2]=N;ai=d[(c[X>>2]|0)+T|0]|0;aj=N}else{ai=0;aj=T}c[F>>2]=ai;N=((ai|D<<8)>>>1&255|R<<8&2147483392)^255;c[Y>>2]=N;if(S>>>0<8388609){_=s;W=S;D=ai;T=aj;R=N}else{ak=S;al=N;break L3694}}}else{ak=aa;al=Q}}while(0);if((J|0)==7){Q=ak>>>8;aa=-1;h=ak;while(1){am=aa+1|0;an=$(d[am+5248084|0]|0,Q);if(al>>>0<an>>>0){aa=am;h=an}else{break}}aa=al-an|0;c[Y>>2]=aa;Q=h-an|0;c[U>>2]=Q;L3707:do{if(Q>>>0<8388609){ad=c[E>>2]|0;R=c[y>>2]|0;T=Q;D=c[F>>2]|0;W=c[w>>2]|0;_=aa;while(1){P=R+8|0;c[y>>2]=P;N=T<<8;c[U>>2]=N;if(W>>>0<ad>>>0){S=W+1|0;c[w>>2]=S;ao=d[(c[X>>2]|0)+W|0]|0;ap=S}else{ao=0;ap=W}c[F>>2]=ao;S=((ao|D<<8)>>>1&255|_<<8&2147483392)^255;c[Y>>2]=S;if(N>>>0<8388609){R=P;T=N;D=ao;W=ap;_=S}else{break L3707}}}}while(0);aq=am+ag|0}else if((J|0)==(-1|0)){aa=ak>>>8;Q=-1;h=ak;while(1){ar=Q+1|0;as=$(d[ar+5248084|0]|0,aa);if(al>>>0<as>>>0){Q=ar;h=as}else{break}}Q=al-as|0;c[Y>>2]=Q;aa=h-as|0;c[U>>2]=aa;L3719:do{if(aa>>>0<8388609){J=c[E>>2]|0;_=c[y>>2]|0;W=aa;D=c[F>>2]|0;T=c[w>>2]|0;R=Q;while(1){ad=_+8|0;c[y>>2]=ad;S=W<<8;c[U>>2]=S;if(T>>>0<J>>>0){N=T+1|0;c[w>>2]=N;at=d[(c[X>>2]|0)+T|0]|0;au=N}else{at=0;au=T}c[F>>2]=at;N=((at|D<<8)>>>1&255|R<<8&2147483392)^255;c[Y>>2]=N;if(S>>>0<8388609){_=ad;W=S;D=at;T=au;R=N}else{break L3719}}}}while(0);aq=ag-ar|0}else{aq=ag}Q=ab+1|0;a[Q+(f+2744)|0]=aq+252&255;aa=c[Z>>2]|0;if((Q|0)<(b[aa+2>>1]|0|0)){ab=Q;j=aa}else{break L3683}}}}while(0);if((c[V>>2]|0)==4){Z=c[U>>2]|0;aq=c[Y>>2]|0;ag=Z>>>8;ar=-1;au=Z;while(1){av=ar+1|0;aw=$(d[av+5248024|0]|0,ag);if(aq>>>0<aw>>>0){ar=av;au=aw}else{break}}ar=aq-aw|0;c[Y>>2]=ar;aq=au-aw|0;c[U>>2]=aq;L3735:do{if(aq>>>0<8388609){aw=g+20|0;au=g+40|0;ag=g+24|0;Z=g|0;at=c[g+4>>2]|0;as=c[aw>>2]|0;al=aq;ak=c[au>>2]|0;am=c[ag>>2]|0;ap=ar;while(1){ao=as+8|0;c[aw>>2]=ao;an=al<<8;c[U>>2]=an;if(am>>>0<at>>>0){aj=am+1|0;c[ag>>2]=aj;ax=d[(c[Z>>2]|0)+am|0]|0;ay=aj}else{ax=0;ay=am}c[au>>2]=ax;aj=((ax|ak<<8)>>>1&255|ap<<8&2147483392)^255;c[Y>>2]=aj;if(an>>>0<8388609){as=ao;al=an;ak=ax;am=ay;ap=aj}else{break L3735}}}}while(0);a[f+2767|0]=av&255}else{a[f+2767|0]=4}do{if((a[L]|0)==2){do{if(x){if((c[f+2396>>2]|0)!=2){n=2568;break}av=c[U>>2]|0;ay=c[Y>>2]|0;ax=av>>>8;ar=-1;aq=av;while(1){az=ar+1|0;aA=$(d[az+5247496|0]|0,ax);if(ay>>>0<aA>>>0){ar=az;aq=aA}else{break}}ax=ay-aA|0;c[Y>>2]=ax;av=aq-aA|0;c[U>>2]=av;L3752:do{if(av>>>0<8388609){ap=g+20|0;am=g+40|0;ak=g+24|0;al=g|0;as=c[g+4>>2]|0;au=c[ap>>2]|0;Z=av;ag=c[am>>2]|0;at=c[ak>>2]|0;aw=ax;while(1){aj=au+8|0;c[ap>>2]=aj;an=Z<<8;c[U>>2]=an;if(at>>>0<as>>>0){ao=at+1|0;c[ak>>2]=ao;aB=d[(c[al>>2]|0)+at|0]|0;aC=ao}else{aB=0;aC=at}c[am>>2]=aB;ao=((aB|ag<<8)>>>1&255|aw<<8&2147483392)^255;c[Y>>2]=ao;if(an>>>0<8388609){au=aj;Z=an;ag=aB;at=aC;aw=ao}else{break L3752}}}}while(0);if((az<<16|0)<=0){n=2568;break}ax=f+2400|0;av=(ar+65528|0)+(e[ax>>1]|0)&65535;b[f+2762>>1]=av;aD=av;aE=ax;break}else{n=2568}}while(0);if((n|0)==2568){ax=c[U>>2]|0;av=c[Y>>2]|0;aq=ax>>>8;ay=-1;aw=ax;while(1){aF=ay+1|0;aG=$(d[aF+5247464|0]|0,aq);if(av>>>0<aG>>>0){ay=aF;aw=aG}else{break}}ay=av-aG|0;c[Y>>2]=ay;aq=aw-aG|0;c[U>>2]=aq;L3766:do{if(aq>>>0<8388609){ax=g+20|0;at=g+40|0;ag=g+24|0;Z=g|0;au=c[g+4>>2]|0;am=c[ax>>2]|0;al=aq;ak=c[at>>2]|0;as=c[ag>>2]|0;ap=ay;while(1){ao=am+8|0;c[ax>>2]=ao;an=al<<8;c[U>>2]=an;if(as>>>0<au>>>0){aj=as+1|0;c[ag>>2]=aj;aH=d[(c[Z>>2]|0)+as|0]|0;aI=aj}else{aH=0;aI=as}c[at>>2]=aH;aj=((aH|ak<<8)>>>1&255|ap<<8&2147483392)^255;c[Y>>2]=aj;if(an>>>0<8388609){am=ao;al=an;ak=aH;as=aI;ap=aj}else{break L3766}}}}while(0);ay=f+2762|0;b[ay>>1]=$(c[f+2316>>2]>>1,aF<<16>>16)&65535;aq=c[f+2380>>2]|0;aw=c[U>>2]|0;av=c[Y>>2]|0;ap=aw>>>8;as=-1;ak=aw;while(1){aJ=as+1|0;aK=$(d[aq+aJ|0]|0,ap);if(av>>>0<aK>>>0){as=aJ;ak=aK}else{break}}as=av-aK|0;c[Y>>2]=as;ap=ak-aK|0;c[U>>2]=ap;L3777:do{if(ap>>>0<8388609){aq=g+20|0;aw=g+40|0;al=g+24|0;am=g|0;at=c[g+4>>2]|0;Z=c[aq>>2]|0;ag=ap;au=c[aw>>2]|0;ax=c[al>>2]|0;ar=as;while(1){aj=Z+8|0;c[aq>>2]=aj;an=ag<<8;c[U>>2]=an;if(ax>>>0<at>>>0){ao=ax+1|0;c[al>>2]=ao;aL=d[(c[am>>2]|0)+ax|0]|0;aM=ao}else{aL=0;aM=ax}c[aw>>2]=aL;ao=((aL|au<<8)>>>1&255|ar<<8&2147483392)^255;c[Y>>2]=ao;if(an>>>0<8388609){Z=aj;ag=an;au=aL;ax=aM;ar=ao}else{break L3777}}}}while(0);as=(e[ay>>1]|0)+aJ&65535;b[ay>>1]=as;aD=as;aE=f+2400|0}b[aE>>1]=aD;as=c[f+2384>>2]|0;ap=c[U>>2]|0;ak=c[Y>>2]|0;av=ap>>>8;ar=-1;ax=ap;while(1){aN=ar+1|0;aO=$(d[as+aN|0]|0,av);if(ak>>>0<aO>>>0){ar=aN;ax=aO}else{break}}ar=ak-aO|0;c[Y>>2]=ar;av=ax-aO|0;c[U>>2]=av;L3789:do{if(av>>>0<8388609){as=g+20|0;ay=g+40|0;ap=g+24|0;au=g|0;ag=c[g+4>>2]|0;Z=c[as>>2]|0;aw=av;am=c[ay>>2]|0;al=c[ap>>2]|0;at=ar;while(1){aq=Z+8|0;c[as>>2]=aq;ao=aw<<8;c[U>>2]=ao;if(al>>>0<ag>>>0){an=al+1|0;c[ap>>2]=an;aP=d[(c[au>>2]|0)+al|0]|0;aQ=an}else{aP=0;aQ=al}c[ay>>2]=aP;an=((aP|am<<8)>>>1&255|at<<8&2147483392)^255;c[Y>>2]=an;if(ao>>>0<8388609){Z=aq;aw=ao;am=aP;al=aQ;at=an}else{break L3789}}}}while(0);a[f+2764|0]=aN&255;ar=c[U>>2]|0;av=c[Y>>2]|0;ax=ar>>>8;ak=-1;at=ar;while(1){aR=ak+1|0;aS=$(d[aR+5249932|0]|0,ax);if(av>>>0<aS>>>0){ak=aR;at=aS}else{break}}ak=av-aS|0;c[Y>>2]=ak;ax=at-aS|0;c[U>>2]=ax;L3800:do{if(ax>>>0<8388609){ar=g+20|0;al=g+40|0;am=g+24|0;aw=g|0;Z=c[g+4>>2]|0;ay=c[ar>>2]|0;au=ax;ap=c[al>>2]|0;ag=c[am>>2]|0;as=ak;while(1){an=ay+8|0;c[ar>>2]=an;ao=au<<8;c[U>>2]=ao;if(ag>>>0<Z>>>0){aq=ag+1|0;c[am>>2]=aq;aT=d[(c[aw>>2]|0)+ag|0]|0;aU=aq}else{aT=0;aU=ag}c[al>>2]=aT;aq=((aT|ap<<8)>>>1&255|as<<8&2147483392)^255;c[Y>>2]=aq;if(ao>>>0<8388609){ay=an;au=ao;ap=aT;ag=aU;as=aq}else{break L3800}}}}while(0);ak=aR&255;ax=f+2768|0;a[ax]=ak;L3808:do{if((c[V>>2]|0)>0){at=g+20|0;av=g+40|0;as=g+24|0;ag=g+4|0;ap=g|0;au=0;ay=ak;while(1){al=c[5250216+(ay<<24>>24<<2)>>2]|0;aw=c[U>>2]|0;am=c[Y>>2]|0;Z=aw>>>8;ar=-1;aq=aw;while(1){aV=ar+1|0;aW=$(d[al+aV|0]|0,Z);if(am>>>0<aW>>>0){ar=aV;aq=aW}else{break}}ar=am-aW|0;c[Y>>2]=ar;Z=aq-aW|0;c[U>>2]=Z;L3815:do{if(Z>>>0<8388609){al=c[ag>>2]|0;aw=c[at>>2]|0;ao=Z;an=c[av>>2]|0;aj=c[as>>2]|0;ai=ar;while(1){ah=aw+8|0;c[at>>2]=ah;m=ao<<8;c[U>>2]=m;if(aj>>>0<al>>>0){af=aj+1|0;c[as>>2]=af;aX=d[(c[ap>>2]|0)+aj|0]|0;aY=af}else{aX=0;aY=aj}c[av>>2]=aX;af=((aX|an<<8)>>>1&255|ai<<8&2147483392)^255;c[Y>>2]=af;if(m>>>0<8388609){aw=ah;ao=m;an=aX;aj=aY;ai=af}else{break L3815}}}}while(0);a[au+(f+2740)|0]=aV&255;ar=au+1|0;if((ar|0)>=(c[V>>2]|0)){break L3808}au=ar;ay=a[ax]|0}}}while(0);if((k|0)!=0){a[f+2769|0]=0;break}ax=c[U>>2]|0;ak=c[Y>>2]|0;ay=ax>>>8;au=-1;av=ax;while(1){aZ=au+1|0;a_=$(d[aZ+5249916|0]|0,ay);if(ak>>>0<a_>>>0){au=aZ;av=a_}else{break}}au=ak-a_|0;c[Y>>2]=au;ay=av-a_|0;c[U>>2]=ay;L3831:do{if(ay>>>0<8388609){ax=g+20|0;ap=g+40|0;as=g+24|0;at=g|0;ag=c[g+4>>2]|0;ar=c[ax>>2]|0;Z=ay;aq=c[ap>>2]|0;am=c[as>>2]|0;ai=au;while(1){aj=ar+8|0;c[ax>>2]=aj;an=Z<<8;c[U>>2]=an;if(am>>>0<ag>>>0){ao=am+1|0;c[as>>2]=ao;a$=d[(c[at>>2]|0)+am|0]|0;a0=ao}else{a$=0;a0=am}c[ap>>2]=a$;ao=((a$|aq<<8)>>>1&255|ai<<8&2147483392)^255;c[Y>>2]=ao;if(an>>>0<8388609){ar=aj;Z=an;aq=a$;am=a0;ai=ao}else{break L3831}}}}while(0);a[f+2769|0]=aZ&255}}while(0);c[f+2396>>2]=a[L]|0;L=c[U>>2]|0;aZ=c[Y>>2]|0;a0=L>>>8;a$=-1;a_=L;while(1){a1=a$+1|0;a2=$(d[a1+5246232|0]|0,a0);if(aZ>>>0<a2>>>0){a$=a1;a_=a2}else{break}}a$=aZ-a2|0;c[Y>>2]=a$;aZ=a_-a2|0;c[U>>2]=aZ;if(aZ>>>0>=8388609){a3=a1&255;a4=f+2770|0;a[a4]=a3;i=l;return}a2=g+20|0;a_=g+40|0;a0=g+24|0;L=g|0;k=c[g+4>>2]|0;g=c[a2>>2]|0;V=aZ;aZ=c[a_>>2]|0;aV=c[a0>>2]|0;aY=a$;while(1){a$=g+8|0;c[a2>>2]=a$;aX=V<<8;c[U>>2]=aX;if(aV>>>0<k>>>0){aW=aV+1|0;c[a0>>2]=aW;a5=d[(c[L>>2]|0)+aV|0]|0;a6=aW}else{a5=0;a6=aV}c[a_>>2]=a5;aW=((a5|aZ<<8)>>>1&255|aY<<8&2147483392)^255;c[Y>>2]=aW;if(aX>>>0<8388609){g=a$;V=aX;aZ=a5;aV=a6;aY=aW}else{break}}a3=a1&255;a4=f+2770|0;a[a4]=a3;i=l;return}function b$(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0;h=i;i=i+160|0;j=h|0;k=h+80|0;l=e>>1;m=a+28|0;n=c[m>>2]|0;o=a+32|0;p=c[o>>2]|0;q=n>>>8;r=-1;s=n;while(1){t=r+1|0;u=$(d[5247080+(l*9&-1)+t|0]|0,q);if(p>>>0<u>>>0){r=t;s=u}else{break}}r=p-u|0;c[o>>2]=r;p=s-u|0;c[m>>2]=p;L3856:do{if(p>>>0<8388609){u=a+20|0;s=a+40|0;q=a+24|0;l=a|0;n=c[a+4>>2]|0;v=c[u>>2]|0;w=p;x=c[s>>2]|0;y=c[q>>2]|0;z=r;while(1){A=v+8|0;c[u>>2]=A;B=w<<8;c[m>>2]=B;if(y>>>0<n>>>0){C=y+1|0;c[q>>2]=C;D=d[(c[l>>2]|0)+y|0]|0;E=C}else{D=0;E=y}c[s>>2]=D;C=((D|x<<8)>>>1&255|z<<8&2147483392)^255;c[o>>2]=C;if(B>>>0<8388609){v=A;w=B;x=D;y=E;z=C}else{F=B;G=C;break L3856}}}else{F=p;G=r}}while(0);r=g>>4;p=((r<<4|0)<(g|0)&1)+r|0;r=(p|0)>0;if(!r){H=j|0;bU(a,b,g,e,f,H);i=h;return}E=a+20|0;D=a+40|0;z=a+24|0;y=a+4|0;x=a|0;w=0;v=F;F=G;while(1){G=k+(w<<2)|0;c[G>>2]=0;s=v>>>8;l=-1;q=v;while(1){I=l+1|0;J=$(d[5247120+(t*18&-1)+I|0]|0,s);if(F>>>0<J>>>0){l=I;q=J}else{break}}l=F-J|0;c[o>>2]=l;s=q-J|0;c[m>>2]=s;L3872:do{if(s>>>0<8388609){n=c[y>>2]|0;u=c[E>>2]|0;C=s;B=c[D>>2]|0;A=c[z>>2]|0;K=l;while(1){L=u+8|0;c[E>>2]=L;M=C<<8;c[m>>2]=M;if(A>>>0<n>>>0){N=A+1|0;c[z>>2]=N;O=d[(c[x>>2]|0)+A|0]|0;P=N}else{O=0;P=A}c[D>>2]=O;N=((O|B<<8)>>>1&255|K<<8&2147483392)^255;c[o>>2]=N;if(M>>>0<8388609){u=L;C=M;B=O;A=P;K=N}else{Q=M;R=N;break L3872}}}else{Q=s;R=l}}while(0);l=j+(w<<2)|0;c[l>>2]=I;if((I|0)==17){s=0;q=Q;K=R;while(1){S=s+1|0;A=(S|0)==10&1;B=q>>>8;C=-1;u=q;while(1){T=C+1|0;U=$(d[5247282+(T+A|0)|0]|0,B);if(K>>>0<U>>>0){C=T;u=U}else{break}}C=K-U|0;c[o>>2]=C;B=u-U|0;c[m>>2]=B;L3886:do{if(B>>>0<8388609){A=c[y>>2]|0;n=c[E>>2]|0;N=B;M=c[D>>2]|0;L=c[z>>2]|0;V=C;while(1){W=n+8|0;c[E>>2]=W;X=N<<8;c[m>>2]=X;if(L>>>0<A>>>0){Y=L+1|0;c[z>>2]=Y;Z=d[(c[x>>2]|0)+L|0]|0;_=Y}else{Z=0;_=L}c[D>>2]=Z;Y=((Z|M<<8)>>>1&255|V<<8&2147483392)^255;c[o>>2]=Y;if(X>>>0<8388609){n=W;N=X;M=Z;L=_;V=Y}else{aa=X;ab=Y;break L3886}}}else{aa=B;ab=C}}while(0);if((T|0)==17){s=S;q=aa;K=ab}else{break}}c[G>>2]=S;c[l>>2]=T;ac=aa;ad=ab}else{ac=Q;ad=R}K=w+1|0;if((K|0)==(p|0)){break}else{w=K;v=ac;F=ad}}if(r){ae=0}else{H=j|0;bU(a,b,g,e,f,H);i=h;return}while(1){ad=c[j+(ae<<2)>>2]|0;F=b+(ae<<16>>12<<2)|0;if((ad|0)>0){cd(F,a,ad)}else{dF(F|0,0,64)}F=ae+1|0;if((F|0)==(p|0)){break}else{ae=F}}if(!r){H=j|0;bU(a,b,g,e,f,H);i=h;return}r=a+20|0;ae=a+40|0;F=a+24|0;ad=a+4|0;ac=a|0;v=0;while(1){w=c[k+(v<<2)>>2]|0;if((w|0)>0){R=v<<16>>12;Q=0;while(1){ab=b+(Q+R<<2)|0;aa=c[ab>>2]|0;T=0;S=c[m>>2]|0;_=c[o>>2]|0;while(1){Z=S>>>8;D=-1;x=S;while(1){af=D+1|0;ag=$(d[af+5247584|0]|0,Z);if(_>>>0<ag>>>0){D=af;x=ag}else{break}}D=aa<<1;Z=_-ag|0;c[o>>2]=Z;z=x-ag|0;c[m>>2]=z;L3920:do{if(z>>>0<8388609){E=c[ad>>2]|0;y=c[r>>2]|0;U=z;I=c[ae>>2]|0;P=c[F>>2]|0;O=Z;while(1){J=y+8|0;c[r>>2]=J;t=U<<8;c[m>>2]=t;if(P>>>0<E>>>0){K=P+1|0;c[F>>2]=K;ah=d[(c[ac>>2]|0)+P|0]|0;ai=K}else{ah=0;ai=P}c[ae>>2]=ah;K=((ah|I<<8)>>>1&255|O<<8&2147483392)^255;c[o>>2]=K;if(t>>>0<8388609){y=J;U=t;I=ah;P=ai;O=K}else{aj=t;ak=K;break L3920}}}else{aj=z;ak=Z}}while(0);al=af+D|0;Z=T+1|0;if((Z|0)==(w|0)){break}else{aa=al;T=Z;S=aj;_=ak}}c[ab>>2]=al;_=Q+1|0;if((_|0)==16){break}else{Q=_}}Q=j+(v<<2)|0;c[Q>>2]=c[Q>>2]|w<<5}Q=v+1|0;if((Q|0)==(p|0)){break}else{v=Q}}H=j|0;bU(a,b,g,e,f,H);i=h;return}function b0(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=d<<16>>16;c[b+2332>>2]=f*5&-1;g=b+2324|0;h=$(c[g>>2]<<16>>16,(f*327680&-1)>>16);i=b+2316|0;j=b+2320|0;do{if((c[i>>2]|0)==(d|0)){if((c[j>>2]|0)==(e|0)){k=0;l=2684;break}else{l=2683;break}}else{l=2683}}while(0);do{if((l|0)==2683){m=cs(b+2432|0,f*1e3&-1,e,0)|0;c[j>>2]=e;if((c[i>>2]|0)==(d|0)){k=m;l=2684;break}else{n=m;o=0;break}}}while(0);do{if((l|0)==2684){if((h|0)==(c[b+2328>>2]|0)){p=k}else{n=k;o=1;break}return p|0}}while(0);k=(d|0)==8;l=(c[g>>2]|0)==4;g=b+2384|0;do{if(k){if(l){c[g>>2]=5247556;break}else{c[g>>2]=5247580;break}}else{if(l){c[g>>2]=5247520;break}else{c[g>>2]=5247568;break}}}while(0);if(!o){c[b+2336>>2]=f*20&-1;f=b+2340|0;if((d|0)==12|(d|0)==8){c[f>>2]=10;c[b+2732>>2]=5248188}else{c[f>>2]=16;c[b+2732>>2]=5248152}do{if((d|0)==16){c[b+2380>>2]=5246208}else if((d|0)==12){c[b+2380>>2]=5246216}else{if(!k){break}c[b+2380>>2]=5246232}}while(0);c[b+2376>>2]=1;c[b+2308>>2]=100;a[b+2312|0]=10;c[b+4164>>2]=0;dF(b+1284|0,0,1024)}c[i>>2]=d;c[b+2328>>2]=h;p=n;return p|0}function b1(f,g,h,j,k,l,m){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0;n=i;i=i+1300|0;o=n|0;p=n+4|0;q=n+12|0;r=n+20|0;s=q;c[s>>2]=0;c[s+4>>2]=0;s=f;t=f;u=g+4|0;w=c[u>>2]|0;L3966:do{if((j|0)!=0&(w|0)>0){x=0;while(1){c[t+(x*4260&-1)+2388>>2]=0;y=x+1|0;z=c[u>>2]|0;if((y|0)<(z|0)){x=y}else{A=z;break L3966}}}else{A=w}}while(0);w=g+4|0;u=f+8536|0;j=c[u>>2]|0;if((A|0)>(j|0)){x=f+4260|0;dF(x|0,0,4252);c[f+6636>>2]=1;c[x>>2]=65536;c[f+8408>>2]=0;c[f+8412>>2]=3176576;c[f+8428>>2]=0;c[f+8500>>2]=65536;c[f+8504>>2]=65536;c[f+8516>>2]=20;c[f+8512>>2]=2;B=c[w>>2]|0}else{B=A}if((B|0)==1&(j|0)==2){C=(c[g+12>>2]|0)==((c[f+2316>>2]|0)*1e3&-1|0)}else{C=0}j=f+2388|0;L3976:do{if((c[j>>2]|0)==0&(B|0)>0){A=g+16|0;x=g+12|0;z=g+8|0;y=0;D=0;while(1){E=c[A>>2]|0;if((E|0)==0){c[t+(D*4260&-1)+2392>>2]=1;c[t+(D*4260&-1)+2324>>2]=2}else if((E|0)==40){c[t+(D*4260&-1)+2392>>2]=2;c[t+(D*4260&-1)+2324>>2]=4}else if((E|0)==10){c[t+(D*4260&-1)+2392>>2]=1;c[t+(D*4260&-1)+2324>>2]=2}else if((E|0)==20){c[t+(D*4260&-1)+2392>>2]=1;c[t+(D*4260&-1)+2324>>2]=4}else if((E|0)==60){c[t+(D*4260&-1)+2392>>2]=3;c[t+(D*4260&-1)+2324>>2]=4}else{F=-203;G=2842;break}E=c[x>>2]>>10;if(!((E|0)==15|(E|0)==11|(E|0)==7)){F=-200;G=2843;break}H=(b0(t+(D*4260&-1)|0,E+1|0,c[z>>2]|0)|0)+y|0;E=D+1|0;I=c[w>>2]|0;if((E|0)<(I|0)){y=H;D=E}else{J=H;K=I;break L3976}}if((G|0)==2842){i=n;return F|0}else if((G|0)==2843){i=n;return F|0}}else{J=0;K=B}}while(0);B=g|0;D=c[B>>2]|0;do{if((D|0)==2){if((K|0)!=2){L=2;break}if((c[f+8532>>2]|0)!=1){if((c[u>>2]|0)!=1){L=2;break}}y=f+8520|0;v=0;b[y>>1]=v&65535;b[y+2>>1]=v>>16;y=f+8528|0;v=0;b[y>>1]=v&65535;b[y+2>>1]=v>>16;dH(f+6692|0,f+2432|0,300);L=c[B>>2]|0}else{L=D}}while(0);c[f+8532>>2]=L;c[u>>2]=c[w>>2]|0;L=g+8|0;if(((c[L>>2]|0)-8e3|0)>>>0>4e4){F=-200;i=n;return F|0}D=(h|0)==1;L4002:do{if(D){M=0}else{if((c[j>>2]|0)!=0){M=0;break}K=c[w>>2]|0;L4005:do{if((K|0)>0){y=k+28|0;z=k+32|0;x=k+20|0;A=k+40|0;I=k+24|0;H=k+4|0;E=k|0;N=0;while(1){O=t+(N*4260&-1)+2392|0;P=0;while(1){Q=(P|0)<(c[O>>2]|0);R=c[y>>2]|0;S=c[z>>2]|0;T=R>>>1;U=S>>>0<T>>>0;V=U&1;if(U){W=T;X=S}else{U=S-T|0;c[z>>2]=U;W=R-T|0;X=U}c[y>>2]=W;L4014:do{if(W>>>0<8388609){U=c[H>>2]|0;T=c[x>>2]|0;R=W;S=c[A>>2]|0;Y=c[I>>2]|0;Z=X;while(1){_=T+8|0;c[x>>2]=_;aa=R<<8;c[y>>2]=aa;if(Y>>>0<U>>>0){ab=Y+1|0;c[I>>2]=ab;ac=d[(c[E>>2]|0)+Y|0]|0;ad=ab}else{ac=0;ad=Y}c[A>>2]=ac;ab=((ac|S<<8)>>>1&255|Z<<8&2147483392)^255;c[z>>2]=ab;if(aa>>>0<8388609){T=_;R=aa;S=ac;Y=ad;Z=ab}else{break L4014}}}}while(0);if(!Q){break}c[t+(N*4260&-1)+2404+(P<<2)>>2]=V;P=P+1|0}c[t+(N*4260&-1)+2416>>2]=V;P=N+1|0;ae=c[w>>2]|0;if((P|0)<(ae|0)){N=P}else{break}}if((ae|0)<=0){af=ae;break}N=k+28|0;z=k+32|0;A=k+20|0;E=k+40|0;I=k+24|0;y=k+4|0;x=k|0;H=0;while(1){P=t+(H*4260&-1)+2420|0;dF(P|0,0,12);L4028:do{if((c[t+(H*4260&-1)+2416>>2]|0)!=0){O=t+(H*4260&-1)+2392|0;Z=c[O>>2]|0;if((Z|0)==1){c[P>>2]=1;break}Y=c[5250552+(Z-2<<2)>>2]|0;Z=c[N>>2]|0;S=c[z>>2]|0;R=Z>>>8;T=-1;U=Z;while(1){Z=T+1|0;ag=$(d[Y+Z|0]|0,R);if(S>>>0<ag>>>0){T=Z;U=ag}else{break}}R=S-ag|0;c[z>>2]=R;Y=U-ag|0;c[N>>2]=Y;L4036:do{if(Y>>>0<8388609){Q=c[y>>2]|0;Z=c[A>>2]|0;ab=Y;aa=c[E>>2]|0;_=c[I>>2]|0;ah=R;while(1){ai=Z+8|0;c[A>>2]=ai;aj=ab<<8;c[N>>2]=aj;if(_>>>0<Q>>>0){ak=_+1|0;c[I>>2]=ak;al=d[(c[x>>2]|0)+_|0]|0;am=ak}else{al=0;am=_}c[E>>2]=al;ak=((al|aa<<8)>>>1&255|ah<<8&2147483392)^255;c[z>>2]=ak;if(aj>>>0<8388609){Z=ai;ab=aj;aa=al;_=am;ah=ak}else{break L4036}}}}while(0);R=T+2|0;if((c[O>>2]|0)>0){an=0}else{break}while(1){c[t+(H*4260&-1)+2420+(an<<2)>>2]=R>>>(an>>>0)&1;Y=an+1|0;if((Y|0)<(c[O>>2]|0)){an=Y}else{break L4028}}}}while(0);P=H+1|0;O=c[w>>2]|0;if((P|0)<(O|0)){H=P}else{af=O;break L4005}}}else{af=K}}while(0);if((h|0)!=0){M=0;break}K=f+2392|0;H=c[K>>2]|0;if((H|0)<=0){M=0;break}z=q|0;E=f+6680|0;x=k+28|0;I=k+32|0;N=k+20|0;A=k+40|0;y=k+24|0;O=k+4|0;P=k|0;R=r|0;T=0;Y=0;U=af;S=H;while(1){if((U|0)>0){H=E+(Y<<2)|0;ah=(Y|0)>0;_=Y-1|0;aa=T;ab=0;Z=U;while(1){Q=t+(ab*4260&-1)|0;if((c[t+(ab*4260&-1)+2420+(Y<<2)>>2]|0)==0){ao=aa;ap=Z}else{L4058:do{if((Z|0)==2&(ab|0)==0){cw(k,z);if((c[H>>2]|0)!=0){aq=aa;break}ak=c[x>>2]|0;aj=c[I>>2]|0;ai=ak>>>8;ar=-1;as=ak;while(1){av=ar+1|0;aw=$(d[av+5246308|0]|0,ai);if(aj>>>0<aw>>>0){ar=av;as=aw}else{break}}ar=aj-aw|0;c[I>>2]=ar;ai=as-aw|0;c[x>>2]=ai;if(ai>>>0>=8388609){aq=av;break}ak=c[O>>2]|0;ax=c[N>>2]|0;ay=ai;ai=c[A>>2]|0;az=c[y>>2]|0;aA=ar;while(1){ar=ax+8|0;c[N>>2]=ar;aB=ay<<8;c[x>>2]=aB;if(az>>>0<ak>>>0){aC=az+1|0;c[y>>2]=aC;aD=d[(c[P>>2]|0)+az|0]|0;aE=aC}else{aD=0;aE=az}c[A>>2]=aD;aC=((aD|ai<<8)>>>1&255|aA<<8&2147483392)^255;c[I>>2]=aC;if(aB>>>0<8388609){ax=ar;ay=aB;ai=aD;az=aE;aA=aC}else{aq=av;break L4058}}}else{aq=aa}}while(0);do{if(ah){if((c[t+(ab*4260&-1)+2420+(_<<2)>>2]|0)==0){G=2775;break}else{aF=2;break}}else{G=2775}}while(0);if((G|0)==2775){G=0;aF=0}b_(Q,k,Y,1,aF);b$(k,R,a[t+(ab*4260&-1)+2765|0]|0,a[t+(ab*4260&-1)+2766|0]|0,c[t+(ab*4260&-1)+2328>>2]|0);ao=aq;ap=c[w>>2]|0}aA=ab+1|0;if((aA|0)<(ap|0)){aa=ao;ab=aA;Z=ap}else{break}}aG=ao;aH=ap;aI=c[K>>2]|0}else{aG=T;aH=U;aI=S}Z=Y+1|0;if((Z|0)<(aI|0)){T=aG;Y=Z;U=aH;S=aI}else{M=aG;break L4002}}}}while(0);aG=c[w>>2]|0;do{if((aG|0)==2){do{if((h|0)==2){if((c[(f+2420|0)+(c[j>>2]<<2)>>2]|0)!=1){G=2782;break}cw(k,q|0);if((c[(f+6680|0)+(c[j>>2]<<2)>>2]|0)==0){G=2786;break}else{aJ=0;break}}else if((h|0)==0){cw(k,q|0);if((c[(f+6664|0)+(c[j>>2]<<2)>>2]|0)==0){G=2786;break}else{aJ=0;break}}else{G=2782}}while(0);L4086:do{if((G|0)==2786){aI=k+28|0;aH=c[aI>>2]|0;ap=k+32|0;ao=c[ap>>2]|0;aq=aH>>>8;aF=-1;av=aH;while(1){aK=aF+1|0;aL=$(d[aK+5246308|0]|0,aq);if(ao>>>0<aL>>>0){aF=aK;av=aL}else{break}}aF=ao-aL|0;c[ap>>2]=aF;aq=av-aL|0;c[aI>>2]=aq;if(aq>>>0>=8388609){aJ=aK;break}aH=k+20|0;aE=k+40|0;aD=k+24|0;aw=k|0;af=c[k+4>>2]|0;r=c[aH>>2]|0;an=aq;aq=c[aE>>2]|0;am=c[aD>>2]|0;al=aF;while(1){aF=r+8|0;c[aH>>2]=aF;ag=an<<8;c[aI>>2]=ag;if(am>>>0<af>>>0){ae=am+1|0;c[aD>>2]=ae;aM=d[(c[aw>>2]|0)+am|0]|0;aN=ae}else{aM=0;aN=am}c[aE>>2]=aM;ae=((aM|aq<<8)>>>1&255|al<<8&2147483392)^255;c[ap>>2]=ae;if(ag>>>0<8388609){r=aF;an=ag;aq=aM;am=aN;al=ae}else{aJ=aK;break L4086}}}else if((G|0)==2782){c[q>>2]=b[f+8520>>1]|0;c[q+4>>2]=b[f+8522>>1]|0;aJ=M}}while(0);al=c[w>>2]|0;if(!((al|0)==2&(aJ|0)==0)){aO=aJ;aP=al;break}if((c[f+8540>>2]|0)!=1){aO=0;aP=2;break}dF(f+5544|0,0,1024);c[f+6568>>2]=100;a[f+6572|0]=10;c[f+8424>>2]=0;c[f+6636>>2]=1;aO=0;aP=c[w>>2]|0}else{aO=M;aP=aG}}while(0);aG=f+2328|0;M=$((c[aG>>2]|0)+2|0,aP);aP=at()|0;aJ=i;i=i+(M*2&-1)|0;i=i+3>>2<<2;c[p>>2]=aJ;M=aJ+((c[aG>>2]|0)+2<<1)|0;c[p+4>>2]=M;do{if((h|0)==0){aQ=(aO|0)==0;G=2801;break}else{if((c[f+8540>>2]|0)==0){aQ=1;G=2801;break}aG=c[w>>2]|0;if(!((aG|0)==2&(h|0)==2)){aR=0;aS=aG;break}aQ=(c[(f+6680|0)+(c[f+6648>>2]<<2)>>2]|0)==1;G=2801;break}}while(0);if((G|0)==2801){aR=aQ;aS=c[w>>2]|0}do{if((aS|0)>0){aQ=aR^1;aG=(h|0)==2;aK=f+8540|0;aN=0;while(1){if((aN|0)!=0&aQ){dF((c[p+(aN<<2)>>2]|0)+4|0,0,c[o>>2]<<1|0)}else{aM=(c[j>>2]|0)-aN|0;do{if((aM|0)<1){aT=0}else{if(aG){aT=(c[t+(aN*4260&-1)+2420+(aM-1<<2)>>2]|0)!=0?2:0;break}if((aN|0)>0){if((c[aK>>2]|0)!=0){aT=1;break}}aT=2}}while(0);bY(t+(aN*4260&-1)|0,k,(c[p+(aN<<2)>>2]|0)+4|0,o,h,aT)}aM=t+(aN*4260&-1)+2388|0;c[aM>>2]=(c[aM>>2]|0)+1|0;aM=aN+1|0;aU=c[w>>2]|0;if((aM|0)<(aU|0)){aN=aM}else{break}}if(!((c[B>>2]|0)==2&(aU|0)==2)){G=2816;break}aN=f+2316|0;aK=c[o>>2]|0;cj(f+8520|0,aJ,M,q|0,c[aN>>2]|0,aK);aV=aK;aW=aN;break}else{G=2816}}while(0);if((G|0)==2816){G=f+8524|0;c[aJ>>2]=e[G>>1]|e[G+2>>1]<<16;q=c[o>>2]|0;o=aJ+(q<<1)|0;v=e[o>>1]|e[o+2>>1]<<16;b[G>>1]=v&65535;b[G+2>>1]=v>>16;aV=q;aW=f+2316|0}q=$(c[L>>2]|0,aV);L=(q|0)/((c[aW>>2]<<16>>16)*1e3&-1|0)&-1;c[m>>2]=L;q=c[B>>2]|0;if((q|0)==2){G=i;i=i+(L*2&-1)|0;i=i+3>>2<<2;aX=G}else{aX=l}G=c[w>>2]|0;L4135:do{if((((q|0)<(G|0)?q:G)|0)>0){L=0;o=aJ;while(1){ct(t+(L*4260&-1)+2432|0,aX,o+2|0,aV);M=c[B>>2]|0;do{if((M|0)==2){if((c[m>>2]|0)>0){aY=0}else{aZ=2;break}while(1){b[l+((aY<<1)+L<<1)>>1]=b[aX+(aY<<1)>>1]|0;aU=aY+1|0;if((aU|0)<(c[m>>2]|0)){aY=aU}else{break}}aZ=c[B>>2]|0}else{aZ=M}}while(0);M=L+1|0;Q=c[w>>2]|0;if((M|0)>=(((aZ|0)<(Q|0)?aZ:Q)|0)){a_=aZ;a$=Q;break L4135}L=M;o=c[p+(M<<2)>>2]|0}}else{a_=q;a$=G}}while(0);L4146:do{if((a_|0)==2&(a$|0)==1){if(C){G=f+6692|0;q=aJ+2|0;ct(G,aX,q,aV);if((c[m>>2]|0)>0){a0=0}else{break}while(1){b[l+((a0<<1|1)<<1)>>1]=b[aX+(a0<<1)>>1]|0;q=a0+1|0;if((q|0)<(c[m>>2]|0)){a0=q}else{break L4146}}}else{if((c[m>>2]|0)>0){a1=0}else{break}while(1){q=a1<<1;b[l+((q|1)<<1)>>1]=b[l+(q<<1)>>1]|0;q=a1+1|0;if((q|0)<(c[m>>2]|0)){a1=q}else{break L4146}}}}}while(0);if((c[f+4164>>2]|0)==2){c[g+20>>2]=$(c[5250572+((c[aW>>2]|0)-8>>2<<2)>>2]|0,c[f+2308>>2]|0)}else{c[g+20>>2]=0}L4160:do{if(D){if((c[u>>2]|0)>0){a2=0}else{break}while(1){a[s+(a2*4260&-1)+2312|0]=10;g=a2+1|0;if((g|0)<(c[u>>2]|0)){a2=g}else{break L4160}}}else{c[f+8540>>2]=aO}}while(0);au(aP|0);F=J;i=n;return F|0}function b2(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;dF(a|0,0,24548);dF(a|0,0,12232);c[a+8>>2]=193536;c[a+12>>2]=193536;c[a+4692>>2]=1;dF(a+32|0,0,100);c[a+124>>2]=50;c[a+128>>2]=25;c[a+132>>2]=16;c[a+136>>2]=12;c[a+92>>2]=5e3;c[a+108>>2]=429496;c[a+96>>2]=2500;c[a+112>>2]=858993;c[a+100>>2]=1600;c[a+116>>2]=1342177;c[a+104>>2]=1200;c[a+120>>2]=1789569;c[a+140>>2]=15;c[a+72>>2]=25600;c[a+76>>2]=25600;c[a+80>>2]=25600;c[a+84>>2]=25600;dF(a+12232|0,0,12232);c[a+12240>>2]=193536;c[a+12244>>2]=193536;c[a+16924>>2]=1;dF(a+12264|0,0,100);c[a+12356>>2]=50;c[a+12360>>2]=25;c[a+12364>>2]=16;c[a+12368>>2]=12;c[a+12324>>2]=5e3;c[a+12340>>2]=429496;c[a+12328>>2]=2500;c[a+12344>>2]=858993;c[a+12332>>2]=1600;c[a+12348>>2]=1342177;c[a+12336>>2]=1200;c[a+12352>>2]=1789569;c[a+12372>>2]=15;c[a+12304>>2]=25600;c[a+12308>>2]=25600;c[a+12312>>2]=25600;c[a+12316>>2]=25600;c[a+24524>>2]=1;d=a+24528|0;c[d>>2]=1;c[b>>2]=1;c[b+4>>2]=c[d>>2]|0;c[b+8>>2]=c[a+4580>>2]|0;c[b+12>>2]=c[a+4588>>2]|0;c[b+16>>2]=c[a+4592>>2]|0;c[b+20>>2]=c[a+4596>>2]|0;c[b+24>>2]=c[a+4636>>2]|0;c[b+28>>2]=c[a+4632>>2]|0;c[b+32>>2]=c[a+4640>>2]|0;c[b+36>>2]=c[a+4648>>2]|0;c[b+40>>2]=c[a+6112>>2]|0;c[b+44>>2]=c[a+6100>>2]|0;c[b+48>>2]=c[a+4704>>2]|0;d=a+4600|0;c[b+64>>2]=(c[d>>2]<<16>>16)*1e3&-1;c[b+68>>2]=c[a+4560>>2]|0;if((c[d>>2]|0)!=16){e=0;f=e&1;g=b+72|0;c[g>>2]=f;return 0}e=(c[a+28>>2]|0)==0;f=e&1;g=b+72|0;c[g>>2]=f;return 0}
function b3(f,g,h,j,k,l,m){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0;n=i;i=i+1932|0;o=n|0;p=n+8|0;q=n+1928|0;r=f;s=f+12232|0;t=s;c[f+18004>>2]=0;u=f;w=f+5772|0;c[w>>2]=0;x=g+8|0;y=c[x>>2]|0;if(!((y|0)==8e3|(y|0)==12e3|(y|0)==16e3|(y|0)==24e3|(y|0)==32e3|(y|0)==44100|(y|0)==48e3)){z=1;i=n;return z|0}y=c[g+20>>2]|0;if(!((y|0)==8e3|(y|0)==12e3|(y|0)==16e3)){z=1;i=n;return z|0}A=c[g+12>>2]|0;if(!((A|0)==8e3|(A|0)==12e3|(A|0)==16e3)){z=1;i=n;return z|0}B=c[g+16>>2]|0;if(!((B|0)==8e3|(B|0)==12e3|(B|0)==16e3)){z=1;i=n;return z|0}if((B|0)>(y|0)){z=1;i=n;return z|0}if((A|0)<(y|0)|(B|0)>(A|0)){z=1;i=n;return z|0}A=g+24|0;B=c[A>>2]|0;if(!((B|0)==10|(B|0)==20|(B|0)==40|(B|0)==60)){z=1;i=n;return z|0}if((c[g+32>>2]|0)>>>0>100){z=1;i=n;return z|0}if((c[g+44>>2]|0)>>>0>1){z=1;i=n;return z|0}B=g+48|0;if((c[B>>2]|0)>>>0>1){z=1;i=n;return z|0}if((c[g+40>>2]|0)>>>0>1){z=1;i=n;return z|0}y=g|0;C=c[y>>2]|0;if((C-1|0)>>>0>1){z=1;i=n;return z|0}D=g+4|0;E=c[D>>2]|0;if((E-1|0)>>>0>1|(E|0)>(C|0)){z=1;i=n;return z|0}C=g+36|0;F=(c[C>>2]|0)>>>0>10;G=F&1;if(F){z=G;i=n;return z|0}c[g+80>>2]=0;F=f+24528|0;H=c[F>>2]|0;do{if((E|0)>(H|0)){dF(s|0,0,12232);c[f+12240>>2]=193536;c[f+12244>>2]=193536;c[f+16924>>2]=1;dF(f+12264|0,0,100);c[f+12356>>2]=50;c[f+12360>>2]=25;c[f+12364>>2]=16;c[f+12368>>2]=12;c[f+12324>>2]=5e3;c[f+12340>>2]=429496;c[f+12328>>2]=2500;c[f+12344>>2]=858993;c[f+12332>>2]=1600;c[f+12348>>2]=1342177;c[f+12336>>2]=1200;c[f+12352>>2]=1789569;c[f+12372>>2]=15;c[f+12304>>2]=25600;c[f+12308>>2]=25600;c[f+12312>>2]=25600;c[f+12316>>2]=25600;I=f+24464|0;v=0;b[I>>1]=v&65535;b[I+2>>1]=v>>16;I=f+24472|0;v=0;b[I>>1]=v&65535;b[I+2>>1]=v>>16;c[f+24476>>2]=0;c[f+24480>>2]=1;c[f+24484>>2]=0;c[f+24488>>2]=1;b[f+24494>>1]=0;b[f+24492>>1]=16384;if((c[f+24524>>2]|0)!=2){break}dH(f+18032|0,f+5800|0,300);I=f;J=s;K=c[I+4>>2]|0;c[J>>2]=c[I>>2]|0;c[J+4>>2]=K}}while(0);if((c[A>>2]|0)==(c[f+4636>>2]|0)){L=(H|0)!=(c[D>>2]|0)}else{L=1}c[f+24524>>2]=c[y>>2]|0;c[F>>2]=c[D>>2]|0;F=j*100&-1;H=c[x>>2]|0;x=(F|0)/(H|0)&-1;s=(x|0)>1?x>>1:1;E=(m|0)!=0;L50:do{if(E){if((x|0)!=1){z=-101;i=n;return z|0}do{if((c[D>>2]|0)>0){K=0;while(1){dF(r+(K*12232&-1)|0,0,12232);c[r+(K*12232&-1)+8>>2]=193536;c[r+(K*12232&-1)+12>>2]=193536;c[r+(K*12232&-1)+4692>>2]=1;dF(r+(K*12232&-1)+32|0,0,104);c[r+(K*12232&-1)+124>>2]=50;c[r+(K*12232&-1)+128>>2]=25;c[r+(K*12232&-1)+132>>2]=16;c[r+(K*12232&-1)+136>>2]=12;c[r+(K*12232&-1)+92>>2]=5e3;c[r+(K*12232&-1)+108>>2]=429496;c[r+(K*12232&-1)+96>>2]=2500;c[r+(K*12232&-1)+112>>2]=858993;c[r+(K*12232&-1)+100>>2]=1600;c[r+(K*12232&-1)+116>>2]=1342177;c[r+(K*12232&-1)+104>>2]=1200;c[r+(K*12232&-1)+120>>2]=1789569;c[r+(K*12232&-1)+140>>2]=15;c[r+(K*12232&-1)+72>>2]=25600;c[r+(K*12232&-1)+76>>2]=25600;c[r+(K*12232&-1)+80>>2]=25600;c[r+(K*12232&-1)+84>>2]=25600;J=K+1|0;M=c[D>>2]|0;if((J|0)<(M|0)){K=J}else{break}}K=c[A>>2]|0;c[A>>2]=10;J=c[C>>2]|0;c[C>>2]=0;if((M|0)>0){N=0}else{O=K;P=0;Q=J;break}while(1){c[r+(N*12232&-1)+4696>>2]=0;c[r+(N*12232&-1)+4708>>2]=1;I=N+1|0;R=c[D>>2]|0;if((I|0)<(R|0)){N=I}else{S=K;T=0;U=J;V=R;W=31;break L50}}}else{J=c[A>>2]|0;c[A>>2]=10;K=c[C>>2]|0;c[C>>2]=0;O=J;P=G;Q=K}}while(0);X=Q;Y=P;Z=O;_=g+28|0;W=32;break}else{if(($(x,H)|0)!=(F|0)|(j|0)<0){z=-101;i=n;return z|0}if((j*1e3&-1|0)>($(c[A>>2]|0,H)|0)){z=-101;i=n;return z|0}else{S=0;T=G;U=0;V=c[D>>2]|0;W=31;break}}}while(0);L70:do{if((W|0)==31){G=g+28|0;H=c[G>>2]>>V-1;if((V|0)<=0){X=U;Y=T;Z=S;_=G;W=32;break}F=f+4600|0;O=f+24540|0;P=f+5768|0;Q=0;while(1){if((Q|0)==1){aa=c[F>>2]|0}else{aa=0}N=ck(r+(Q*12232&-1)|0,g,H,c[O>>2]|0,Q,aa)|0;if((N|0)!=0){z=N;break}L79:do{if((c[r+(Q*12232&-1)+4692>>2]|0)!=0|L){if((c[P>>2]|0)>0){ab=0}else{break}while(1){c[r+(Q*12232&-1)+4752+(ab<<2)>>2]=0;N=ab+1|0;if((N|0)<(c[P>>2]|0)){ab=N}else{break L79}}}}while(0);c[r+(Q*12232&-1)+6104>>2]=c[r+(Q*12232&-1)+6100>>2]|0;N=Q+1|0;if((N|0)<(c[D>>2]|0)){Q=N}else{ac=0;ad=F;ae=O;af=P;ag=U;ah=S;ai=G;break L70}}i=n;return z|0}}while(0);if((W|0)==32){ac=Y;ad=f+4600|0;ae=f+24540|0;af=f+5768|0;ag=X;ah=Z;ai=_}_=f+4608|0;Z=f+5764|0;X=x*10&-1;x=f+4580|0;Y=f+24532|0;S=f+18032|0;U=f+5800|0;ab=U;L=f+5120|0;aa=L;T=p|0;V=f+16840|0;G=f+17996|0;P=f+16832|0;O=S;F=f+17352|0;Q=q;H=f+24498|0;N=f+16984|0;M=f+24520|0;K=f+24464|0;J=f+5124|0;R=f+17356|0;I=o|0;aj=f+4556|0;ak=g+56|0;al=f+24544|0;am=f+19424|0;an=f+12376|0;ao=f+12248|0;ap=f+16800|0;aq=f+16732|0;ar=f+16797|0;as=f+16748|0;at=f+16924|0;au=f+6104|0;av=f+24536|0;aw=f+18336|0;ax=k+24|0;ay=k+40|0;aA=k+28|0;aB=k+44|0;aC=k+32|0;aD=k|0;aE=g+52|0;aF=(s|0)==2;aG=o+4|0;aI=s<<1;aJ=s-1|0;aK=(s|0)==3;s=f+24468|0;aL=L;L=k+20|0;aM=p;aN=h;h=j;j=0;aO=ac;while(1){ac=c[Z>>2]|0;aP=(c[_>>2]|0)-ac|0;aQ=c[ad>>2]|0;aR=$(aQ,X);aS=(aP|0)<(aR|0)?aP:aR;aR=($(aS,c[x>>2]|0)|0)/(aQ*1e3&-1|0)&-1;do{if((c[y>>2]|0)==2){aQ=c[D>>2]|0;if((aQ|0)==2){aP=c[w>>2]|0;aT=(aR|0)>0;L94:do{if(aT){aU=0;while(1){b[p+(aU<<1)>>1]=b[aN+(aU<<1<<1)>>1]|0;aV=aU+1|0;if((aV|0)==(aR|0)){break L94}else{aU=aV}}}}while(0);if((c[Y>>2]|0)==1&(aP|0)==0){dH(S|0,U|0,300)}ct(ab,aa+(ac+2<<1)|0,T,aR);c[Z>>2]=(c[Z>>2]|0)+aS|0;aU=c[G>>2]|0;aV=(c[V>>2]|0)-aU|0;aW=$(c[P>>2]|0,X);aX=(aV|0)<(aW|0)?aV:aW;L101:do{if(aT){aW=0;while(1){b[p+(aW<<1)>>1]=b[aN+((aW<<1|1)<<1)>>1]|0;aV=aW+1|0;if((aV|0)==(aR|0)){break L101}else{aW=aV}}}}while(0);ct(O,F+(aU+2<<1)|0,T,aR);c[G>>2]=(c[G>>2]|0)+aX|0;aY=c[Z>>2]|0;break}else if((aQ|0)==1){L106:do{if((aR|0)>0){aT=0;while(1){aP=aT<<1;aW=(b[aN+((aP|1)<<1)>>1]|0)+(b[aN+(aP<<1)>>1]|0)|0;b[p+(aT<<1)>>1]=(aW>>>1)+(aW&1)&65535;aW=aT+1|0;if((aW|0)==(aR|0)){break L106}else{aT=aW}}}}while(0);ct(ab,aa+(ac+2<<1)|0,T,aR);L110:do{if((c[Y>>2]|0)==2){if((c[w>>2]|0)!=0){break}ct(O,F+((c[G>>2]|0)+2<<1)|0,T,aR);if((c[_>>2]|0)>0){aZ=0}else{break}while(1){aQ=aZ+2|0;aX=aa+(aQ+(c[Z>>2]|0)<<1)|0;b[aX>>1]=((b[F+(aQ+(c[G>>2]|0)<<1)>>1]|0)+(b[aX>>1]|0)|0)>>>1&65535;aX=aZ+1|0;if((aX|0)<(c[_>>2]|0)){aZ=aX}else{break L110}}}}while(0);aX=(c[Z>>2]|0)+aS|0;c[Z>>2]=aX;aY=aX;break}else{W=58;break}}else{W=58}}while(0);if((W|0)==58){W=0;dH(aM|0,aN|0,aR<<1);aX=aa+(ac+2<<1)|0;ct(ab,aX,T,aR);aX=(c[Z>>2]|0)+aS|0;c[Z>>2]=aX;aY=aX}aX=aN+($(c[y>>2]|0,aR)<<1)|0;aQ=h-aR|0;c[ae>>2]=0;if((aY|0)<(c[_>>2]|0)){a_=aO;a$=0;break}L120:do{if((c[w>>2]|m|0)==0){b[q>>1]=0;a[Q]=256-(256>>>($((c[af>>2]|0)+1|0,c[D>>2]|0)>>>0))&255;bw(k,0,Q,8);aU=c[D>>2]|0;L122:do{if((aU|0)>0){aT=0;while(1){aW=c[r+(aT*12232&-1)+5768>>2]|0;do{if((aW|0)>0){aP=0;aV=0;while(1){a0=c[r+(aT*12232&-1)+4752+(aV<<2)>>2]<<aV|aP;a1=aV+1|0;if((a1|0)<(aW|0)){aP=a0;aV=a1}else{break}}a[r+(aT*12232&-1)+4751|0]=(a0|0)>0&1;if(!((a0|0)!=0&(aW|0)>1)){break}bw(k,a0-1|0,c[5250552+(aW-2<<2)>>2]|0,8)}else{a[r+(aT*12232&-1)+4751|0]=0}}while(0);aW=aT+1|0;aV=c[D>>2]|0;if((aW|0)<(aV|0)){aT=aW}else{a2=aV;break L122}}}else{a2=aU}}while(0);aU=c[af>>2]|0;L133:do{if((aU|0)>0){aT=0;aV=a2;aW=aU;while(1){if((aV|0)>0){aP=H+(aT*6&-1)+2|0;a1=H+(aT*6&-1)+5|0;a3=H+(aT*6&-1)|0;a4=H+(aT*6&-1)+1|0;a5=H+(aT*6&-1)+3|0;a6=H+(aT*6&-1)+4|0;a7=N+(aT<<2)|0;a8=f+(aT+24516|0)|0;a9=(aT|0)>0;ba=aT-1|0;bb=0;bc=aV;while(1){bd=r+(bb*12232&-1)|0;if((c[r+(bb*12232&-1)+4752+(aT<<2)>>2]|0)==0){be=bc}else{do{if((bc|0)==2&(bb|0)==0){bw(k,((a[aP]|0)*5&-1)+(a[a1]|0)|0,5246280,8);bw(k,a[a3]|0,5246236,8);bw(k,a[a4]|0,5246224,8);bw(k,a[a5]|0,5246236,8);bw(k,a[a6]|0,5246224,8);if((c[a7>>2]|0)!=0){break}bw(k,a[a8]|0,5246308,8)}}while(0);do{if(a9){if((c[r+(bb*12232&-1)+4752+(ba<<2)>>2]|0)==0){W=77;break}else{bf=2;break}}else{W=77}}while(0);if((W|0)==77){W=0;bf=0}b5(bd,k,aT,1,bf);b6(k,a[r+(bb*12232&-1)+6124+(aT*36&-1)+29|0]|0,a[r+(bb*12232&-1)+6124+(aT*36&-1)+30|0]|0,r+(bb*12232&-1)+6232+(aT*320&-1)|0,c[r+(bb*12232&-1)+4608>>2]|0);be=c[D>>2]|0}bg=bb+1|0;if((bg|0)<(be|0)){bb=bg;bc=be}else{break}}bh=be;bi=c[af>>2]|0}else{bh=aV;bi=aW}bc=aT+1|0;if((bc|0)<(bi|0)){aT=bc;aV=bh;aW=bi}else{bj=bh;break L133}}}else{bj=a2}}while(0);if((bj|0)>0){bk=0}else{break}while(1){dF(r+(bk*12232&-1)+4752|0,0,12);aU=bk+1|0;if((aU|0)<(c[D>>2]|0)){bk=aU}else{break L120}}}}while(0);cf(u);aS=c[ai>>2]|0;ac=c[A>>2]|0;aU=($(ac,aS)|0)/1e3&-1;if(E){bl=aU}else{aW=c[L>>2]|0;bl=aU-((dG(c[aA>>2]|0)|-32)+aW>>1)|0}aW=c[w>>2]|0;aU=((bl|0)/((c[af>>2]|0)-aW|0)&-1)<<16>>16;if((ac|0)==10){bm=aU*100&-1}else{bm=aU*50&-1}aU=bm-(((c[M>>2]|0)*1e3&-1|0)/500&-1)|0;do{if((aS|0)>5e3){if((aU|0)>(aS|0)){bn=aS;break}bn=(aU|0)<5e3?5e3:aU}else{if((aU|0)>5e3){bn=5e3;break}bn=(aU|0)<(aS|0)?aS:aU}}while(0);do{if((c[D>>2]|0)==2){cg(K,J,R,H+(aW*6&-1)|0,f+(aW+24516|0)|0,I,bn,c[aj>>2]|0,c[ak>>2]|0,c[ad>>2]|0,c[_>>2]|0);aU=c[w>>2]|0;if((a[f+(aU+24516|0)|0]|0)==0){if((c[al>>2]|0)==1){c[ao>>2]=0;c[ao+4>>2]=0;dF(an|0,0,4412);dF(am|0,0,2156);c[ap>>2]=100;c[aq>>2]=100;a[am]=10;a[ar]=0;c[as>>2]=65536;c[at>>2]=1}az(t|0)}else{a[f+(aU+16980|0)|0]=0}if(E){break}aU=c[w>>2]|0;bw(k,((a[H+(aU*6&-1)+2|0]|0)*5&-1)+(a[H+(aU*6&-1)+5|0]|0)|0,5246280,8);bw(k,a[H+(aU*6&-1)|0]|0,5246236,8);bw(k,a[H+(aU*6&-1)+1|0]|0,5246224,8);bw(k,a[H+(aU*6&-1)+3|0]|0,5246236,8);bw(k,a[H+(aU*6&-1)+4|0]|0,5246224,8);aU=c[w>>2]|0;if((a[f+(aU+16980|0)|0]|0)!=0){break}bw(k,a[f+(aU+24516|0)|0]|0,5246308,8)}else{v=e[s>>1]|e[s+2>>1]<<16;b[aL>>1]=v&65535;b[aL+2>>1]=v>>16;aU=aa+(c[_>>2]<<1)|0;v=e[aU>>1]|e[aU+2>>1]<<16;b[s>>1]=v&65535;b[s+2>>1]=v>>16}}while(0);az(u|0);aW=c[D>>2]|0;L184:do{if((aW|0)>0){aU=aF&(j|0)==0;aS=c[aG>>2]|0;ac=(j|0)==(aJ|0);aV=aO;aT=0;bc=aW;while(1){bb=c[aE>>2]|0;do{if(aU){bo=(bb*3&-1|0)/5&-1}else{if(!aK){bo=bb;break}if((j|0)==0){bo=(bb<<1|0)/5&-1;break}else if((j|0)==1){bo=(bb*3&-1|0)/4&-1;break}else{bo=bb;break}}}while(0);ba=ac&(c[B>>2]|0)!=0&1;do{if((bc|0)==1){bp=ba;bq=bo;br=bn}else{a9=c[o+(aT<<2)>>2]|0;if((aT|0)!=0|(aS|0)<1){bp=ba;bq=bo;br=a9;break}bp=0;bq=bo-((bb|0)/(aI|0)&-1)|0;br=a9}}while(0);if((br|0)>0){bb=r+(aT*12232&-1)|0;if((br|0)>8e4){bs=8e4}else{bs=(br|0)<5e3?5e3:br}ba=r+(aT*12232&-1)+4632|0;do{if((bs|0)!=(c[ba>>2]|0)){c[ba>>2]=bs;a9=c[r+(aT*12232&-1)+4600>>2]|0;if((a9|0)==12){bt=5247720}else if((a9|0)==8){bt=5247688}else{bt=5247656}a9=(c[r+(aT*12232&-1)+4604>>2]|0)==2?bs-2200|0:bs;a8=1;while(1){if((a8|0)>=8){break}bu=c[bt+(a8<<2)>>2]|0;if((a9|0)>(bu|0)){a8=a8+1|0}else{W=125;break}}if((W|0)==125){W=0;a7=a8-1|0;a6=c[bt+(a7<<2)>>2]|0;a5=b[5247752+(a7<<1)>>1]|0;c[r+(aT*12232&-1)+4744>>2]=$((b[5247752+(a8<<1)>>1]|0)-a5|0,(a9-a6<<6|0)/(bu-a6|0)&-1)+(a5<<6)|0}if((c[r+(aT*12232&-1)+6116>>2]|0)==0){break}a5=r+(aT*12232&-1)+4744|0;c[a5>>2]=((12-(c[r+(aT*12232&-1)+6120>>2]|0)<<16>>16)*-31&-1)+(c[a5>>2]|0)|0}}while(0);do{if(((c[w>>2]|0)-aT|0)<1){bv=0}else{if((aT|0)>0){if((c[al>>2]|0)!=0){bv=1;break}}bv=2}}while(0);bx=aH(bb|0,l|0,k|0,bv|0,bq|0,bp|0)|0}else{bx=aV}c[r+(aT*12232&-1)+4696>>2]=0;c[r+(aT*12232&-1)+5764>>2]=0;ba=r+(aT*12232&-1)+5772|0;c[ba>>2]=(c[ba>>2]|0)+1|0;ba=aT+1|0;a5=c[D>>2]|0;if((ba|0)<(a5|0)){aV=bx;aT=ba;bc=a5}else{by=bx;break L184}}}else{by=aO}}while(0);aW=c[w>>2]|0;c[al>>2]=a[f+(aW+24515|0)|0]|0;do{if((c[l>>2]|0)>0){if((aW|0)!=(c[af>>2]|0)){break}bc=c[D>>2]|0;L230:do{if((bc|0)>0){aT=0;aV=0;while(1){aS=c[r+(aV*12232&-1)+5768>>2]|0;ac=aT<<1;L233:do{if((aS|0)>0){aU=0;a5=ac;while(1){ba=aU+1|0;a6=(a[r+(aV*12232&-1)+4748+aU|0]|0|a5)<<1;if((ba|0)<(aS|0)){aU=ba;a5=a6}else{bz=a6;break L233}}}else{bz=ac}}while(0);ac=a[r+(aV*12232&-1)+4751|0]|0|bz;aS=aV+1|0;if((aS|0)<(bc|0)){aT=ac;aV=aS}else{bA=ac;break L230}}}else{bA=0}}while(0);do{if(!E){aV=$(aW+1|0,bc);aT=8-aV|0;bb=(1<<aV)-1<<aT;if((c[ax>>2]|0)!=0){ac=c[aD>>2]|0;a[ac]=((d[ac]|0)&(bb^255)|bA<<aT)&255;break}ac=c[ay>>2]|0;if((ac|0)>-1){c[ay>>2]=ac&(bb^-1)|bA<<aT;break}if((c[aA>>2]|0)>>>0>-2147483648>>>(aV>>>0)>>>0){c[aB>>2]=-1;break}else{c[aC>>2]=c[aC>>2]&(bb<<23^-1)|bA<<aT+23;break}}}while(0);do{if((c[au>>2]|0)!=0){if((c[D>>2]|0)!=1){if((c[aw>>2]|0)==0){break}}c[l>>2]=0}}while(0);bc=(c[M>>2]|0)+(c[l>>2]<<3)|0;c[M>>2]=bc;aT=bc-(($(c[A>>2]|0,c[ai>>2]|0)|0)/1e3&-1)|0;c[M>>2]=aT;if((aT|0)>1e4){bB=1e4}else{bB=(aT|0)<0?0:aT}c[M>>2]=bB;aT=c[av>>2]|0;if((c[aj>>2]|0)<((((aT<<16>>16)*3188&-1)>>16)+13|0)){c[ae>>2]=1;c[av>>2]=0;break}else{c[ae>>2]=0;c[av>>2]=aT+(c[A>>2]|0)|0;break}}}while(0);if((h|0)==(aR|0)){W=158;break}else{aN=aX;h=aQ;j=j+1|0;aO=by}}if((W|0)==158){a_=by;a$=c[ae>>2]|0}c[Y>>2]=c[D>>2]|0;c[g+68>>2]=a$;if((c[ad>>2]|0)==16){bC=(c[f+28>>2]|0)==0}else{bC=0}c[g+72>>2]=bC&1;c[g+64>>2]=(c[ad>>2]<<16>>16)*1e3&-1;if((c[ak>>2]|0)==0){bD=b[f+24492>>1]|0}else{bD=0}c[g+76>>2]=bD;if(!E){z=a_;i=n;return z|0}c[A>>2]=ah;c[C>>2]=ag;if((c[D>>2]|0)>0){bE=0}else{z=a_;i=n;return z|0}while(1){c[r+(bE*12232&-1)+4696>>2]=0;c[r+(bE*12232&-1)+4708>>2]=0;ag=bE+1|0;if((ag|0)<(c[D>>2]|0)){bE=ag}else{z=a_;break}}i=n;return z|0}function b4(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;if((g|0)>0){h=0}else{return}while(1){i=a[d+h|0]|0;do{if((h|f|0)==0){j=(a[e]|0)-16|0;k=((i|0)>(j|0)?i:j)&255;a[e]=k;l=k}else{k=i-4|0;j=a[e]|0;if((k|0)>(j+8|0)){m=(k<<1)+248&255;a[e]=m;l=m;break}else{m=j+k&255;a[e]=m;l=m;break}}}while(0);if(l<<24>>24>63){n=63}else{n=l<<24>>24<0?0:l}a[e]=n;i=n<<24>>24;m=((i*29&-1)+2090|0)+((i*7281&-1)>>16)|0;i=(m|0)<3967?m:3967;if((i|0)<0){o=0}else{m=i>>7;k=1<<m;j=i&127;if((i|0)<2048){p=($(j*-174&-1,128-j|0)>>16)+j<<m>>7}else{p=$(($(j*-174&-1,128-j|0)>>16)+j|0,k>>7)}o=p+k|0}c[b+(h<<2)>>2]=o;k=h+1|0;if((k|0)==(g|0)){break}else{h=k}}return}function b5(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;j=i;i=i+32|0;k=j|0;l=(g|0)!=0;if(l){m=d+6124+(f*36&-1)|0}else{m=d+4764|0}f=m+29|0;g=((a[f]|0)<<1)+(a[m+30|0]|0)|0;if(l|(g|0)>1){bw(e,g-2|0,5246244,8)}else{bw(e,g,5246240,8)}g=(h|0)==2;l=m|0;n=a[l]|0;if(g){bw(e,n,5247612,8)}else{bw(e,n>>3,5247588+((a[f]|0)<<3)|0,8);bw(e,a[l]&7,5246208,8)}l=d+4604|0;L316:do{if((c[l>>2]|0)>1){n=1;while(1){bw(e,a[m+n|0]|0,5247612,8);o=n+1|0;if((o|0)<(c[l>>2]|0)){n=o}else{break L316}}}}while(0);n=m+8|0;o=a[n]|0;p=d+4720|0;q=c[p>>2]|0;r=$(b[q>>1]|0,(a[f]|0)>>1);bw(e,o,(c[q+12>>2]|0)+r|0,8);r=c[p>>2]|0;q=b[r+2>>1]|0;o=q<<16>>16>0;L320:do{if(o){s=q<<16>>16;t=$(a[n]|0,s);u=0;v=(c[r+20>>2]|0)+((t|0)/2&-1)|0;while(1){t=a[v]|0;b[k+(u<<1)>>1]=((t&255)>>>1&7)*9&65535;b[k+((u|1)<<1)>>1]=((t&255)>>>5&255)*9&65535;t=u+2|0;if((t|0)<(s|0)){u=t;v=v+1|0}else{break}}if(o){w=0;x=r}else{break}while(1){v=w+1|0;u=v+(m+8)|0;s=a[u]|0;t=s<<24>>24;do{if(s<<24>>24>3){bw(e,8,(c[x+24>>2]|0)+(b[k+(w<<1)>>1]|0)|0,8);bw(e,(a[u]|0)-4|0,5248084,8)}else{if(s<<24>>24<-3){bw(e,0,(c[x+24>>2]|0)+(b[k+(w<<1)>>1]|0)|0,8);bw(e,-4-(a[u]|0)|0,5248084,8);break}else{bw(e,t+4|0,(c[x+24>>2]|0)+(b[k+(w<<1)>>1]|0)|0,8);break}}}while(0);t=c[p>>2]|0;if((v|0)<(b[t+2>>1]|0|0)){w=v;x=t}else{break L320}}}}while(0);if((c[l>>2]|0)==4){bw(e,a[m+31|0]|0,5248024,8)}if((a[f]|0)!=2){y=a[f]|0;z=y<<24>>24;A=d+5792|0;c[A>>2]=z;B=m+34|0;C=a[B]|0;D=C<<24>>24;bw(e,D,5246232,8);i=j;return}do{if(g){if((c[d+5792>>2]|0)!=2){E=232;break}x=d+5796|0;w=(b[m+26>>1]|0)-(b[x>>1]|0)|0;p=(w+8|0)>>>0>19;bw(e,p?0:w+9|0,5247496,8);if(p){E=232;break}else{F=x;break}}else{E=232}}while(0);if((E|0)==232){E=b[m+26>>1]|0;g=c[d+4600>>2]>>1;x=(E|0)/(g|0)&-1;p=E-$(x<<16>>16,g<<16>>16)|0;bw(e,x,5247464,8);bw(e,p,c[d+4712>>2]|0,8);F=d+5796|0}b[F>>1]=b[m+26>>1]|0;bw(e,a[m+28|0]|0,c[d+4716>>2]|0,8);F=m+32|0;bw(e,a[F]|0,5249932,8);L347:do{if((c[l>>2]|0)>0){p=0;while(1){bw(e,a[p+(m+4)|0]|0,c[5250216+((a[F]|0)<<2)>>2]|0,8);x=p+1|0;if((x|0)<(c[l>>2]|0)){p=x}else{break L347}}}}while(0);if((h|0)!=0){y=a[f]|0;z=y<<24>>24;A=d+5792|0;c[A>>2]=z;B=m+34|0;C=a[B]|0;D=C<<24>>24;bw(e,D,5246232,8);i=j;return}bw(e,a[m+33|0]|0,5249916,8);y=a[f]|0;z=y<<24>>24;A=d+5792|0;c[A>>2]=z;B=m+34|0;C=a[B]|0;D=C<<24>>24;bw(e,D,5246232,8);i=j;return}function b6(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;j=i;i=i+1476|0;k=j|0;l=j+4|0;m=j+1284|0;n=j+1364|0;o=j+1444|0;dF(o|0,0,32);p=h>>4;if((p<<4|0)<(h|0)){dF(g+h|0,0,16);q=p+1|0}else{q=p}p=q<<4;L359:do{if((p|0)>0){r=0;while(1){s=a[g+r|0]|0;t=s<<24>>24;c[l+(r<<2)>>2]=s<<24>>24>0?t:-t|0;t=r|1;s=a[g+t|0]|0;u=s<<24>>24;c[l+(t<<2)>>2]=s<<24>>24>0?u:-u|0;u=r|2;s=a[g+u|0]|0;t=s<<24>>24;c[l+(u<<2)>>2]=s<<24>>24>0?t:-t|0;t=r|3;s=a[g+t|0]|0;u=s<<24>>24;c[l+(t<<2)>>2]=s<<24>>24>0?u:-u|0;u=r+4|0;if((u|0)<(p|0)){r=u}else{break L359}}}}while(0);p=(q|0)>0;L363:do{if(p){r=l|0;u=0;while(1){s=n+(u<<2)|0;c[s>>2]=0;t=0;while(1){v=t<<1;w=(c[r+((v|1)<<2)>>2]|0)+(c[r+(v<<2)>>2]|0)|0;if((w|0)>8){x=1}else{c[o+(t<<2)>>2]=w;w=t+1|0;if((w|0)<8){t=w;continue}else{x=0}}w=o|0;v=c[w>>2]|0;y=o+4|0;z=c[y>>2]|0;A=z+v|0;do{if((A|0)>10){B=1;C=v;D=z}else{c[w>>2]=A;E=o+8|0;F=o+12|0;G=(c[F>>2]|0)+(c[E>>2]|0)|0;if((G|0)>10){B=1;C=A;D=z;break}c[y>>2]=G;H=(c[o+20>>2]|0)+(c[o+16>>2]|0)|0;if((H|0)>10){B=1;C=A;D=G;break}c[E>>2]=H;H=(c[o+28>>2]|0)+(c[o+24>>2]|0)|0;if((H|0)>10){B=1;C=A;D=G;break}c[F>>2]=H;B=0;C=A;D=G}}while(0);A=B+x|0;z=D+C|0;do{if((z|0)>12){I=1;J=C;K=D}else{c[w>>2]=z;v=(c[o+12>>2]|0)+(c[o+8>>2]|0)|0;if((v|0)>12){I=1;J=z;K=D;break}c[y>>2]=v;I=0;J=z;K=v}}while(0);z=K+J|0;if((z|0)>16){L=1}else{c[m+(u<<2)>>2]=z;L=0}if((A+I|0)==(-L|0)){break}c[s>>2]=(c[s>>2]|0)+1|0;c[r>>2]=c[r>>2]>>1;z=r+4|0;c[z>>2]=c[z>>2]>>1;z=r+8|0;c[z>>2]=c[z>>2]>>1;z=r+12|0;c[z>>2]=c[z>>2]>>1;z=r+16|0;c[z>>2]=c[z>>2]>>1;z=r+20|0;c[z>>2]=c[z>>2]>>1;z=r+24|0;c[z>>2]=c[z>>2]>>1;z=r+28|0;c[z>>2]=c[z>>2]>>1;z=r+32|0;c[z>>2]=c[z>>2]>>1;z=r+36|0;c[z>>2]=c[z>>2]>>1;z=r+40|0;c[z>>2]=c[z>>2]>>1;z=r+44|0;c[z>>2]=c[z>>2]>>1;z=r+48|0;c[z>>2]=c[z>>2]>>1;z=r+52|0;c[z>>2]=c[z>>2]>>1;z=r+56|0;c[z>>2]=c[z>>2]>>1;z=r+60|0;c[z>>2]=c[z>>2]>>1;t=0}t=u+1|0;if((t|0)==(q|0)){break L363}else{r=r+64|0;u=t}}}}while(0);L=e>>1;I=0;J=2147483647;K=0;while(1){D=d[5247100+(L*9&-1)+K|0]|0;L390:do{if(p){o=5247317+(K*18&-1)|0;C=D;x=0;while(1){if((c[n+(x<<2)>>2]|0)>0){M=o}else{M=(c[m+(x<<2)>>2]|0)+(5247300+(K*18&-1))|0}B=(d[M]|0)+C|0;u=x+1|0;if((u|0)==(q|0)){N=B;break L390}else{C=B;x=u}}}else{N=D}}while(0);D=(N|0)<(J|0);O=D?K:I;x=K+1|0;if((x|0)==9){break}else{I=O;J=D?N:J;K=x}}bw(b,O,5247080+(L*9&-1)|0,8);L=5247120+(O*18&-1)|0;L399:do{if(p){O=0;while(1){K=c[n+(O<<2)>>2]|0;if((K|0)==0){bw(b,c[m+(O<<2)>>2]|0,L,8)}else{bw(b,17,L,8);J=K-1|0;L405:do{if((J|0)>0){K=0;while(1){bw(b,17,5247282,8);N=K+1|0;if((N|0)<(J|0)){K=N}else{break L405}}}}while(0);bw(b,c[m+(O<<2)>>2]|0,5247282,8)}J=O+1|0;if((J|0)==(q|0)){break}else{O=J}}if(p){P=0}else{break}while(1){if((c[m+(P<<2)>>2]|0)>0){cc(b,l+(P<<4<<2)|0)}O=P+1|0;if((O|0)==(q|0)){break}else{P=O}}if(p){Q=0}else{break}while(1){O=c[n+(Q<<2)>>2]|0;L419:do{if((O|0)>0){J=Q<<4;K=O-1|0;A=(K|0)>0;N=0;while(1){I=a[g+(N+J|0)|0]|0;M=(I<<24>>24>0?I:-I&255)<<24>>24;L423:do{if(A){I=K;while(1){bw(b,M>>>(I>>>0)&1,5247584,8);x=I-1|0;if((x|0)>0){I=x}else{break L423}}}}while(0);bw(b,M&1,5247584,8);I=N+1|0;if((I|0)==16){break L419}else{N=I}}}}while(0);O=Q+1|0;if((O|0)==(q|0)){break L399}else{Q=O}}}}while(0);Q=k|0;a[k+1|0]=0;k=((e<<1)+f<<16>>16)*7&-1;f=h+8>>4;if((f|0)>0){R=0;S=g}else{i=j;return}while(1){g=c[m+(R<<2)>>2]|0;L433:do{if((g|0)>0){h=g&31;a[Q]=a[5246312+((h>>>0<6?h:6)+k|0)|0]|0;h=0;while(1){e=a[S+h|0]|0;if(e<<24>>24!=0){bw(b,(e<<24>>24>>15)+1|0,Q,8)}e=h+1|0;if((e|0)==16){break L433}else{h=e}}}}while(0);g=R+1|0;if((g|0)==(f|0)){break}else{R=g;S=S+16|0}}i=j;return}function b7(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;h=i;i=i+80|0;j=h|0;k=h+16|0;l=h+48|0;m=g+2|0;n=b[m>>1]|0;o=$(n<<16>>16,a[f]|0);p=c[g+8>>2]|0;L443:do{if(n<<16>>16>0){q=0;while(1){b[e+(q<<1)>>1]=(d[p+(q+o|0)|0]|0)<<7;r=q+1|0;s=b[m>>1]|0;t=s<<16>>16;if((r|0)<(t|0)){q=r}else{break}}L447:do{if(s<<16>>16>0){q=$(a[f]|0,t);r=c[g+16>>2]|0;u=0;v=(c[g+20>>2]|0)+((q|0)/2&-1)|0;while(1){q=d[v]|0;w=s<<16>>16;x=w-1|0;a[j+u|0]=a[r+((x&-(q&1))+u|0)|0]|0;y=u|1;a[j+y|0]=a[r+((x&-(q>>>4&1))+y|0)|0]|0;y=u+2|0;if((y|0)<(w|0)){u=y;v=v+1|0}else{break L447}}}}while(0);if(s<<16>>16<=0){z=s;A=304;break}v=s<<16>>16;u=b[g+4>>1]|0;r=0;y=v;while(1){w=y-1|0;q=$(d[j+w|0]|0,r)>>8;x=(a[f+y|0]|0)<<10;if((x|0)>0){B=x-102|0}else{B=(x|0)<0?x|102:x}x=$(B>>16,u);C=(x+q|0)+($(B&65535,u)>>16)|0;b[k+(w<<1)>>1]=C&65535;if((w|0)>0){r=C<<16>>16;y=w}else{D=v;break L443}}}else{z=n;A=304}}while(0);if((A|0)==304){D=z<<16>>16}cq(l|0,e,D);D=b[m>>1]|0;if(D<<16>>16>0){E=0}else{F=D<<16>>16;G=g+32|0;H=c[G>>2]|0;cp(e,H,F);i=h;return}while(1){D=b[l+(E<<1)>>1]|0;z=D&65535;n=z<<16;if((n|0)<1){I=0}else{do{if(n>>>0>65535){B=D<<16>>16;if(D<<16>>16==0){J=8;K=16}else{do{if((B&65280|0)==0){f=(B&65520|0)==0;L=f?12:8;M=f?z:B>>>4}else{if((B&61440|0)==0){L=4;M=B>>>8;break}else{L=0;M=B>>>12;break}}}while(0);B=M<<16>>16;do{if((B&12|0)==0){if((B&14|0)==0){N=L|3;break}else{N=L|2;break}}else{N=(B>>>3&1|L)^1}}while(0);B=24-N|0;if((N|0)==24){O=n;P=24;break}if((B|0)<0){Q=-B|0;R=B;S=N;A=326;break}else{J=B;K=N}}O=n<<32-J|n>>>(J>>>0);P=K;break}else{Q=8;R=-8;S=32;A=326}}while(0);if((A|0)==326){A=0;O=n>>>((R+32|0)>>>0)|n<<Q;P=S}z=((P&1|0)==0?46214:32768)>>>(P>>1>>>0);D=$(O&127,13959168)>>>16;B=$(z>>16,D);I=(B+z|0)+($(z&65535,D)>>>16)|0}D=e+(E<<1)|0;z=(((b[k+(E<<1)>>1]|0)<<14|0)/(I|0)&-1)+(b[D>>1]|0)|0;if((z|0)>32767){T=32767}else{T=(z|0)<0?0:z&65535}b[D>>1]=T;D=E+1|0;z=b[m>>1]|0;if((D|0)<(z|0)){E=D}else{F=z;break}}G=g+32|0;H=c[G>>2]|0;cp(e,H,F);i=h;return}function b8(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;h=c[d+2316>>2]|0;i=d+4248|0;if((h|0)!=(c[i>>2]|0)){c[d+4168>>2]=c[d+2328>>2]<<7;c[d+4240>>2]=65536;c[d+4244>>2]=65536;c[d+4256>>2]=20;c[d+4252>>2]=2;c[i>>2]=h}if((g|0)!=0){b9(d,e,f);f=d+4160|0;c[f>>2]=(c[f>>2]|0)+1|0;return}f=d+4168|0;g=a[d+2765|0]|0;c[d+4164>>2]=g<<24>>24;L504:do{if(g<<24>>24==2){i=d+2332|0;j=c[d+2324>>2]|0;k=j-1|0;l=e+(k<<2)|0;m=c[l>>2]|0;n=d+4172|0;o=n;do{if((m|0)<1|(j|0)==0){dF(n|0,0,10);p=0;q=d+4176|0}else{r=f|0;s=j+65535|0;t=0;u=0;v=0;w=m;while(1){x=k+v|0;y=x*5&-1;z=((((b[e+96+(y+1<<1)>>1]|0)+(b[e+96+(y<<1)>>1]|0)|0)+(b[e+96+(y+2<<1)>>1]|0)|0)+(b[e+96+(y+3<<1)>>1]|0)|0)+(b[e+96+(y+4<<1)>>1]|0)|0;if((z|0)>(u|0)){y=e+96+(((s+v<<16>>16)*5&-1)<<1)|0;b[o>>1]=b[y>>1]|0;b[o+2>>1]=b[y+2>>1]|0;b[o+4>>1]=b[y+4>>1]|0;b[o+6>>1]=b[y+6>>1]|0;b[o+8>>1]=b[y+8>>1]|0;c[r>>2]=c[e+(x<<2)>>2]<<8;A=z;B=c[l>>2]|0}else{A=u;B=w}z=t+1|0;x=t^-1;if(($(c[i>>2]|0,z)|0)>=(B|0)|(z|0)==(j|0)){break}else{t=z;u=A;v=x;w=B}}dF(o|0,0,10);w=d+4176|0;b[w>>1]=A&65535;if((A|0)<11469){p=A;q=w;break}if((A|0)<=15565){C=j;D=i;break L504}b[d+4172>>1]=0;b[d+4174>>1]=0;b[w>>1]=$((255016960/(A|0)&-1)<<16>>16,A<<16>>16)>>>14&65535;b[d+4178>>1]=0;b[d+4180>>1]=0;C=j;D=i;break L504}}while(0);b[d+4172>>1]=0;b[d+4174>>1]=0;b[q>>1]=$((11744256/(((p|0)>1?p:1)|0)&-1)<<16>>16,p<<16>>16)>>>10&65535;b[d+4178>>1]=0;b[d+4180>>1]=0;C=j;D=i}else{c[f>>2]=(h<<16>>16)*4608&-1;dF(d+4172|0,0,10);C=c[d+2324>>2]|0;D=d+2332|0}}while(0);dH(d+4182|0,e+64|0,c[d+2340>>2]<<1);b[d+4236>>1]=c[e+136>>2]&65535;h=e+16+(C-2<<2)|0;e=d+4240|0;f=c[h+4>>2]|0;c[e>>2]=c[h>>2]|0;c[e+4>>2]=f;c[d+4256>>2]=c[D>>2]|0;c[d+4252>>2]=C;return}function b9(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0;f=i;i=i+32|0;g=f|0;h=c[a+4256>>2]|0;j=i;i=i+((h<<1)*2&-1)|0;i=i+3>>2<<2;k=a+2336|0;l=c[k>>2]|0;m=i;i=i+(l*2&-1)|0;i=i+3>>2<<2;n=a+2328|0;o=i;i=i+(((c[n>>2]|0)+l|0)*4&-1)|0;i=i+3>>2<<2;l=c[a+4240>>2]|0;p=l>>>6;q=a+4244|0;r=c[q>>2]|0;s=r>>6;if((c[a+2376>>2]|0)!=0){dF(a+4182|0,0,32)}t=a+4252|0;u=(h|0)>0;L525:do{if(u){v=c[t>>2]|0;w=0;while(1){x=c[a+4+($(v-2|0,h)+w<<2)>>2]|0;y=p<<16>>16;z=$(y,x>>16);A=($(y,x&65535)>>16)+z|0;z=A+$((l>>21)+1>>1,x)>>8;if((z|0)>32767){B=32767}else{B=(z|0)<-32768?-32768:z&65535}b[j+(w<<1)>>1]=B;z=w+1|0;if((z|0)<(h|0)){w=z}else{break}}if(!u){break}w=c[t>>2]|0;v=0;while(1){z=c[a+4+($(w-1|0,h)+v<<2)>>2]|0;x=s<<16>>16;A=$(x,z>>16);y=($(x,z&65535)>>16)+A|0;A=y+$((r>>21)+1>>1,z)>>8;if((A|0)>32767){C=32767}else{C=(A|0)<-32768?-32768:A&65535}b[j+(h+v<<1)>>1]=C;A=v+1|0;if((A|0)<(h|0)){v=A}else{break L525}}}}while(0);C=h-1|0;u=0;B=0;while(1){if((B|0)>=(C|0)){D=B;E=0;F=u;break}G=b[j+(B<<1)>>1]|0;l=G<<16>>16;p=$(l,l)+u|0;l=b[j+((B|1)<<1)>>1]|0;H=p+$(l,l)|0;if((H|0)<0){I=364;break}else{u=H;B=B+2|0}}L543:do{if((I|0)==364){u=B;l=2;p=H>>>2;v=G;while(1){w=v<<16>>16;A=$(w,w);w=b[j+((u|1)<<1)>>1]|0;z=(($(w,w)+A|0)>>>(l>>>0))+p|0;if((z|0)<0){J=z>>>2;K=l+2|0}else{J=z;K=l}z=u+2|0;if((z|0)>=(C|0)){D=z;E=K;F=J;break L543}u=z;l=K;p=J;v=b[j+(z<<1)>>1]|0}}}while(0);if((D|0)==(C|0)){D=b[j+(C<<1)>>1]|0;L=($(D,D)>>>(E>>>0))+F|0}else{L=F}if(L>>>0>1073741823){M=L>>>2;N=E+2|0}else{M=L;N=E}E=0;L=0;while(1){if((L|0)>=(C|0)){O=L;P=0;Q=E;break}F=b[j+(L+h<<1)>>1]|0;D=$(F,F)+E|0;F=b[j+((L|1)+h<<1)>>1]|0;R=D+$(F,F)|0;if((R|0)<0){I=376;break}else{E=R;L=L+2|0}}L561:do{if((I|0)==376){E=L;F=2;D=R>>>2;while(1){J=b[j+(E+h<<1)>>1]|0;K=$(J,J);J=b[j+((E|1)+h<<1)>>1]|0;G=(($(J,J)+K|0)>>>(F>>>0))+D|0;if((G|0)<0){S=G>>>2;T=F+2|0}else{S=G;T=F}G=E+2|0;if((G|0)<(C|0)){E=G;F=T;D=S}else{O=G;P=T;Q=S;break L561}}}}while(0);if((O|0)==(C|0)){O=b[j+(C+h<<1)>>1]|0;U=($(O,O)>>>(P>>>0))+Q|0}else{U=Q}if(U>>>0>1073741823){V=U>>>2;W=P+2|0}else{V=U;W=P}P=c[t>>2]|0;if((M>>W|0)<(V>>N|0)){N=$(h,P-1|0)-128|0;X=(N|0)<0?0:N}else{N=$(h,P)-128|0;X=(N|0)<0?0:N}N=a+4172|0;P=a+4224|0;h=b[P>>1]|0;V=a+4160|0;W=c[V>>2]|0;M=(W|0)>1?1:W;W=b[5263324+(M<<1)>>1]|0;t=a+4164|0;U=b[((c[t>>2]|0)==2?5263080:5263084)+(M<<1)>>1]|0;M=a+4182|0;Q=M|0;O=a+2340|0;C=(c[O>>2]|0)-1|0;L579:do{if((C|0)>0){j=0;S=64881;while(1){T=a+4182+(j<<1)|0;b[T>>1]=(($(b[T>>1]|0,S)>>>15)+1|0)>>>1&65535;T=(((S*-655&-1)>>15)+1>>1)+S|0;R=j+1|0;if((R|0)==(C|0)){Y=T;break L579}else{j=R;S=T}}}else{Y=64881}}while(0);S=a+4182+(C<<1)|0;b[S>>1]=(($(b[S>>1]|0,Y)>>>15)+1|0)>>>1&65535;Y=c[O>>2]|0;dH(g|0,M|0,Y<<1);do{if((c[V>>2]|0)==0){if((c[t>>2]|0)==2){M=((((16384-(b[N>>1]|0)&65535)-(b[a+4174>>1]|0)&65535)-(b[a+4176>>1]|0)&65535)-(b[a+4178>>1]|0)&65535)-(b[a+4180>>1]|0)&65535;Z=$(b[a+4236>>1]|0,M<<16>>16<3277?3277:M<<16>>16)>>>14&65535;_=U;break}else{M=cm(Q,Y)|0;S=(M|0)>134217728?134217728:M;M=(S|0)<4194304?33554432:S<<3;S=$(M>>16,U);Z=16384;_=($(M&65528,U)>>16)+S>>14;break}}else{Z=h;_=U}}while(0);U=a+4220|0;h=c[U>>2]|0;Q=a+4168|0;t=(c[Q>>2]>>7)+1>>1;V=c[k>>2]|0;S=((V-2|0)-Y|0)-t|0;M=g|0;co(m+(S<<1)|0,a+1348+(S<<1)|0,M,V-S|0,Y);Y=c[q>>2]|0;q=ca((Y|0)>0?Y:-Y|0)|0;C=Y<<q-1;Y=C>>16;j=536870911/(Y|0)&-1;T=j<<16;R=T>>16;L=$(Y,R);Y=(536870912-L|0)-($(C&65535,R)>>16)<<3;C=$(Y>>16,R);L=$(Y&65528,R)>>16;R=(($(Y,(j>>15)+1>>1)+T|0)+C|0)+L|0;L=62-q|0;q=L-46|0;if((q|0)<1){C=46-L|0;L=-2147483648>>C;T=2147483647>>>(C>>>0);do{if((L|0)>(T|0)){if((R|0)>(L|0)){aa=L;break}aa=(R|0)<(T|0)?T:R}else{if((R|0)>(T|0)){aa=T;break}aa=(R|0)<(L|0)?L:R}}while(0);ab=aa<<C}else{ab=(q|0)<32?R>>q:0}q=(ab|0)<1073741823?ab:1073741823;ab=c[O>>2]|0;R=ab+S|0;S=c[k>>2]|0;L599:do{if((R|0)<(S|0)){k=q>>16;C=q&65535;aa=R;while(1){L=b[m+(aa<<1)>>1]|0;T=$(L,k);c[o+(aa<<2)>>2]=($(L,C)>>16)+T|0;T=aa+1|0;if((T|0)<(S|0)){aa=T}else{break L599}}}}while(0);m=c[a+2324>>2]|0;L604:do{if((m|0)>0){R=W<<16>>16;q=_<<16>>16;aa=a+2316|0;C=a+4174|0;k=a+4176|0;T=a+4178|0;L=a+4180|0;j=c[a+2332>>2]|0;Y=h;I=Z;D=V;F=t;E=0;while(1){L608:do{if((j|0)>0){G=I<<16>>16;K=b[N>>1]|0;J=b[C>>1]|0;H=b[k>>1]|0;B=b[T>>1]|0;v=b[L>>1]|0;p=o+((D+2|0)-F<<2)|0;l=Y;u=D;z=0;while(1){A=c[p>>2]|0;w=K<<16>>16;y=$(w,A>>16);x=$(w,A&65535)>>16;A=c[p-4>>2]|0;w=J<<16>>16;ac=$(w,A>>16);ad=$(w,A&65535)>>16;A=c[p-8>>2]|0;w=H<<16>>16;ae=$(w,A>>16);af=$(w,A&65535)>>16;A=c[p-12>>2]|0;w=B<<16>>16;ag=$(w,A>>16);ah=$(w,A&65535)>>16;A=c[p-16>>2]|0;w=v<<16>>16;ai=$(w,A>>16);aj=$(w,A&65535)>>16;A=$(l,196314165)+907633515|0;w=c[a+4+((A>>>25)+X<<2)>>2]|0;ak=$(w>>16,G);c[o+(u<<2)>>2]=(((((((((((y+2|0)+x|0)+ac|0)+ad|0)+ae|0)+af|0)+ag|0)+ah|0)+ai|0)+aj|0)+ak|0)+($(w&65535,G)>>16)<<2;w=u+1|0;ak=z+1|0;if((ak|0)<(j|0)){p=p+4|0;l=A;u=w;z=ak}else{al=A;am=w;an=K;ao=J;ap=H;aq=B;ar=v;as=G;break L608}}}else{al=Y;am=D;an=b[N>>1]|0;ao=b[C>>1]|0;ap=b[k>>1]|0;aq=b[T>>1]|0;ar=b[L>>1]|0;as=I<<16>>16}}while(0);b[N>>1]=$(an<<16>>16,R)>>>15&65535;b[C>>1]=$(ao<<16>>16,R)>>>15&65535;b[k>>1]=$(ap<<16>>16,R)>>>15&65535;b[T>>1]=$(aq<<16>>16,R)>>>15&65535;b[L>>1]=$(ar<<16>>16,R)>>>15&65535;G=$(as,q)>>>15&65535;v=c[Q>>2]|0;B=(((v>>16)*655&-1)+v|0)+(((v&65535)*655&-1)>>>16)|0;v=(c[aa>>2]<<16>>16)*4608&-1;H=(B|0)<(v|0)?B:v;c[Q>>2]=H;v=(H>>7)+1>>1;H=E+1|0;if((H|0)<(m|0)){Y=al;I=G;D=am;F=v;E=H}else{at=al;au=G;av=v;break L604}}}else{at=h;au=Z;av=t}}while(0);t=S-16|0;Z=a+1284|0;dH(o+(t<<2)|0,Z|0,64);a=c[n>>2]|0;if((a|0)<=0){aw=a;ax=aw+t|0;ay=o+(ax<<2)|0;az=ay;dH(Z|0,az|0,64);c[U>>2]=at;b[P>>1]=au;aA=d|0;c[aA>>2]=av;aB=d+4|0;c[aB>>2]=av;aC=d+8|0;c[aC>>2]=av;aD=d+12|0;c[aD>>2]=av;i=f;return}a=S-1|0;h=b[M>>1]|0;M=S-2|0;al=b[g+2>>1]|0;am=S-3|0;m=b[g+4>>1]|0;Q=S-4|0;as=b[g+6>>1]|0;ar=S-5|0;aq=b[g+8>>1]|0;ap=S-6|0;ao=b[g+10>>1]|0;an=S-7|0;N=b[g+12>>1]|0;X=S-8|0;V=b[g+14>>1]|0;_=S-9|0;W=b[g+16>>1]|0;E=S-10|0;F=b[g+18>>1]|0;D=s<<16>>16;s=(r>>21)+1>>1;r=0;I=ab;while(1){ab=a+r|0;Y=c[o+(ab<<2)>>2]|0;aa=$(h,Y>>16);q=$(h,Y&65535)>>16;Y=c[o+(M+r<<2)>>2]|0;R=$(al,Y>>16);L=$(al,Y&65535)>>16;Y=c[o+(am+r<<2)>>2]|0;T=$(m,Y>>16);k=$(m,Y&65535)>>16;Y=c[o+(Q+r<<2)>>2]|0;C=$(as,Y>>16);j=$(as,Y&65535)>>16;Y=c[o+(ar+r<<2)>>2]|0;v=$(aq,Y>>16);G=$(aq,Y&65535)>>16;Y=c[o+(ap+r<<2)>>2]|0;H=$(ao,Y>>16);B=$(ao,Y&65535)>>16;Y=c[o+(an+r<<2)>>2]|0;J=$(N,Y>>16);K=$(N,Y&65535)>>16;Y=c[o+(X+r<<2)>>2]|0;z=$(V,Y>>16);u=$(V,Y&65535)>>16;Y=c[o+(_+r<<2)>>2]|0;l=$(W,Y>>16);p=$(W,Y&65535)>>16;Y=c[o+(E+r<<2)>>2]|0;w=$(F,Y>>16);A=(((((((((((((((((((aa+(I>>1)|0)+q|0)+R|0)+L|0)+T|0)+k|0)+C|0)+j|0)+v|0)+G|0)+H|0)+B|0)+J|0)+K|0)+z|0)+u|0)+l|0)+p|0)+w|0)+($(F,Y&65535)>>16)|0;L620:do{if((I|0)>10){Y=A;w=10;while(1){p=c[o+(ab-w<<2)>>2]|0;l=b[g+(w<<1)>>1]|0;u=$(l,p>>16);z=(u+Y|0)+($(l,p&65535)>>16)|0;p=w+1|0;if((p|0)<(I|0)){Y=z;w=p}else{aE=z;break L620}}}else{aE=A}}while(0);A=o+(r+S<<2)|0;ab=(c[A>>2]|0)+(aE<<4)|0;c[A>>2]=ab;A=$(D,ab>>16);w=($(D,ab&65535)>>16)+A|0;A=(w+$(s,ab)>>7)+1>>1;if((A|0)>32767){aF=32767}else{aF=(A|0)<-32768?-32768:A&65535}b[e+(r<<1)>>1]=aF;A=r+1|0;ab=c[n>>2]|0;if((A|0)>=(ab|0)){aw=ab;break}r=A;I=c[O>>2]|0}ax=aw+t|0;ay=o+(ax<<2)|0;az=ay;dH(Z|0,az|0,64);c[U>>2]=at;b[P>>1]=au;aA=d|0;c[aA>>2]=av;aB=d+4|0;c[aB>>2]=av;aC=d+8|0;c[aC>>2]=av;aD=d+12|0;c[aD>>2]=av;i=f;return}function ca(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0;if(a>>>0<=65535){b=a<<16>>16;do{if((a&65535)<<16>>16==0){c=16}else{do{if((b&65280|0)==0){d=(b&65520|0)==0;e=d?12:8;f=d?a:b>>>4}else{if((b&61440|0)==0){e=4;f=b>>>8;break}else{e=0;f=b>>>12;break}}}while(0);d=f<<16>>16;if((d&12|0)!=0){c=(d>>>3&1|e)^1;break}if((d&14|0)==0){c=e|3;break}else{c=e|2;break}}}while(0);g=c+16|0;return g|0}c=a>>>16;a=c<<16>>16;if((c|0)==0){g=16;return g|0}do{if((a&65280|0)==0){e=(a&65520|0)==0;h=e?12:8;i=e?c:a>>>4}else{if((a&61440|0)==0){h=4;i=a>>>8;break}else{h=0;i=a>>>12;break}}}while(0);a=i<<16>>16;if((a&12|0)!=0){g=(a>>>3&1|h)^1;return g|0}if((a&14|0)==0){g=h|3;return g|0}else{g=h|2;return g|0}return 0}function cb(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;if((c[a+4160>>2]|0)!=0){f=a+4228|0;g=a+4232|0;h=e-1|0;i=0;j=0;while(1){if((j|0)>=(h|0)){k=j;l=0;m=i;break}n=b[d+(j<<1)>>1]|0;o=n<<16>>16;p=$(o,o)+i|0;o=b[d+((j|1)<<1)>>1]|0;q=p+$(o,o)|0;if((q|0)<0){r=461;break}else{i=q;j=j+2|0}}L675:do{if((r|0)==461){i=j;o=2;p=q>>>2;s=n;while(1){t=s<<16>>16;u=$(t,t);t=b[d+((i|1)<<1)>>1]|0;v=(($(t,t)+u|0)>>>(o>>>0))+p|0;if((v|0)<0){w=v>>>2;x=o+2|0}else{w=v;x=o}v=i+2|0;if((v|0)>=(h|0)){k=v;l=x;m=w;break L675}i=v;o=x;p=w;s=b[d+(v<<1)>>1]|0}}}while(0);if((k|0)==(h|0)){k=b[d+(h<<1)>>1]|0;y=($(k,k)>>>(l>>>0))+m|0}else{y=m}if(y>>>0>1073741823){z=y>>>2;A=l+2|0}else{z=y;A=l}c[g>>2]=A;c[f>>2]=z;c[a+4216>>2]=1;return}z=a+4216|0;L692:do{if((c[z>>2]|0)!=0){f=e-1|0;A=0;g=0;while(1){if((g|0)>=(f|0)){B=g;C=0;D=A;break}E=b[d+(g<<1)>>1]|0;l=E<<16>>16;y=$(l,l)+A|0;l=b[d+((g|1)<<1)>>1]|0;F=y+$(l,l)|0;if((F|0)<0){r=475;break}else{A=F;g=g+2|0}}L697:do{if((r|0)==475){A=g;l=2;y=F>>>2;m=E;while(1){k=m<<16>>16;h=$(k,k);k=b[d+((A|1)<<1)>>1]|0;w=(($(k,k)+h|0)>>>(l>>>0))+y|0;if((w|0)<0){G=w>>>2;H=l+2|0}else{G=w;H=l}w=A+2|0;if((w|0)>=(f|0)){B=w;C=H;D=G;break L697}A=w;l=H;y=G;m=b[d+(w<<1)>>1]|0}}}while(0);if((B|0)==(f|0)){g=b[d+(f<<1)>>1]|0;I=($(g,g)>>>(C>>>0))+D|0}else{I=D}if(I>>>0>1073741823){J=I>>>2;K=C+2|0}else{J=I;K=C}g=c[a+4232>>2]|0;do{if((K|0)>(g|0)){m=a+4228|0;c[m>>2]=c[m>>2]>>K-g;L=J}else{if((K|0)>=(g|0)){L=J;break}L=J>>g-K}}while(0);g=a+4228|0;f=c[g>>2]|0;if((L|0)<=(f|0)){break}m=ca(f)|0;y=f<<m-1;c[g>>2]=y;g=25-m|0;m=L>>((g|0)>0?g:0);g=(y|0)/(((m|0)>1?m:1)|0)&-1;if((g|0)<1){M=0}else{m=ca(g)|0;y=24-m|0;f=-y|0;do{if((m|0)==24){N=g}else{if((y|0)<0){N=g>>>((y+32|0)>>>0)|g<<f;break}else{N=g<<32-y|g>>>(y>>>0);break}}}while(0);y=((m&1|0)==0?46214:32768)>>>(m>>1>>>0);g=$(N&127,13959168)>>>16;f=$(g,y>>16);M=(f+y|0)+($(g,y&65535)>>>16)<<4}y=((65536-M|0)/(e|0)&-1)<<2;g=M;f=0;while(1){if((f|0)>=(e|0)){break L692}l=d+(f<<1)|0;A=b[l>>1]|0;w=$(A,g>>16);b[l>>1]=($(A,g&65532)>>>16)+w&65535;w=g+y|0;if((w|0)>65536){break L692}else{g=w;f=f+1|0}}}}while(0);c[z>>2]=0;return}function cc(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=(c[b+4>>2]|0)+(c[b>>2]|0)|0;f=b+8|0;g=(c[b+12>>2]|0)+(c[f>>2]|0)|0;h=b+16|0;i=(c[b+20>>2]|0)+(c[h>>2]|0)|0;j=b+24|0;k=(c[b+28>>2]|0)+(c[j>>2]|0)|0;l=b+32|0;m=(c[b+36>>2]|0)+(c[l>>2]|0)|0;n=b+40|0;o=(c[b+44>>2]|0)+(c[n>>2]|0)|0;p=b+48|0;q=(c[b+52>>2]|0)+(c[p>>2]|0)|0;r=b+56|0;s=(c[b+60>>2]|0)+(c[r>>2]|0)|0;t=g+e|0;u=k+i|0;v=o+m|0;w=s+q|0;x=u+t|0;y=w+v|0;z=y+x|0;if((z|0)>0){bw(a,x,5246376+(d[z+5246356|0]|0)|0,8)}if((x|0)>0){bw(a,t,5246528+(d[x+5246356|0]|0)|0,8)}if((t|0)>0){bw(a,e,5246680+(d[t+5246356|0]|0)|0,8)}if((e|0)>0){bw(a,c[b>>2]|0,5246832+(d[e+5246356|0]|0)|0,8)}if((g|0)>0){bw(a,c[f>>2]|0,5246832+(d[g+5246356|0]|0)|0,8)}if((u|0)>0){bw(a,i,5246680+(d[u+5246356|0]|0)|0,8)}if((i|0)>0){bw(a,c[h>>2]|0,5246832+(d[i+5246356|0]|0)|0,8)}if((k|0)>0){bw(a,c[j>>2]|0,5246832+(d[k+5246356|0]|0)|0,8)}if((y|0)>0){bw(a,v,5246528+(d[y+5246356|0]|0)|0,8)}if((v|0)>0){bw(a,m,5246680+(d[v+5246356|0]|0)|0,8)}if((m|0)>0){bw(a,c[l>>2]|0,5246832+(d[m+5246356|0]|0)|0,8)}if((o|0)>0){bw(a,c[n>>2]|0,5246832+(d[o+5246356|0]|0)|0,8)}if((w|0)>0){bw(a,q,5246680+(d[w+5246356|0]|0)|0,8)}if((q|0)>0){bw(a,c[p>>2]|0,5246832+(d[q+5246356|0]|0)|0,8)}if((s|0)<=0){return}bw(a,c[r>>2]|0,5246832+(d[s+5246356|0]|0)|0,8);return}function cd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0;do{if((e|0)>0){f=d[e+5246356|0]|0;g=b+28|0;h=c[g>>2]|0;i=b+32|0;j=c[i>>2]|0;k=h>>>8;l=-1;m=h;while(1){n=l+1|0;o=$(d[5246376+(n+f|0)|0]|0,k);if(j>>>0<o>>>0){l=n;m=o}else{break}}l=j-o|0;c[i>>2]=l;k=m-o|0;c[g>>2]=k;L785:do{if(k>>>0<8388609){f=b+20|0;h=b+40|0;p=b+24|0;q=b|0;r=c[b+4>>2]|0;s=c[f>>2]|0;t=k;u=c[h>>2]|0;v=c[p>>2]|0;w=l;while(1){x=s+8|0;c[f>>2]=x;y=t<<8;c[g>>2]=y;if(v>>>0<r>>>0){z=v+1|0;c[p>>2]=z;A=d[(c[q>>2]|0)+v|0]|0;B=z}else{A=0;B=v}c[h>>2]=A;z=((A|u<<8)>>>1&255|w<<8&2147483392)^255;c[i>>2]=z;if(y>>>0<8388609){s=x;t=y;u=A;v=B;w=z}else{C=y;D=z;break L785}}}else{C=k;D=l}}while(0);l=e-n|0;if((n|0)<=0){E=l;F=0;G=560;break}k=d[n+5246356|0]|0;m=C>>>8;j=-1;w=C;while(1){H=j+1|0;I=$(d[5246528+(H+k|0)|0]|0,m);if(D>>>0<I>>>0){j=H;w=I}else{break}}j=D-I|0;c[i>>2]=j;m=w-I|0;c[g>>2]=m;L797:do{if(m>>>0<8388609){k=b+20|0;v=b+40|0;u=b+24|0;t=b|0;s=c[b+4>>2]|0;h=c[k>>2]|0;q=m;p=c[v>>2]|0;r=c[u>>2]|0;f=j;while(1){z=h+8|0;c[k>>2]=z;y=q<<8;c[g>>2]=y;if(r>>>0<s>>>0){x=r+1|0;c[u>>2]=x;J=d[(c[t>>2]|0)+r|0]|0;K=x}else{J=0;K=r}c[v>>2]=J;x=((J|p<<8)>>>1&255|f<<8&2147483392)^255;c[i>>2]=x;if(y>>>0<8388609){h=z;q=y;p=J;r=K;f=x}else{L=y;M=x;break L797}}}else{L=m;M=j}}while(0);j=n-H|0;if((H|0)<=0){E=l;F=j;G=560;break}m=d[H+5246356|0]|0;w=L>>>8;f=-1;r=L;while(1){N=f+1|0;O=$(d[5246680+(N+m|0)|0]|0,w);if(M>>>0<O>>>0){f=N;r=O}else{break}}f=M-O|0;c[i>>2]=f;w=r-O|0;c[g>>2]=w;L809:do{if(w>>>0<8388609){m=b+20|0;p=b+40|0;q=b+24|0;h=b|0;v=c[b+4>>2]|0;t=c[m>>2]|0;u=w;s=c[p>>2]|0;k=c[q>>2]|0;x=f;while(1){y=t+8|0;c[m>>2]=y;z=u<<8;c[g>>2]=z;if(k>>>0<v>>>0){P=k+1|0;c[q>>2]=P;Q=d[(c[h>>2]|0)+k|0]|0;R=P}else{Q=0;R=k}c[p>>2]=Q;P=((Q|s<<8)>>>1&255|x<<8&2147483392)^255;c[i>>2]=P;if(z>>>0<8388609){t=y;u=z;s=Q;k=R;x=P}else{S=z;T=P;break L809}}}else{S=w;T=f}}while(0);f=H-N|0;w=a+4|0;if((N|0)<=0){U=j;V=l;W=f;X=w;G=570;break}r=d[N+5246356|0]|0;x=S>>>8;k=-1;s=S;while(1){Y=k+1|0;Z=$(d[5246832+(Y+r|0)|0]|0,x);if(T>>>0<Z>>>0){k=Y;s=Z}else{break}}k=T-Z|0;c[i>>2]=k;x=s-Z|0;c[g>>2]=x;L821:do{if(x>>>0<8388609){r=b+20|0;u=b+40|0;t=b+24|0;p=b|0;h=c[b+4>>2]|0;q=c[r>>2]|0;v=x;m=c[u>>2]|0;P=c[t>>2]|0;z=k;while(1){y=q+8|0;c[r>>2]=y;_=v<<8;c[g>>2]=_;if(P>>>0<h>>>0){aa=P+1|0;c[t>>2]=aa;ab=d[(c[p>>2]|0)+P|0]|0;ac=aa}else{ab=0;ac=P}c[u>>2]=ab;aa=((ab|m<<8)>>>1&255|z<<8&2147483392)^255;c[i>>2]=aa;if(_>>>0<8388609){q=y;v=_;m=ab;P=ac;z=aa}else{break L821}}}}while(0);c[a>>2]=Y;ad=N-Y|0;ae=j;af=l;ag=f;ah=w;break}else{E=0;F=0;G=560}}while(0);do{if((G|0)==560){U=F;V=E;W=0;X=a+4|0;G=570;break}}while(0);if((G|0)==570){c[a>>2]=0;ad=0;ae=U;af=V;ag=W;ah=X}c[ah>>2]=ad;ad=a+8|0;ah=a+12|0;if((ag|0)>0){X=d[ag+5246356|0]|0;W=b+28|0;V=c[W>>2]|0;U=b+32|0;E=c[U>>2]|0;F=V>>>8;Y=-1;N=V;while(1){ai=Y+1|0;aj=$(d[5246832+(ai+X|0)|0]|0,F);if(E>>>0<aj>>>0){Y=ai;N=aj}else{break}}Y=E-aj|0;c[U>>2]=Y;E=N-aj|0;c[W>>2]=E;L839:do{if(E>>>0<8388609){aj=b+20|0;N=b+40|0;F=b+24|0;X=b|0;V=c[b+4>>2]|0;ac=c[aj>>2]|0;ab=E;Z=c[N>>2]|0;T=c[F>>2]|0;S=Y;while(1){H=ac+8|0;c[aj>>2]=H;R=ab<<8;c[W>>2]=R;if(T>>>0<V>>>0){Q=T+1|0;c[F>>2]=Q;ak=d[(c[X>>2]|0)+T|0]|0;al=Q}else{ak=0;al=T}c[N>>2]=ak;Q=((ak|Z<<8)>>>1&255|S<<8&2147483392)^255;c[U>>2]=Q;if(R>>>0<8388609){ac=H;ab=R;Z=ak;T=al;S=Q}else{break L839}}}}while(0);c[ad>>2]=ai;am=ag-ai|0}else{c[ad>>2]=0;am=0}c[ah>>2]=am;do{if((ae|0)>0){am=d[ae+5246356|0]|0;ah=b+28|0;ad=c[ah>>2]|0;ai=b+32|0;ag=c[ai>>2]|0;al=ad>>>8;ak=-1;U=ad;while(1){an=ak+1|0;ao=$(d[5246680+(an+am|0)|0]|0,al);if(ag>>>0<ao>>>0){ak=an;U=ao}else{break}}ak=ag-ao|0;c[ai>>2]=ak;al=U-ao|0;c[ah>>2]=al;L855:do{if(al>>>0<8388609){am=b+20|0;ad=b+40|0;W=b+24|0;Y=b|0;E=c[b+4>>2]|0;S=c[am>>2]|0;T=al;Z=c[ad>>2]|0;ab=c[W>>2]|0;ac=ak;while(1){N=S+8|0;c[am>>2]=N;X=T<<8;c[ah>>2]=X;if(ab>>>0<E>>>0){F=ab+1|0;c[W>>2]=F;ap=d[(c[Y>>2]|0)+ab|0]|0;aq=F}else{ap=0;aq=ab}c[ad>>2]=ap;F=((ap|Z<<8)>>>1&255|ac<<8&2147483392)^255;c[ai>>2]=F;if(X>>>0<8388609){S=N;T=X;Z=ap;ab=aq;ac=F}else{ar=X;as=F;break L855}}}else{ar=al;as=ak}}while(0);ak=ae-an|0;al=a+16|0;U=a+20|0;if((an|0)<=0){at=ak;au=al;av=U;G=599;break}ag=d[an+5246356|0]|0;ac=ar>>>8;ab=-1;Z=ar;while(1){aw=ab+1|0;ax=$(d[5246832+(aw+ag|0)|0]|0,ac);if(as>>>0<ax>>>0){ab=aw;Z=ax}else{break}}ab=as-ax|0;c[ai>>2]=ab;ac=Z-ax|0;c[ah>>2]=ac;L867:do{if(ac>>>0<8388609){ag=b+20|0;T=b+40|0;S=b+24|0;ad=b|0;Y=c[b+4>>2]|0;W=c[ag>>2]|0;E=ac;am=c[T>>2]|0;F=c[S>>2]|0;X=ab;while(1){N=W+8|0;c[ag>>2]=N;V=E<<8;c[ah>>2]=V;if(F>>>0<Y>>>0){aj=F+1|0;c[S>>2]=aj;ay=d[(c[ad>>2]|0)+F|0]|0;az=aj}else{ay=0;az=F}c[T>>2]=ay;aj=((ay|am<<8)>>>1&255|X<<8&2147483392)^255;c[ai>>2]=aj;if(V>>>0<8388609){W=N;E=V;am=ay;F=az;X=aj}else{break L867}}}}while(0);c[al>>2]=aw;aA=an-aw|0;aB=ak;aC=U;break}else{at=0;au=a+16|0;av=a+20|0;G=599;break}}while(0);if((G|0)==599){c[au>>2]=0;aA=0;aB=at;aC=av}c[aC>>2]=aA;aA=a+24|0;aC=a+28|0;if((aB|0)>0){av=d[aB+5246356|0]|0;at=b+28|0;au=c[at>>2]|0;aw=b+32|0;an=c[aw>>2]|0;az=au>>>8;ay=-1;ax=au;while(1){aD=ay+1|0;aE=$(d[5246832+(aD+av|0)|0]|0,az);if(an>>>0<aE>>>0){ay=aD;ax=aE}else{break}}ay=an-aE|0;c[aw>>2]=ay;an=ax-aE|0;c[at>>2]=an;L883:do{if(an>>>0<8388609){aE=b+20|0;ax=b+40|0;az=b+24|0;av=b|0;au=c[b+4>>2]|0;as=c[aE>>2]|0;ar=an;ae=c[ax>>2]|0;aq=c[az>>2]|0;ap=ay;while(1){ao=as+8|0;c[aE>>2]=ao;ai=ar<<8;c[at>>2]=ai;if(aq>>>0<au>>>0){ah=aq+1|0;c[az>>2]=ah;aF=d[(c[av>>2]|0)+aq|0]|0;aG=ah}else{aF=0;aG=aq}c[ax>>2]=aF;ah=((aF|ae<<8)>>>1&255|ap<<8&2147483392)^255;c[aw>>2]=ah;if(ai>>>0<8388609){as=ao;ar=ai;ae=aF;aq=aG;ap=ah}else{break L883}}}}while(0);c[aA>>2]=aD;aH=aB-aD|0}else{c[aA>>2]=0;aH=0}c[aC>>2]=aH;do{if((af|0)>0){aH=d[af+5246356|0]|0;aC=b+28|0;aA=c[aC>>2]|0;aD=b+32|0;aB=c[aD>>2]|0;aG=aA>>>8;aF=-1;aw=aA;while(1){aI=aF+1|0;aJ=$(d[5246528+(aI+aH|0)|0]|0,aG);if(aB>>>0<aJ>>>0){aF=aI;aw=aJ}else{break}}aF=aB-aJ|0;c[aD>>2]=aF;aG=aw-aJ|0;c[aC>>2]=aG;L898:do{if(aG>>>0<8388609){aH=b+20|0;aA=b+40|0;at=b+24|0;ay=b|0;an=c[b+4>>2]|0;ap=c[aH>>2]|0;aq=aG;ae=c[aA>>2]|0;ar=c[at>>2]|0;as=aF;while(1){ax=ap+8|0;c[aH>>2]=ax;av=aq<<8;c[aC>>2]=av;if(ar>>>0<an>>>0){az=ar+1|0;c[at>>2]=az;aK=d[(c[ay>>2]|0)+ar|0]|0;aL=az}else{aK=0;aL=ar}c[aA>>2]=aK;az=((aK|ae<<8)>>>1&255|as<<8&2147483392)^255;c[aD>>2]=az;if(av>>>0<8388609){ap=ax;aq=av;ae=aK;ar=aL;as=az}else{aM=av;aN=az;break L898}}}else{aM=aG;aN=aF}}while(0);aF=af-aI|0;if((aI|0)<=0){aO=aF;G=626;break}aG=d[aI+5246356|0]|0;aw=aM>>>8;aB=-1;as=aM;while(1){aP=aB+1|0;aQ=$(d[5246680+(aP+aG|0)|0]|0,aw);if(aN>>>0<aQ>>>0){aB=aP;as=aQ}else{break}}aB=aN-aQ|0;c[aD>>2]=aB;aw=as-aQ|0;c[aC>>2]=aw;L910:do{if(aw>>>0<8388609){aG=b+20|0;ar=b+40|0;ae=b+24|0;aq=b|0;ap=c[b+4>>2]|0;aA=c[aG>>2]|0;ay=aw;at=c[ar>>2]|0;an=c[ae>>2]|0;aH=aB;while(1){az=aA+8|0;c[aG>>2]=az;av=ay<<8;c[aC>>2]=av;if(an>>>0<ap>>>0){ax=an+1|0;c[ae>>2]=ax;aR=d[(c[aq>>2]|0)+an|0]|0;aS=ax}else{aR=0;aS=an}c[ar>>2]=aR;ax=((aR|at<<8)>>>1&255|aH<<8&2147483392)^255;c[aD>>2]=ax;if(av>>>0<8388609){aA=az;ay=av;at=aR;an=aS;aH=ax}else{aT=av;aU=ax;break L910}}}else{aT=aw;aU=aB}}while(0);aB=aI-aP|0;aw=a+32|0;as=a+36|0;if((aP|0)<=0){aV=aF;aW=aB;aX=aw;aY=as;G=636;break}aH=d[aP+5246356|0]|0;an=aT>>>8;at=-1;ay=aT;while(1){aZ=at+1|0;a_=$(d[5246832+(aZ+aH|0)|0]|0,an);if(aU>>>0<a_>>>0){at=aZ;ay=a_}else{break}}at=aU-a_|0;c[aD>>2]=at;an=ay-a_|0;c[aC>>2]=an;L922:do{if(an>>>0<8388609){aH=b+20|0;aA=b+40|0;ar=b+24|0;aq=b|0;ae=c[b+4>>2]|0;ap=c[aH>>2]|0;aG=an;ax=c[aA>>2]|0;av=c[ar>>2]|0;az=at;while(1){au=ap+8|0;c[aH>>2]=au;aE=aG<<8;c[aC>>2]=aE;if(av>>>0<ae>>>0){U=av+1|0;c[ar>>2]=U;a$=d[(c[aq>>2]|0)+av|0]|0;a0=U}else{a$=0;a0=av}c[aA>>2]=a$;U=((a$|ax<<8)>>>1&255|az<<8&2147483392)^255;c[aD>>2]=U;if(aE>>>0<8388609){ap=au;aG=aE;ax=a$;av=a0;az=U}else{break L922}}}}while(0);c[aw>>2]=aZ;a1=aP-aZ|0;a2=aF;a3=aB;a4=as;break}else{aO=0;G=626}}while(0);do{if((G|0)==626){aV=aO;aW=0;aX=a+32|0;aY=a+36|0;G=636;break}}while(0);if((G|0)==636){c[aX>>2]=0;a1=0;a2=aV;a3=aW;a4=aY}c[a4>>2]=a1;a1=a+40|0;a4=a+44|0;if((a3|0)>0){aY=d[a3+5246356|0]|0;aW=b+28|0;aV=c[aW>>2]|0;aX=b+32|0;aO=c[aX>>2]|0;aZ=aV>>>8;aP=-1;a0=aV;while(1){a5=aP+1|0;a6=$(d[5246832+(a5+aY|0)|0]|0,aZ);if(aO>>>0<a6>>>0){aP=a5;a0=a6}else{break}}aP=aO-a6|0;c[aX>>2]=aP;aO=a0-a6|0;c[aW>>2]=aO;L940:do{if(aO>>>0<8388609){a6=b+20|0;a0=b+40|0;aZ=b+24|0;aY=b|0;aV=c[b+4>>2]|0;a$=c[a6>>2]|0;a_=aO;aU=c[a0>>2]|0;aT=c[aZ>>2]|0;aI=aP;while(1){aS=a$+8|0;c[a6>>2]=aS;aR=a_<<8;c[aW>>2]=aR;if(aT>>>0<aV>>>0){aQ=aT+1|0;c[aZ>>2]=aQ;a7=d[(c[aY>>2]|0)+aT|0]|0;a8=aQ}else{a7=0;a8=aT}c[a0>>2]=a7;aQ=((a7|aU<<8)>>>1&255|aI<<8&2147483392)^255;c[aX>>2]=aQ;if(aR>>>0<8388609){a$=aS;a_=aR;aU=a7;aT=a8;aI=aQ}else{break L940}}}}while(0);c[a1>>2]=a5;a9=a3-a5|0}else{c[a1>>2]=0;a9=0}c[a4>>2]=a9;do{if((a2|0)>0){a9=d[a2+5246356|0]|0;a4=b+28|0;a1=c[a4>>2]|0;a5=b+32|0;a3=c[a5>>2]|0;a8=a1>>>8;a7=-1;aX=a1;while(1){ba=a7+1|0;bb=$(d[5246680+(ba+a9|0)|0]|0,a8);if(a3>>>0<bb>>>0){a7=ba;aX=bb}else{break}}a7=a3-bb|0;c[a5>>2]=a7;a8=aX-bb|0;c[a4>>2]=a8;L956:do{if(a8>>>0<8388609){a9=b+20|0;a1=b+40|0;aW=b+24|0;aP=b|0;aO=c[b+4>>2]|0;aI=c[a9>>2]|0;aT=a8;aU=c[a1>>2]|0;a_=c[aW>>2]|0;a$=a7;while(1){a0=aI+8|0;c[a9>>2]=a0;aY=aT<<8;c[a4>>2]=aY;if(a_>>>0<aO>>>0){aZ=a_+1|0;c[aW>>2]=aZ;bc=d[(c[aP>>2]|0)+a_|0]|0;bd=aZ}else{bc=0;bd=a_}c[a1>>2]=bc;aZ=((bc|aU<<8)>>>1&255|a$<<8&2147483392)^255;c[a5>>2]=aZ;if(aY>>>0<8388609){aI=a0;aT=aY;aU=bc;a_=bd;a$=aZ}else{be=aY;bf=aZ;break L956}}}else{be=a8;bf=a7}}while(0);a7=a2-ba|0;a8=a+48|0;aX=a+52|0;if((ba|0)<=0){bg=a7;bh=a8;bi=aX;G=665;break}a3=d[ba+5246356|0]|0;a$=be>>>8;a_=-1;aU=be;while(1){bj=a_+1|0;bk=$(d[5246832+(bj+a3|0)|0]|0,a$);if(bf>>>0<bk>>>0){a_=bj;aU=bk}else{break}}a_=bf-bk|0;c[a5>>2]=a_;a$=aU-bk|0;c[a4>>2]=a$;L968:do{if(a$>>>0<8388609){a3=b+20|0;aT=b+40|0;aI=b+24|0;a1=b|0;aP=c[b+4>>2]|0;aW=c[a3>>2]|0;aO=a$;a9=c[aT>>2]|0;aZ=c[aI>>2]|0;aY=a_;while(1){a0=aW+8|0;c[a3>>2]=a0;aV=aO<<8;c[a4>>2]=aV;if(aZ>>>0<aP>>>0){a6=aZ+1|0;c[aI>>2]=a6;bl=d[(c[a1>>2]|0)+aZ|0]|0;bm=a6}else{bl=0;bm=aZ}c[aT>>2]=bl;a6=((bl|a9<<8)>>>1&255|aY<<8&2147483392)^255;c[a5>>2]=a6;if(aV>>>0<8388609){aW=a0;aO=aV;a9=bl;aZ=bm;aY=a6}else{break L968}}}}while(0);c[a8>>2]=bj;bn=ba-bj|0;bo=a7;bp=aX;break}else{bg=0;bh=a+48|0;bi=a+52|0;G=665;break}}while(0);if((G|0)==665){c[bh>>2]=0;bn=0;bo=bg;bp=bi}c[bp>>2]=bn;bn=a+56|0;bp=a+60|0;if((bo|0)<=0){c[bn>>2]=0;bq=0;c[bp>>2]=bq;return}a=d[bo+5246356|0]|0;bi=b+28|0;bg=c[bi>>2]|0;bh=b+32|0;G=c[bh>>2]|0;bj=bg>>>8;ba=-1;bm=bg;while(1){br=ba+1|0;bs=$(d[5246832+(br+a|0)|0]|0,bj);if(G>>>0<bs>>>0){ba=br;bm=bs}else{break}}ba=G-bs|0;c[bh>>2]=ba;G=bm-bs|0;c[bi>>2]=G;L986:do{if(G>>>0<8388609){bs=b+20|0;bm=b+40|0;bj=b+24|0;a=b|0;bg=c[b+4>>2]|0;bl=c[bs>>2]|0;bk=G;bf=c[bm>>2]|0;be=c[bj>>2]|0;a2=ba;while(1){bd=bl+8|0;c[bs>>2]=bd;bc=bk<<8;c[bi>>2]=bc;if(be>>>0<bg>>>0){bb=be+1|0;c[bj>>2]=bb;bt=d[(c[a>>2]|0)+be|0]|0;bu=bb}else{bt=0;bu=be}c[bm>>2]=bt;bb=((bt|bf<<8)>>>1&255|a2<<8&2147483392)^255;c[bh>>2]=bb;if(bc>>>0<8388609){bl=bd;bk=bc;bf=bt;be=bu;a2=bb}else{break L986}}}}while(0);c[bn>>2]=br;bq=bo-br|0;c[bp>>2]=bq;return}function ce(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=c[a+4600>>2]|0;e=(d<<16>>16)*1e3&-1;if((e|0)==0){f=c[a+4596>>2]|0;g=c[a+4580>>2]|0;h=(((f|0)<(g|0)?f:g)|0)/1e3&-1;return h|0}g=c[a+4580>>2]|0;f=c[a+4588>>2]|0;do{if(!((e|0)>(g|0)|(e|0)>(f|0))){if((e|0)<(c[a+4592>>2]|0)){break}i=a+16|0;j=a+24|0;k=c[j>>2]|0;if((k|0)>255){c[a+28>>2]=0}do{if((c[a+4560>>2]|0)==0){if((c[b+60>>2]|0)==0){h=d}else{break}return h|0}}while(0);l=c[a+4596>>2]|0;if((e|0)>(l|0)){m=a+28|0;if((c[m>>2]|0)==0){c[j>>2]=256;n=i;c[n>>2]=0;c[n+4>>2]=0;o=256}else{o=k}if((c[b+60>>2]|0)!=0){c[m>>2]=0;h=(d|0)==16?12:8;return h|0}if((o|0)<1){c[b+80>>2]=1;n=b+52|0;p=c[n>>2]|0;c[n>>2]=p-((p*5&-1|0)/((c[b+24>>2]|0)+5|0)&-1)|0;h=d;return h|0}else{c[m>>2]=-2;h=d;return h|0}}if((e|0)>=(l|0)){l=a+28|0;if((c[l>>2]|0)>=0){h=d;return h|0}c[l>>2]=1;h=d;return h|0}if((c[b+60>>2]|0)!=0){c[j>>2]=0;l=i;c[l>>2]=0;c[l+4>>2]=0;c[a+28>>2]=1;h=(d|0)==8?12:16;return h|0}l=a+28|0;if((c[l>>2]|0)==0){c[b+80>>2]=1;m=b+52|0;p=c[m>>2]|0;c[m>>2]=p-((p*5&-1|0)/((c[b+24>>2]|0)+5|0)&-1)|0;h=d;return h|0}else{c[l>>2]=1;h=d;return h|0}}}while(0);d=(g|0)<(f|0)?g:f;f=c[a+4592>>2]|0;h=(((d|0)>(f|0)?d:f)|0)/1e3&-1;return h|0}function cf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((a[b+4565|0]|0)!=2){return}d=$(c[b+4600>>2]|0,65536e3);e=cl((d|0)/(c[b+4568>>2]|0)&-1)|0;d=c[b+4724>>2]|0;f=-d<<2;g=d<<16>>16;d=$(f>>16,g);h=($(f&65532,g)>>16)+d|0;d=(e<<16)-183762944>>16;g=$(h>>16,d);f=$(h&65535,d)>>16;d=b+8|0;h=c[d>>2]|0;i=(((e-2048|0)-(h>>8)|0)+g|0)+f|0;if((i|0)<0){j=i*3&-1}else{j=i}if((j|0)>51){k=51}else{k=(j|0)<-51?-51:j<<16>>16}j=$(c[b+4556>>2]<<16>>16,k);k=(((j>>16)*6554&-1)+h|0)+(((j&65535)*6554&-1)>>>16)|0;c[d>>2]=k;if((k|0)>217856){l=217856}else{l=(k|0)<193536?193536:k}c[d>>2]=l;return}function cg(d,f,g,h,j,k,l,m,n,o,p){d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0;q=i;i=i+660|0;r=q|0;s=q+8|0;t=q+12|0;u=q+16|0;w=u|0;x=u;u=i;i=i+640|0;y=i;i=i+640|0;z=i;i=i+640|0;A=i;i=i+640|0;B=f-4|0;C=p+2|0;L1058:do{if((C|0)>0){D=0;while(1){E=D-2|0;F=f+(E<<1)|0;G=b[F>>1]|0;H=b[g+(E<<1)>>1]|0;E=H+G|0;I=G-H|0;b[F>>1]=(E>>>1)+(E&1)&65535;E=(I>>1)+(I&1)|0;if((E|0)>32767){J=32767}else{J=(E|0)<-32768?-32768:E&65535}b[x+(D<<1)>>1]=J;E=D+1|0;if((E|0)==(C|0)){break L1058}else{D=E}}}}while(0);C=d+4|0;J=B;v=e[C>>1]|e[C+2>>1]<<16;b[J>>1]=v&65535;b[J+2>>1]=v>>16;J=d+8|0;D=e[J>>1]|e[J+2>>1]<<16;c[w>>2]=D;w=f+(p-2<<1)|0;v=e[w>>1]|e[w+2>>1]<<16;b[C>>1]=v&65535;b[C+2>>1]=v>>16;C=x+(p<<1)|0;v=e[C>>1]|e[C+2>>1]<<16;b[J>>1]=v&65535;b[J+2>>1]=v>>16;J=(p|0)>0;C=D&65535;w=D>>>16&65535;L1065:do{if(J){D=0;E=b[B>>1]|0;I=b[f-2>>1]|0;while(1){F=b[f+(D<<1)>>1]|0;H=D+1|0;G=(((F<<16>>16)+(E<<16>>16)|0)+(I<<16>>16<<1)>>1)+1>>1;b[u+(D<<1)>>1]=G&65535;b[y+(D<<1)>>1]=(I&65535)-G&65535;if((H|0)==(p|0)){break}else{D=H;E=I;I=F}}if(J){K=0;L=C;M=w}else{break}while(1){I=b[x+(K+2<<1)>>1]|0;E=K+1|0;D=(((I<<16>>16)+(L<<16>>16)|0)+(M<<16>>16<<1)>>1)+1>>1;b[z+(K<<1)>>1]=D&65535;b[A+(K<<1)>>1]=(M&65535)-D&65535;if((E|0)==(p|0)){break L1065}else{K=E;L=M;M=I}}}}while(0);M=(o*10&-1|0)==(p|0);L=m<<16>>16;m=$(L,L);L=M?328:655;K=$(L,m>>>16);w=($(L,m&65535)>>>16)+K|0;K=cA(s,u|0,z|0,d+12|0,p,w)|0;z=r|0;c[z>>2]=K;u=cA(t,y|0,A|0,d+20|0,p,w)|0;A=r+4|0;c[A>>2]=u;r=((c[s>>2]<<16>>16)*3&-1)+(c[t>>2]|0)|0;t=(r|0)<65536?r:65536;r=l-(M?1200:600)|0;M=(r|0)<1?1:r;r=((o<<16>>16)*900&-1)+2e3|0;l=t*3&-1;s=ch(M,l+851968|0,19)|0;c[k>>2]=s;do{if((s|0)<(r|0)){c[k>>2]=r;y=M-r|0;c[k+4>>2]=y;m=l+65536|0;L=r<<16>>16;C=$(m>>16,L);J=ch((y<<1)-r|0,($(m&65535,L)>>16)+C|0,16)|0;if((J|0)>16384){N=16384;break}N=(J|0)<0?0:J}else{c[k+4>>2]=M-s|0;N=16384}}while(0);s=d+28|0;l=b[s>>1]|0;J=N-l|0;N=w<<16>>16;w=$(J>>16,N);b[s>>1]=(w+l|0)+($(J&65535,N)>>>16)&65535;a[j]=0;L1078:do{if((n|0)==0){N=M<<3;do{if((b[d+30>>1]|0)==0){if((N|0)<(r*13&-1|0)){O=b[s>>1]|0}else{J=b[s>>1]|0;l=J<<16>>16;w=$(l,t>>16);if((($(l,t&65535)>>16)+w|0)<819){O=J}else{P=J;break}}J=O<<16>>16;c[z>>2]=$(K<<16>>16,J)>>14;c[A>>2]=$(u<<16>>16,J)>>14;cz(z,h);c[z>>2]=0;c[A>>2]=0;c[k>>2]=M;c[k+4>>2]=0;a[j]=1;Q=0;R=755;break L1078}else{if((N|0)<(r*11&-1|0)){S=b[s>>1]|0}else{J=b[s>>1]|0;w=J<<16>>16;l=$(w,t>>16);if((($(w,t&65535)>>16)+l|0)<328){S=J}else{P=J;break}}J=S<<16>>16;c[z>>2]=$(K<<16>>16,J)>>14;c[A>>2]=$(u<<16>>16,J)>>14;cz(z,h);c[z>>2]=0;c[A>>2]=0;T=0;R=754;break L1078}}while(0);if(P<<16>>16>15565){cz(z,h);T=16384;R=754;break}else{N=P<<16>>16;c[z>>2]=$(K<<16>>16,N)>>14;c[A>>2]=$(u<<16>>16,N)>>14;cz(z,h);T=b[s>>1]|0;R=754;break}}else{c[z>>2]=0;c[A>>2]=0;cz(z,h);T=0;R=754;break}}while(0);do{if((R|0)==754){if((a[j]|0)==1){Q=T;R=755;break}b[d+32>>1]=0;U=T;R=759;break}}while(0);do{if((R|0)==755){T=d+32|0;h=(e[T>>1]|0)+(p-(o<<3)|0)|0;b[T>>1]=h&65535;if((h<<16>>16|0)<(o*5&-1|0)){a[j]=0;V=Q;R=760;break}else{b[T>>1]=1e4;U=Q;R=759;break}}}while(0);do{if((R|0)==759){if((a[j]|0)==0){V=U;R=760;break}else{W=U;break}}}while(0);do{if((R|0)==760){U=k+4|0;if((c[U>>2]|0)>=1){W=V;break}c[U>>2]=1;U=M-1|0;c[k>>2]=(U|0)<1?1:U;W=V}}while(0);V=d|0;k=b[V>>1]|0;M=d+2|0;R=b[M>>1]|0;U=d+30|0;d=b[U>>1]|0;j=o<<3;Q=c[z>>2]|0;z=(65536/(j|0)&-1)<<16>>16;T=($(Q-k<<16>>16,z)>>15)+1>>1;h=c[A>>2]|0;A=($(h-R<<16>>16,z)>>15)+1>>1;s=W-d|0;u=$(s>>16,z);K=($(s&65535,z)>>16)+u<<10;L1110:do{if((j|0)>0){u=o<<3;z=-k|0;s=-R|0;P=d<<10;S=0;while(1){t=z-T|0;r=s-A|0;O=P+K|0;n=S+1|0;N=S-1|0;J=b[f+(N<<1)>>1]|0;l=((b[f+(S<<1)>>1]|0)+(b[f+(S-2<<1)>>1]|0)|0)+(J<<1)|0;w=b[x+(n<<1)>>1]|0;C=$(w,O>>16);L=$(w,O&64512)>>16;w=t<<16>>16;m=$(l>>7,w);y=$(l<<9&65024,w)>>16;w=r<<16>>16;l=$(J>>5,w);B=(((((l+C|0)+L|0)+m|0)+($(J<<11&63488,w)>>16)|0)+y>>7)+1>>1;if((B|0)>32767){X=32767}else{X=(B|0)<-32768?-32768:B&65535}b[g+(N<<1)>>1]=X;if((n|0)==(u|0)){break L1110}else{z=t;s=r;P=O;S=n}}}}while(0);if((j|0)>=(p|0)){Y=Q&65535;b[V>>1]=Y;Z=h&65535;b[M>>1]=Z;_=W&65535;b[U>>1]=_;i=q;return}X=W>>6;K=W<<10&64512;A=-Q<<16>>16;T=-h<<16>>16;d=j;while(1){j=d+1|0;R=d-1|0;k=b[f+(R<<1)>>1]|0;o=((b[f+(d<<1)>>1]|0)+(b[f+(d-2<<1)>>1]|0)|0)+(k<<1)|0;S=b[x+(j<<1)>>1]|0;P=$(S,X);s=$(S,K)>>16;S=$(o>>7,A);z=$(o<<9&65024,A)>>16;o=$(k>>5,T);u=(((((o+P|0)+s|0)+S|0)+($(k<<11&63488,T)>>16)|0)+z>>7)+1>>1;if((u|0)>32767){aa=32767}else{aa=(u|0)<-32768?-32768:u&65535}b[g+(R<<1)>>1]=aa;if((j|0)==(p|0)){break}else{d=j}}Y=Q&65535;b[V>>1]=Y;Z=h&65535;b[M>>1]=Z;_=W&65535;b[U>>1]=_;i=q;return}function ch(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=ci((a|0)>0?a:-a|0)|0;e=a<<d-1;a=ci((b|0)>0?b:-b|0)|0;f=b<<a-1;b=(536870911/(f>>16|0)&-1)<<16>>16;g=$(b,e>>16);h=($(b,e&65535)>>16)+g|0;dT(h,(h|0)<0?-1:0,f,(f|0)<0?-1:0);f=D;g=e-(f<<3|0>>>29)|0;f=$(g>>16,b);e=(f+h|0)+($(g&65535,b)>>16)|0;b=((28-c|0)+d|0)+(1-a|0)|0;if((b|0)>=0){return((b|0)<32?e>>b:0)|0}a=-b|0;b=-2147483648>>a;d=2147483647>>>(a>>>0);if((b|0)>(d|0)){if((e|0)>(b|0)){i=b;j=i<<a;return j|0}i=(e|0)<(d|0)?d:e;j=i<<a;return j|0}else{if((e|0)>(d|0)){i=d;j=i<<a;return j|0}i=(e|0)<(b|0)?b:e;j=i<<a;return j|0}return 0}function ci(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0;if(a>>>0<=65535){b=a<<16>>16;do{if((a&65535)<<16>>16==0){c=16}else{do{if((b&65280|0)==0){d=(b&65520|0)==0;e=d?12:8;f=d?a:b>>>4}else{if((b&61440|0)==0){e=4;f=b>>>8;break}else{e=0;f=b>>>12;break}}}while(0);d=f<<16>>16;if((d&12|0)!=0){c=(d>>>3&1|e)^1;break}if((d&14|0)==0){c=e|3;break}else{c=e|2;break}}}while(0);g=c+16|0;return g|0}c=a>>>16;a=c<<16>>16;if((c|0)==0){g=16;return g|0}do{if((a&65280|0)==0){e=(a&65520|0)==0;h=e?12:8;i=e?c:a>>>4}else{if((a&61440|0)==0){h=4;i=a>>>8;break}else{h=0;i=a>>>12;break}}}while(0);a=i<<16>>16;if((a&12|0)!=0){g=(a>>>3&1|h)^1;return g|0}if((a&14|0)==0){g=h|3;return g|0}else{g=h|2;return g|0}return 0}function cj(a,d,f,g,h,i){a=a|0;d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;j=a+4|0;k=d;v=e[j>>1]|e[j+2>>1]<<16;b[k>>1]=v&65535;b[k+2>>1]=v>>16;k=a+8|0;l=f;v=e[k>>1]|e[k+2>>1]<<16;b[l>>1]=v&65535;b[l+2>>1]=v>>16;l=d+(i<<1)|0;v=e[l>>1]|e[l+2>>1]<<16;b[j>>1]=v&65535;b[j+2>>1]=v>>16;j=f+(i<<1)|0;v=e[j>>1]|e[j+2>>1]<<16;b[k>>1]=v&65535;b[k+2>>1]=v>>16;k=a|0;j=b[k>>1]|0;l=a+2|0;a=b[l>>1]|0;m=h<<3;n=(65536/(m|0)&-1)<<16>>16;o=($((c[g>>2]|0)-j<<16>>16,n)>>15)+1>>1;p=g+4|0;q=($((c[p>>2]|0)-a<<16>>16,n)>>15)+1>>1;L1183:do{if((m|0)>0){n=h<<3;r=0;s=j;t=a;while(1){u=s+o|0;w=t+q|0;x=r+1|0;y=b[d+(x<<1)>>1]|0;z=((b[d+(r+2<<1)>>1]|0)+(b[d+(r<<1)>>1]|0)|0)+(y<<1)|0;A=f+(x<<1)|0;B=(b[A>>1]|0)<<8;C=u<<16>>16;D=$(z>>7,C);E=$(z<<9&65024,C)>>16;C=w<<16>>16;z=$(y>>5,C);F=((((z+B|0)+D|0)+($(y<<11&63488,C)>>16)|0)+E>>7)+1>>1;if((F|0)>32767){G=32767}else{G=(F|0)<-32768?-32768:F&65535}b[A>>1]=G;if((x|0)==(n|0)){break L1183}else{r=x;s=u;t=w}}}}while(0);L1191:do{if((m|0)<(i|0)){G=c[g>>2]<<16>>16;q=c[p>>2]<<16>>16;o=m;while(1){a=o+1|0;j=b[d+(a<<1)>>1]|0;h=((b[d+(o+2<<1)>>1]|0)+(b[d+(o<<1)>>1]|0)|0)+(j<<1)|0;t=f+(a<<1)|0;s=(b[t>>1]|0)<<8;r=$(h>>7,G);n=$(h<<9&65024,G)>>16;h=$(j>>5,q);w=((((h+s|0)+r|0)+($(j<<11&63488,q)>>16)|0)+n>>7)+1>>1;if((w|0)>32767){H=32767}else{H=(w|0)<-32768?-32768:w&65535}b[t>>1]=H;if((a|0)==(i|0)){break L1191}else{o=a}}}}while(0);b[k>>1]=c[g>>2]&65535;b[l>>1]=c[p>>2]&65535;if((i|0)>0){I=0}else{return}while(1){p=I+1|0;l=d+(p<<1)|0;g=b[l>>1]|0;k=f+(p<<1)|0;H=b[k>>1]|0;m=H+g|0;o=g-H|0;if((m|0)>32767){J=32767}else{J=(m|0)<-32768?-32768:m&65535}b[l>>1]=J;if((o|0)>32767){K=32767}else{K=(o|0)<-32768?-32768:o&65535}b[k>>1]=K;if((p|0)==(i|0)){break}else{I=p}}return}function ck(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;i=b|0;c[b+6100>>2]=c[d+44>>2]|0;c[b+4704>>2]=c[d+48>>2]|0;j=c[d+8>>2]|0;c[b+4580>>2]=j;c[b+4588>>2]=c[d+12>>2]|0;c[b+4592>>2]=c[d+16>>2]|0;c[b+4596>>2]=c[d+20>>2]|0;k=b+6112|0;c[k>>2]=c[d+40>>2]|0;c[b+5776>>2]=c[d>>2]|0;c[b+5780>>2]=c[d+4>>2]|0;c[b+4560>>2]=f;c[b+5784>>2]=g;g=b+4696|0;do{if((c[g>>2]|0)!=0){if((c[b+4708>>2]|0)!=0){break}if((j|0)==(c[b+4584>>2]|0)){l=0;return l|0}f=c[b+4600>>2]|0;if((f|0)<=0){l=0;return l|0}l=cn(b,f)|0;return l|0}}while(0);j=(h|0)==0?ce(i,d)|0:h;h=cn(b,j)|0;i=c[d+24>>2]|0;f=b+4636|0;if((c[f>>2]|0)==(i|0)){m=b+4600|0;n=0;o=c[m>>2]|0;p=m}else{if((i|0)==60|(i|0)==40|(i|0)==20|(i|0)==10){q=0}else{q=-103}do{if((i|0)<11){c[b+5768>>2]=1;c[b+4604>>2]=(i|0)==10?2:1;m=j<<16>>16;c[b+4608>>2]=$(i<<16>>16,m);c[b+4572>>2]=m*14&-1;m=c[b+4600>>2]|0;r=b+4716|0;if((m|0)==8){c[r>>2]=5247580;s=8;break}else{c[r>>2]=5247568;s=m;break}}else{c[b+5768>>2]=(i|0)/20&-1;c[b+4604>>2]=4;m=j<<16>>16;c[b+4608>>2]=m*20&-1;c[b+4572>>2]=m*24&-1;m=c[b+4600>>2]|0;r=b+4716|0;if((m|0)==8){c[r>>2]=5247556;s=8;break}else{c[r>>2]=5247520;s=m;break}}}while(0);c[f>>2]=i;c[b+4632>>2]=0;n=q;o=s;p=b+4600|0}do{if((o|0)!=(j|0)){s=b+7192|0;q=b+16|0;c[q>>2]=0;c[q+4>>2]=0;c[b+5764>>2]=0;c[b+5772>>2]=0;c[b+4632>>2]=0;dF(b+144|0,0,4412);dF(s|0,0,2152);c[b+4568>>2]=100;c[b+4692>>2]=1;c[b+9344>>2]=100;a[s]=10;c[b+4500>>2]=100;c[b+4516>>2]=65536;a[b+4565|0]=0;c[p>>2]=j;s=c[b+4604>>2]|0;q=(s|0)==4;i=b+4716|0;do{if((j|0)==8){if(q){c[i>>2]=5247556;t=861;break}else{c[i>>2]=5247580;t=862;break}}else{if(q){c[i>>2]=5247520;t=861;break}else{c[i>>2]=5247568;t=861;break}}}while(0);do{if((t|0)==861){if((j|0)==8|(j|0)==12){t=862;break}c[b+4664>>2]=16;c[b+4720>>2]=5248152;break}}while(0);if((t|0)==862){c[b+4664>>2]=10;c[b+4720>>2]=5248188}c[b+4612>>2]=j*5&-1;c[b+4608>>2]=$(s<<16>>16,(j*327680&-1)>>16);i=j<<16;f=i>>16;c[b+4616>>2]=f*20&-1;c[b+4620>>2]=i>>15;c[b+4576>>2]=f*18&-1;if(q){c[b+4572>>2]=f*24&-1}else{c[b+4572>>2]=f*14&-1}if((j|0)==16){c[b+4684>>2]=10;c[b+4712>>2]=5246208;break}f=b+4684|0;if((j|0)==12){c[f>>2]=13;c[b+4712>>2]=5246216;break}else{c[f>>2]=15;c[b+4712>>2]=5246232;break}}}while(0);j=c[d+36>>2]|0;do{if((j|0)<2){c[b+4668>>2]=0;c[b+4676>>2]=52429;c[b+4672>>2]=6;c[b+4660>>2]=8;t=c[b+4600>>2]|0;p=t*3&-1;c[b+4624>>2]=p;c[b+4652>>2]=1;c[b+4656>>2]=0;c[b+4680>>2]=1;c[b+4688>>2]=2;c[b+4700>>2]=0;u=6;v=t;w=p}else{if((j|0)<4){c[b+4668>>2]=1;c[b+4676>>2]=49807;c[b+4672>>2]=8;c[b+4660>>2]=10;p=c[b+4600>>2]|0;t=p*5&-1;c[b+4624>>2]=t;c[b+4652>>2]=1;c[b+4656>>2]=0;c[b+4680>>2]=0;c[b+4688>>2]=4;c[b+4700>>2]=0;u=8;v=p;w=t;break}if((j|0)<6){c[b+4668>>2]=1;c[b+4676>>2]=48497;c[b+4672>>2]=10;c[b+4660>>2]=12;t=c[b+4600>>2]|0;p=t*5&-1;c[b+4624>>2]=p;c[b+4652>>2]=2;c[b+4656>>2]=1;c[b+4680>>2]=0;c[b+4688>>2]=8;c[b+4700>>2]=t*983&-1;u=10;v=t;w=p;break}p=b+4668|0;if((j|0)<8){c[p>>2]=1;c[b+4676>>2]=47186;c[b+4672>>2]=12;c[b+4660>>2]=14;t=c[b+4600>>2]|0;o=t*5&-1;c[b+4624>>2]=o;c[b+4652>>2]=3;c[b+4656>>2]=1;c[b+4680>>2]=0;c[b+4688>>2]=16;c[b+4700>>2]=t*983&-1;u=12;v=t;w=o;break}else{c[p>>2]=2;c[b+4676>>2]=45875;c[b+4672>>2]=16;c[b+4660>>2]=16;p=c[b+4600>>2]|0;o=p*5&-1;c[b+4624>>2]=o;c[b+4652>>2]=4;c[b+4656>>2]=1;c[b+4680>>2]=0;c[b+4688>>2]=32;c[b+4700>>2]=p*983&-1;u=16;v=p;w=o;break}}}while(0);o=c[b+4664>>2]|0;c[b+4672>>2]=(u|0)<(o|0)?u:o;c[b+4628>>2]=(v*5&-1)+(w<<1)|0;c[b+4648>>2]=j;j=c[d+32>>2]|0;c[b+4640>>2]=j;d=b+6116|0;c[d>>2]=0;do{if((c[k>>2]|0)!=0&(j|0)>0){if((v|0)==12){x=14e3}else if((v|0)==8){x=12e3}else{x=16e3}w=$(x,(j|0)<25?125-j|0:100);if(((((w&65520)*655&-1)>>>16)+((w>>16)*655&-1)|0)>=(e|0)){break}c[d>>2]=1;w=(((j>>16)*-26214&-1)+7|0)-(((j&65535)*26214&-1)>>>16)|0;c[b+6120>>2]=(w|0)>2?w:2}}while(0);c[g>>2]=1;l=n+h|0;return l|0}function cl(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;do{if(a>>>0>65535){b=a>>>16;c=b<<16>>16;if((b|0)==0){d=8;e=16;f=920;break}do{if((c&65280|0)==0){g=(c&65520|0)==0;h=g?12:8;i=g?b:c>>>4}else{if((c&61440|0)==0){h=4;i=c>>>8;break}else{h=0;i=c>>>12;break}}}while(0);c=i<<16>>16;if((c&12|0)!=0){j=(c>>>3&1|h)^1;f=917;break}if((c&14|0)==0){j=h|3;f=917;break}else{j=h|2;f=917;break}}else{c=a<<16>>16;do{if((a&65535)<<16>>16==0){k=16}else{do{if((c&65280|0)==0){b=(c&65520|0)==0;l=b?12:8;m=b?a:c>>>4}else{if((c&61440|0)==0){l=4;m=c>>>8;break}else{l=0;m=c>>>12;break}}}while(0);b=m<<16>>16;if((b&12|0)!=0){k=(b>>>3&1|l)^1;break}if((b&14|0)==0){k=l|3;break}else{k=l|2;break}}}while(0);j=k+16|0;f=917;break}}while(0);do{if((f|0)==917){k=24-j|0;if((j|0)==24){n=a;o=24;break}if((k|0)>=0){d=k;e=j;f=920;break}n=a>>>((k+32|0)>>>0)|a<<-k;o=j;break}}while(0);if((f|0)==920){n=a<<32-d|a>>>(d>>>0);o=e}e=n&127;return(31-o<<7|e)+($(e*179&-1,128-e|0)>>>16)|0}function cm(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;e=i;i=i+128|0;f=e|0;g=d&1;do{if((d|0)>0){h=0;j=0;while(1){k=b[a+(h<<1)>>1]|0;l=k+j|0;c[f+(g<<6)+(h<<2)>>2]=k<<12;k=h+1|0;if((k|0)==(d|0)){break}else{h=k;j=l}}if((l|0)>4095){m=0}else{break}i=e;return m|0}}while(0);l=d-1|0;L1337:do{if((l|0)>0){d=0;a=1073741824;j=g;h=l;while(1){k=c[f+(j<<6)+(h<<2)>>2]|0;if((k+16773022|0)>>>0>33546044){m=0;break}n=-(k<<7)|0;k=n;o=(n|0)<0?-1:0;dT(k,o,k,o);n=1073741824-D|0;p=(n|0)>0?n:-n|0;do{if(p>>>0>65535){q=p>>>16;r=q<<16>>16;if((q|0)==0){s=16;break}do{if((r&65280|0)==0){t=(r&65520|0)==0;u=t?12:8;v=t?q:r>>>4}else{if((r&61440|0)==0){u=4;v=r>>>8;break}else{u=0;v=r>>>12;break}}}while(0);r=v<<16>>16;if((r&12|0)!=0){s=(r>>>3&1|u)^1;break}if((r&14|0)==0){s=u|3;break}else{s=u|2;break}}else{r=p<<16>>16;do{if((p&65535)<<16>>16==0){w=16}else{do{if((r&65280|0)==0){q=(r&65520|0)==0;x=q?12:8;y=q?p:r>>>4}else{if((r&61440|0)==0){x=4;y=r>>>8;break}else{x=0;y=r>>>12;break}}}while(0);q=y<<16>>16;if((q&12|0)!=0){w=(q>>>3&1|x)^1;break}if((q&14|0)==0){w=x|3;break}else{w=x|2;break}}}while(0);s=w+16|0}}while(0);p=32-s|0;r=n<<s-1;q=r>>16;t=536870911/(q|0)&-1;z=t<<16;A=z>>16;B=$(q,A);q=(536870912-B|0)-($(r&65535,A)>>16)<<3;r=$(q>>16,A);B=$(q&65528,A)>>16;A=(($(q,(t>>15)+1>>1)+z|0)+r|0)+B|0;B=(-30-p|0)+(62-s|0)|0;if((B|0)<1){r=-B|0;z=-2147483648>>r;t=2147483647>>>(r>>>0);do{if((z|0)>(t|0)){if((A|0)>(z|0)){C=z;break}C=(A|0)<(t|0)?t:A}else{if((A|0)>(t|0)){C=t;break}C=(A|0)<(z|0)?z:A}}while(0);E=C<<r}else{E=(B|0)<32?A>>B:0}dT(n,(n|0)<0?-1:0,a,d);z=D;t=h&1;q=h-1|0;F=(p|0)==1;G=E;H=(E|0)<0?-1:0;I=p-1|0;J=0;while(1){K=c[f+(j<<6)+(J<<2)>>2]|0;L=c[f+(j<<6)+(q-J<<2)>>2]|0;M=dT(L,(L|0)<0?-1:0,k,o)|0;L=D;N=dK(M>>>30|L<<2,L>>>30|0<<2,1,0)|0;L=D;M=K-(N>>>1|L<<31)|0;L=dT(M,(M|0)<0?-1:0,G,H)|0;M=D;if(F){N=dK(L>>>1|M<<31,M>>>1|0<<31,L&1,M&0)|0;O=N}else{N=dO(L|0,M|0,I|0)|0;M=D;L=dK(N,M,1,0)|0;M=D;O=L>>>1|M<<31}c[f+(t<<6)+(J<<2)>>2]=O;M=J+1|0;if((M|0)==(h|0)){break}else{J=M}}J=z<<2|0>>>30;I=J;F=(J|0)<0?-1:0;if((q|0)>0){d=F;a=I;j=t;h=q}else{P=F;Q=I;R=t;break L1337}}i=e;return m|0}else{P=0;Q=1073741824;R=g}}while(0);g=c[f+(R<<6)>>2]|0;if((g+16773022|0)>>>0>33546044){m=0;i=e;return m|0}R=-(g<<7)|0;g=R;f=(R|0)<0?-1:0;dT(g,f,g,f);f=1073741824-D|0;dT(f,(f|0)<0?-1:0,Q,P);P=D;m=P<<2|0>>>30;i=e;return m|0}function cn(a,d){a=a|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+6060|0;f=e|0;h=e+4320|0;j=e+4620|0;k=a+4600|0;l=c[k>>2]|0;do{if((l|0)==(d|0)){if((c[a+4584>>2]|0)==(c[a+4580>>2]|0)){m=0;break}else{n=974;break}}else{n=974}}while(0);L1401:do{if((n|0)==974){if((l|0)==0){m=cs(a+5800|0,c[a+4580>>2]|0,d*1e3&-1,1)|0;break}o=(c[a+4608>>2]<<1)+(l*5&-1)|0;p=j|0;if((o|0)>0){q=o;while(1){r=q-1|0;s=a+9348+(r<<2)|0;do{if((aq(+(+g[s>>2]))|0)>32767){t=32767}else{if((aq(+(+g[s>>2]))|0)<-32768){t=-32768;break}t=aq(+(+g[s>>2]))&65535}}while(0);b[j+(r<<1)>>1]=t;if((r|0)>0){q=r}else{break}}u=c[k>>2]|0}else{u=l}q=a+4580|0;s=cs(h,(u<<16>>16)*1e3&-1,c[q>>2]|0,0)|0;v=f|0;ct(h,v,p,o);w=c[q>>2]|0;q=$(w,o);x=(q|0)/((c[k>>2]<<16>>16)*1e3&-1|0)&-1;q=a+5800|0;y=cs(q,w,(d<<16>>16)*1e3&-1,1)|0;ct(q,p,v,x);x=y+s|0;s=d*45&-1;if((s|0)>0){z=s}else{m=x;break}while(1){s=z-1|0;g[a+9348+(s<<2)>>2]=+(b[j+(s<<1)>>1]|0|0);if((s|0)>0){z=s}else{m=x;break L1401}}}}while(0);c[a+4584>>2]=c[a+4580>>2]|0;i=e;return m|0}function co(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((f|0)>=(e|0)){g=a;h=f<<1;dF(g|0,0,h|0);return}i=d+2|0;j=d+4|0;k=d+6|0;l=d+8|0;m=d+10|0;n=(f|0)>6;o=f;while(1){p=o-1|0;q=$(b[d>>1]|0,b[c+(p<<1)>>1]|0);r=$(b[i>>1]|0,b[c+(o-2<<1)>>1]|0)+q|0;q=r+$(b[j>>1]|0,b[c+(o-3<<1)>>1]|0)|0;r=q+$(b[k>>1]|0,b[c+(o-4<<1)>>1]|0)|0;q=r+$(b[l>>1]|0,b[c+(o-5<<1)>>1]|0)|0;r=q+$(b[m>>1]|0,b[c+(o-6<<1)>>1]|0)|0;L1424:do{if(n){q=r;s=6;while(1){t=$(b[d+(s<<1)>>1]|0,b[c+(p-s<<1)>>1]|0)+q|0;u=t+$(b[d+((s|1)<<1)>>1]|0,b[c+(p+(s^-1)<<1)>>1]|0)|0;t=s+2|0;if((t|0)<(f|0)){q=u;s=t}else{v=u;break L1424}}}else{v=r}}while(0);r=(((b[c+(o<<1)>>1]|0)<<12)-v>>11)+1>>1;if((r|0)>32767){w=32767}else{w=(r|0)<-32768?-32768:r&65535}b[a+(o<<1)>>1]=w;r=o+1|0;if((r|0)==(e|0)){break}else{o=r}}g=a;h=f<<1;dF(g|0,0,h|0);return}function cp(a,c,d){a=a|0;c=c|0;d=d|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;f=d-1|0;g=(f|0)<1;h=c+(d<<1)|0;i=1;while(1){j=b[a>>1]|0;k=b[c>>1]|0;l=(j<<16>>16)-(k<<16>>16)|0;L1435:do{if(g){m=0;n=l}else{o=0;p=1;q=l;r=j;while(1){s=b[a+(p<<1)>>1]|0;t=((s<<16>>16)-(r<<16>>16)|0)-(b[c+(p<<1)>>1]|0)|0;u=(t|0)<(q|0);v=u?p:o;w=u?t:q;t=p+1|0;if((t|0)==(d|0)){m=v;n=w;break L1435}else{o=v;p=t;q=w;r=s}}}}while(0);x=a+(f<<1)|0;j=b[h>>1]|0;l=(32768-(b[x>>1]|0)|0)-(j<<16>>16)|0;r=(l|0)<(n|0);q=r?d:m;if(((r?l:n)|0)>-1){y=1031;break}do{if((q|0)==0){b[a>>1]=k}else{if((q|0)==(d|0)){b[x>>1]=-32768-j&65535;break}L1445:do{if((q|0)>0){l=1;r=0;p=k;while(1){o=(p<<16>>16)+r|0;if((l|0)==(q|0)){z=o;break L1445}s=b[c+(l<<1)>>1]|0;l=l+1|0;r=o;p=s}}else{z=0}}while(0);p=c+(q<<1)|0;r=b[p>>1]|0;l=r>>1;s=l+z|0;L1450:do{if((q|0)<(d|0)){o=d;w=32768;t=j;while(1){v=w-(t<<16>>16)|0;u=o-1|0;if((u|0)<=(q|0)){A=v;break L1450}o=u;w=v;t=b[c+(u<<1)>>1]|0}}else{A=32768}}while(0);t=A-l|0;w=a+(q-1<<1)|0;o=a+(q<<1)|0;u=(b[o>>1]|0)+(b[w>>1]|0)|0;v=(u>>1)+(u&1)|0;do{if((s|0)>(t|0)){if((v|0)>(s|0)){B=s;break}B=(v|0)<(t|0)?t:v}else{if((v|0)>(t|0)){B=t;break}B=(v|0)<(s|0)?s:v}}while(0);v=B-(r>>>1)|0;b[w>>1]=v&65535;b[o>>1]=v+(e[p>>1]|0)&65535}}while(0);if((i|0)>=20){break}i=i+1|0}if((y|0)==1031){return}if((i|0)!=20){return}i=(d|0)>1;L1470:do{if(i){y=1;while(1){B=b[a+(y<<1)>>1]|0;A=y;while(1){z=A-1|0;n=b[a+(z<<1)>>1]|0;if(B<<16>>16>=n<<16>>16){C=A;break}b[a+(A<<1)>>1]=n;if((z|0)>0){A=z}else{C=z;break}}b[a+(C<<1)>>1]=B;A=y+1|0;if((A|0)==(d|0)){break}else{y=A}}y=b[a>>1]|0;A=b[c>>1]|0;p=y<<16>>16>A<<16>>16?y:A;b[a>>1]=p;if(i){D=1;E=p}else{break}while(1){p=a+(D<<1)|0;A=b[p>>1]|0;y=(b[c+(D<<1)>>1]|0)+(E<<16>>16)|0;o=((A|0)>(y|0)?A:y)&65535;b[p>>1]=o;p=D+1|0;if((p|0)==(d|0)){break L1470}else{D=p;E=o}}}else{o=b[a>>1]|0;p=b[c>>1]|0;b[a>>1]=o<<16>>16>p<<16>>16?o:p}}while(0);E=b[x>>1]|0;D=32768-(b[h>>1]|0)|0;h=(E|0)<(D|0)?E:D;b[x>>1]=h&65535;x=d-2|0;if((x|0)>-1){F=x;G=h}else{return}while(1){h=a+(F<<1)|0;x=b[h>>1]|0;d=(G<<16>>16)-(b[c+(F+1<<1)>>1]|0)|0;D=(x|0)<(d|0)?x:d;b[h>>1]=D&65535;if((F|0)>0){F=F-1|0;G=D}else{break}}return}function cq(a,c,d){a=a|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=b[c>>1]|0;f=(b[c+2>>1]|0)-e|0;g=131072/(((f|0)>1?f:1)|0)&-1;f=g+(131072/(((e|0)>1?e:1)|0)&-1)|0;b[a>>1]=(f|0)<32767?f&65535:32767;f=d-1|0;L1488:do{if((f|0)>1){d=1;e=g;while(1){h=d+1|0;i=c+(h<<1)|0;j=(b[i>>1]|0)-(b[c+(d<<1)>>1]|0)|0;k=131072/(((j|0)>1?j:1)|0)&-1;j=k+e|0;b[a+(d<<1)>>1]=(j|0)<32767?j&65535:32767;j=d+2|0;l=(b[c+(j<<1)>>1]|0)-(b[i>>1]|0)|0;i=131072/(((l|0)>1?l:1)|0)&-1;l=i+k|0;b[a+(h<<1)>>1]=(l|0)<32767?l&65535:32767;if((j|0)<(f|0)){d=j;e=i}else{m=i;break L1488}}}else{m=g}}while(0);g=32768-(b[c+(f<<1)>>1]|0)|0;c=(131072/(((g|0)>1?g:1)|0)&-1)+m|0;b[a+(f<<1)>>1]=(c|0)<32767?c&65535:32767;return}function cr(a,e,f){a=a|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0;g=i;i=i+200|0;h=g|0;j=g+64|0;k=g+100|0;l=g+136|0;m=(f|0)==16?5249888:5249904;n=(f|0)>0;if(n){o=0;while(1){p=b[e+(o<<1)>>1]|0;q=p>>8;r=b[5250292+(q<<1)>>1]|0;s=($((b[5250292+(q+1<<1)>>1]|0)-r|0,p-(q<<8)|0)+(r<<8)>>3)+1>>1;c[h+((d[m+o|0]|0)<<2)>>2]=s;s=o+1|0;if((s|0)==(f|0)){break}else{o=s}}t=c[h>>2]|0}else{t=0}o=f>>1;m=j|0;c[m>>2]=65536;e=-t|0;t=j+4|0;c[t>>2]=e;s=(o|0)>1;L1498:do{if(s){r=1;q=65536;p=e;while(1){u=c[h+(r<<1<<2)>>2]|0;v=u;w=(u|0)<0?-1:0;x=j+(r<<2)|0;y=dT(v,w,p,(p|0)<0?-1:0)|0;z=D;A=dK(y>>>15|z<<17,z>>>15|0<<17,1,0)|0;z=D;y=r+1|0;B=j+(y<<2)|0;c[B>>2]=(q<<1)-(A>>>1|z<<31)|0;L1501:do{if((r|0)>1){z=r;A=q;C=p;while(1){E=c[j+(z-2<<2)>>2]|0;F=z-1|0;G=dT(A,(A|0)<0?-1:0,v,w)|0;H=D;I=dK(G>>>15|H<<17,H>>>15|0<<17,1,0)|0;H=D;c[j+(z<<2)>>2]=(E+C|0)-(I>>>1|H<<31)|0;if((F|0)<=1){break L1501}z=F;A=E;C=c[j+(F<<2)>>2]|0}}}while(0);c[t>>2]=(c[t>>2]|0)-u|0;if((y|0)==(o|0)){break L1498}r=y;q=c[x>>2]|0;p=c[B>>2]|0}}}while(0);t=k|0;c[t>>2]=65536;e=-(c[h+4>>2]|0)|0;p=k+4|0;c[p>>2]=e;L1508:do{if(s){q=1;r=65536;w=e;while(1){v=c[h+((q<<1|1)<<2)>>2]|0;C=v;A=(v|0)<0?-1:0;z=k+(q<<2)|0;F=dT(C,A,w,(w|0)<0?-1:0)|0;E=D;H=dK(F>>>15|E<<17,E>>>15|0<<17,1,0)|0;E=D;F=q+1|0;I=k+(F<<2)|0;c[I>>2]=(r<<1)-(H>>>1|E<<31)|0;L1511:do{if((q|0)>1){E=q;H=r;G=w;while(1){J=c[k+(E-2<<2)>>2]|0;K=E-1|0;L=dT(H,(H|0)<0?-1:0,C,A)|0;M=D;N=dK(L>>>15|M<<17,M>>>15|0<<17,1,0)|0;M=D;c[k+(E<<2)>>2]=(J+G|0)-(N>>>1|M<<31)|0;if((K|0)<=1){break L1511}E=K;H=J;G=c[k+(K<<2)>>2]|0}}}while(0);c[p>>2]=(c[p>>2]|0)-v|0;if((F|0)==(o|0)){break L1508}q=F;r=c[z>>2]|0;w=c[I>>2]|0}}}while(0);p=f-1|0;L1518:do{if((o|0)>0){h=0;e=c[m>>2]|0;s=c[t>>2]|0;while(1){w=h+1|0;r=c[j+(w<<2)>>2]|0;q=e+r|0;A=c[k+(w<<2)>>2]|0;C=A-s|0;c[l+(h<<2)>>2]=-(C+q|0)|0;c[l+(p-h<<2)>>2]=C-q|0;if((w|0)==(o|0)){break L1518}else{h=w;e=r;s=A}}}}while(0);o=(p|0)>0;k=l+(p<<2)|0;j=0;t=0;while(1){if(n){O=0;P=t;Q=0}else{R=j;break}while(1){m=c[l+(Q<<2)>>2]|0;s=(m|0)>0?m:-m|0;m=(s|0)>(O|0);S=m?s:O;T=m?Q:P;m=Q+1|0;if((m|0)==(f|0)){break}else{O=S;P=T;Q=m}}m=(S>>4)+1>>1;if((m|0)<=32767){R=j;break}s=(m|0)<163838?m:163838;m=65470-(((s<<14)-536854528|0)/($(s,T+1|0)>>2|0)&-1)|0;s=m-65536|0;e=m>>16;L1529:do{if(o){h=0;A=m;r=e;while(1){w=l+(h<<2)|0;q=c[w>>2]|0;C=q<<16>>16;B=$(C,r);x=($(C,A&65535)>>16)+B|0;c[w>>2]=x+$((q>>15)+1>>1,A)|0;q=(($(A,s)>>15)+1>>1)+A|0;x=h+1|0;w=q>>16;if((x|0)==(p|0)){U=q;V=w;break L1529}else{h=x;A=q;r=w}}}else{U=m;V=e}}while(0);e=c[k>>2]|0;m=e<<16>>16;s=$(m,V);r=($(m,U&65535)>>16)+s|0;c[k>>2]=r+$((e>>15)+1>>1,U)|0;e=j+1|0;if((e|0)<10){j=e;t=T}else{R=e;break}}L1534:do{if((R|0)==10){if(n){W=0}else{X=0;break}while(1){T=l+(W<<2)|0;t=(c[T>>2]>>4)+1>>1;if((t|0)>32767){Y=32767}else{Y=(t|0)<-32768?-32768:t&65535}b[a+(W<<1)>>1]=Y;c[T>>2]=Y<<16>>16<<5;T=W+1|0;if((T|0)==(f|0)){X=0;break L1534}else{W=T}}}else{if(n){Z=0}else{X=0;break}while(1){b[a+(Z<<1)>>1]=(((c[l+(Z<<2)>>2]|0)>>>4)+1|0)>>>1&65535;T=Z+1|0;if((T|0)==(f|0)){X=0;break L1534}else{Z=T}}}}while(0);while(1){if((cm(a,f)|0)>=107374){_=1075;break}Z=65536-(2<<X)|0;W=Z-65536|0;Y=Z>>16;L1547:do{if(o){R=0;T=Z;t=Y;while(1){j=l+(R<<2)|0;U=c[j>>2]|0;V=U<<16>>16;S=$(V,t);Q=($(V,T&65535)>>16)+S|0;c[j>>2]=Q+$((U>>15)+1>>1,T)|0;U=(($(T,W)>>15)+1>>1)+T|0;Q=R+1|0;j=U>>16;if((Q|0)==(p|0)){aa=U;ab=j;break L1547}else{R=Q;T=U;t=j}}}else{aa=Z;ab=Y}}while(0);Y=c[k>>2]|0;Z=Y<<16>>16;W=$(Z,ab);t=($(Z,aa&65535)>>16)+W|0;c[k>>2]=t+$((Y>>15)+1>>1,aa)|0;L1551:do{if(n){Y=0;while(1){b[a+(Y<<1)>>1]=(((c[l+(Y<<2)>>2]|0)>>>4)+1|0)>>>1&65535;t=Y+1|0;if((t|0)==(f|0)){break L1551}else{Y=t}}}}while(0);Y=X+1|0;if((Y|0)<16){X=Y}else{_=1076;break}}if((_|0)==1075){i=g;return}else if((_|0)==1076){i=g;return}}function cs(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;dF(b|0,0,300);do{if((f|0)==0){if(!((d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;return g|0}if((e|0)==48e3|(e|0)==24e3|(e|0)==16e3|(e|0)==12e3|(e|0)==8e3){c[b+292>>2]=a[(((e>>12)-((e|0)>16e3&1)>>((e|0)>24e3&1))-1|0)+(5259680+((((d>>12)-((d|0)>16e3&1)>>((d|0)>24e3&1))-1|0)*5&-1))|0]|0;break}else{g=-1;return g|0}}else{if(!((d|0)==48e3|(d|0)==24e3|(d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){g=-1;return g|0}if((e|0)==16e3|(e|0)==12e3|(e|0)==8e3){c[b+292>>2]=a[((e>>12)-1|0)+(5259664+((((d>>12)-((d|0)>16e3&1)>>((d|0)>24e3&1))-1|0)*3&-1))|0]|0;break}else{g=-1;return g|0}}}while(0);f=(d|0)/1e3&-1;c[b+284>>2]=f;c[b+288>>2]=(e|0)/1e3&-1;c[b+268>>2]=f*10&-1;do{if((e|0)>(d|0)){f=b+264|0;if((d<<1|0)==(e|0)){c[f>>2]=1;h=0;break}else{c[f>>2]=2;h=1;break}}else{f=b+264|0;if((e|0)>=(d|0)){c[f>>2]=0;h=0;break}c[f>>2]=3;f=e<<2;if((f|0)==(d*3&-1|0)){c[b+280>>2]=3;c[b+276>>2]=18;c[b+296>>2]=5247768;h=0;break}i=e*3&-1;if((i|0)==(d<<1|0)){c[b+280>>2]=2;c[b+276>>2]=18;c[b+296>>2]=5247828;h=0;break}if((e<<1|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=24;c[b+296>>2]=5247988;h=0;break}if((i|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=5247948;h=0;break}if((f|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=5247908;h=0;break}if((e*6&-1|0)==(d|0)){c[b+280>>2]=1;c[b+276>>2]=36;c[b+296>>2]=5247868;h=0;break}else{g=-1;return g|0}}}while(0);f=e<<16>>16;i=(e>>15)+1>>1;j=d<<h;k=((d<<(h|14)|0)/(e|0)&-1)<<2;while(1){e=$(k>>16,f);h=$(k&65535,f)>>16;if(((e+$(k,i)|0)+h|0)<(j|0)){k=k+1|0}else{break}}c[b+272>>2]=k;g=0;return g|0}function ct(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a+284|0;g=a+292|0;h=c[g>>2]|0;i=(c[f>>2]|0)-h|0;j=a+168|0;dH(a+168+(h<<1)|0,d|0,i<<1);h=c[a+264>>2]|0;if((h|0)==3){k=a;cu(k,b,j|0,c[f>>2]|0);cu(k,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else if((h|0)==2){k=a;cx(k,b,j|0,c[f>>2]|0);cx(k,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else if((h|0)==1){h=a|0;cv(h,b,j|0,c[f>>2]|0);cv(h,b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)|0)}else{dH(b|0,j|0,c[f>>2]<<1);dH(b+(c[a+288>>2]<<1)|0,d+(i<<1)|0,e-(c[f>>2]|0)<<1)}f=c[g>>2]|0;dH(j|0,d+(e-f<<1)|0,f<<1);return 0}function cu(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;g=i;i=i+2064|0;h=g|0;j=h;k=a+24|0;l=a+276|0;m=c[l>>2]|0;dH(j|0,k|0,m<<2);n=a+296|0;o=c[n>>2]|0;p=o+4|0;q=c[a+272>>2]|0;r=a+268|0;s=a;t=a+4|0;u=a+280|0;a=o+6|0;v=o+8|0;w=o+10|0;x=o+12|0;y=o+14|0;z=o+16|0;A=o+18|0;B=o+20|0;C=o+22|0;D=o+24|0;E=o+26|0;F=o+28|0;G=o+30|0;H=o+32|0;I=o+34|0;J=o+36|0;K=o+38|0;L=d;d=e;e=f;f=m;m=o;while(1){M=c[r>>2]|0;N=(e|0)<(M|0)?e:M;L1617:do{if((N|0)>0){M=m+2|0;O=0;P=c[s>>2]|0;Q=c[t>>2]|0;while(1){R=((b[d+(O<<1)>>1]|0)<<8)+P|0;c[h+(O+f<<2)>>2]=R;S=R<<2;R=S>>16;T=b[m>>1]|0;U=$(R,T);V=S&65532;S=(U+Q|0)+($(V,T)>>16)|0;c[s>>2]=S;T=b[M>>1]|0;U=$(R,T);R=($(V,T)>>16)+U|0;c[t>>2]=R;U=O+1|0;if((U|0)==(N|0)){break L1617}else{O=U;P=S;Q=R}}}}while(0);Q=N<<16;P=c[u>>2]|0;L1622:do{if((f|0)==18){if((Q|0)<=0){W=L;break}O=P<<16>>16;M=P-1|0;R=0;S=L;while(1){U=R>>16;T=$(R&65535,O)>>16;V=T*9&-1;X=c[h+(U<<2)>>2]|0;Y=b[o+(V+2<<1)>>1]|0;Z=$(Y,X>>16);_=$(Y,X&65535)>>16;X=c[h+(U+1<<2)>>2]|0;Y=b[o+(V+3<<1)>>1]|0;aa=$(Y,X>>16);ab=$(Y,X&65535)>>16;X=c[h+(U+2<<2)>>2]|0;Y=b[o+(V+4<<1)>>1]|0;ac=$(Y,X>>16);ad=$(Y,X&65535)>>16;X=c[h+(U+3<<2)>>2]|0;Y=b[o+(V+5<<1)>>1]|0;ae=$(Y,X>>16);af=$(Y,X&65535)>>16;X=c[h+(U+4<<2)>>2]|0;Y=b[o+(V+6<<1)>>1]|0;ag=$(Y,X>>16);ah=$(Y,X&65535)>>16;X=c[h+(U+5<<2)>>2]|0;Y=b[o+(V+7<<1)>>1]|0;ai=$(Y,X>>16);aj=$(Y,X&65535)>>16;X=c[h+(U+6<<2)>>2]|0;Y=b[o+(V+8<<1)>>1]|0;ak=$(Y,X>>16);al=$(Y,X&65535)>>16;X=c[h+(U+7<<2)>>2]|0;Y=b[o+(V+9<<1)>>1]|0;am=$(Y,X>>16);an=$(Y,X&65535)>>16;X=c[h+(U+8<<2)>>2]|0;Y=b[o+(V+10<<1)>>1]|0;V=$(Y,X>>16);ao=$(Y,X&65535)>>16;X=(M-T|0)*9&-1;T=c[h+(U+17<<2)>>2]|0;Y=b[o+(X+2<<1)>>1]|0;ap=$(Y,T>>16);aq=$(Y,T&65535)>>16;T=c[h+(U+16<<2)>>2]|0;Y=b[o+(X+3<<1)>>1]|0;ar=$(Y,T>>16);as=$(Y,T&65535)>>16;T=c[h+(U+15<<2)>>2]|0;Y=b[o+(X+4<<1)>>1]|0;at=$(Y,T>>16);au=$(Y,T&65535)>>16;T=c[h+(U+14<<2)>>2]|0;Y=b[o+(X+5<<1)>>1]|0;av=$(Y,T>>16);aw=$(Y,T&65535)>>16;T=c[h+(U+13<<2)>>2]|0;Y=b[o+(X+6<<1)>>1]|0;ax=$(Y,T>>16);ay=$(Y,T&65535)>>16;T=c[h+(U+12<<2)>>2]|0;Y=b[o+(X+7<<1)>>1]|0;az=$(Y,T>>16);aA=$(Y,T&65535)>>16;T=c[h+(U+11<<2)>>2]|0;Y=b[o+(X+8<<1)>>1]|0;aB=$(Y,T>>16);aC=$(Y,T&65535)>>16;T=c[h+(U+10<<2)>>2]|0;Y=b[o+(X+9<<1)>>1]|0;aD=$(Y,T>>16);aE=$(Y,T&65535)>>16;T=c[h+(U+9<<2)>>2]|0;U=b[o+(X+10<<1)>>1]|0;X=$(U,T>>16);Y=(((((((((((((((((((((((((((((((((((_+Z|0)+aa|0)+ab|0)+ac|0)+ad|0)+ae|0)+af|0)+ag|0)+ah|0)+ai|0)+aj|0)+ak|0)+al|0)+am|0)+an|0)+V|0)+ao|0)+ap|0)+aq|0)+ar|0)+as|0)+at|0)+au|0)+av|0)+aw|0)+ax|0)+ay|0)+az|0)+aA|0)+aB|0)+aC|0)+aD|0)+aE|0)+X|0)+($(U,T&65535)>>16)>>5)+1>>1;if((Y|0)>32767){aF=32767}else{aF=(Y|0)<-32768?-32768:Y&65535}Y=S+2|0;b[S>>1]=aF;T=R+q|0;if((T|0)<(Q|0)){R=T;S=Y}else{W=Y;break L1622}}}else if((f|0)==36){if((Q|0)>0){aG=0;aH=L}else{W=L;break}while(1){S=aG>>16;R=(c[h+(S+35<<2)>>2]|0)+(c[h+(S<<2)>>2]|0)|0;M=b[p>>1]|0;O=$(R>>16,M);Y=$(R&65535,M)>>16;M=(c[h+(S+34<<2)>>2]|0)+(c[h+(S+1<<2)>>2]|0)|0;R=b[a>>1]|0;T=$(M>>16,R);U=$(M&65535,R)>>16;R=(c[h+(S+33<<2)>>2]|0)+(c[h+(S+2<<2)>>2]|0)|0;M=b[v>>1]|0;X=$(R>>16,M);aE=$(R&65535,M)>>16;M=(c[h+(S+32<<2)>>2]|0)+(c[h+(S+3<<2)>>2]|0)|0;R=b[w>>1]|0;aD=$(M>>16,R);aC=$(M&65535,R)>>16;R=(c[h+(S+31<<2)>>2]|0)+(c[h+(S+4<<2)>>2]|0)|0;M=b[x>>1]|0;aB=$(R>>16,M);aA=$(R&65535,M)>>16;M=(c[h+(S+30<<2)>>2]|0)+(c[h+(S+5<<2)>>2]|0)|0;R=b[y>>1]|0;az=$(M>>16,R);ay=$(M&65535,R)>>16;R=(c[h+(S+29<<2)>>2]|0)+(c[h+(S+6<<2)>>2]|0)|0;M=b[z>>1]|0;ax=$(R>>16,M);aw=$(R&65535,M)>>16;M=(c[h+(S+28<<2)>>2]|0)+(c[h+(S+7<<2)>>2]|0)|0;R=b[A>>1]|0;av=$(M>>16,R);au=$(M&65535,R)>>16;R=(c[h+(S+27<<2)>>2]|0)+(c[h+(S+8<<2)>>2]|0)|0;M=b[B>>1]|0;at=$(R>>16,M);as=$(R&65535,M)>>16;M=(c[h+(S+26<<2)>>2]|0)+(c[h+(S+9<<2)>>2]|0)|0;R=b[C>>1]|0;ar=$(M>>16,R);aq=$(M&65535,R)>>16;R=(c[h+(S+25<<2)>>2]|0)+(c[h+(S+10<<2)>>2]|0)|0;M=b[D>>1]|0;ap=$(R>>16,M);ao=$(R&65535,M)>>16;M=(c[h+(S+24<<2)>>2]|0)+(c[h+(S+11<<2)>>2]|0)|0;R=b[E>>1]|0;V=$(M>>16,R);an=$(M&65535,R)>>16;R=(c[h+(S+23<<2)>>2]|0)+(c[h+(S+12<<2)>>2]|0)|0;M=b[F>>1]|0;am=$(R>>16,M);al=$(R&65535,M)>>16;M=(c[h+(S+22<<2)>>2]|0)+(c[h+(S+13<<2)>>2]|0)|0;R=b[G>>1]|0;ak=$(M>>16,R);aj=$(M&65535,R)>>16;R=(c[h+(S+21<<2)>>2]|0)+(c[h+(S+14<<2)>>2]|0)|0;M=b[H>>1]|0;ai=$(R>>16,M);ah=$(R&65535,M)>>16;M=(c[h+(S+20<<2)>>2]|0)+(c[h+(S+15<<2)>>2]|0)|0;R=b[I>>1]|0;ag=$(M>>16,R);af=$(M&65535,R)>>16;R=(c[h+(S+19<<2)>>2]|0)+(c[h+(S+16<<2)>>2]|0)|0;M=b[J>>1]|0;ae=$(R>>16,M);ad=$(R&65535,M)>>16;M=(c[h+(S+18<<2)>>2]|0)+(c[h+(S+17<<2)>>2]|0)|0;S=b[K>>1]|0;R=$(M>>16,S);ac=(((((((((((((((((((((((((((((((((((Y+O|0)+T|0)+U|0)+X|0)+aE|0)+aD|0)+aC|0)+aB|0)+aA|0)+az|0)+ay|0)+ax|0)+aw|0)+av|0)+au|0)+at|0)+as|0)+ar|0)+aq|0)+ap|0)+ao|0)+V|0)+an|0)+am|0)+al|0)+ak|0)+aj|0)+ai|0)+ah|0)+ag|0)+af|0)+ae|0)+ad|0)+R|0)+($(M&65535,S)>>16)>>5)+1>>1;if((ac|0)>32767){aI=32767}else{aI=(ac|0)<-32768?-32768:ac&65535}ac=aH+2|0;b[aH>>1]=aI;S=aG+q|0;if((S|0)<(Q|0)){aG=S;aH=ac}else{W=ac;break L1622}}}else if((f|0)==24){if((Q|0)>0){aJ=0;aK=L}else{W=L;break}while(1){ac=aJ>>16;S=(c[h+(ac+23<<2)>>2]|0)+(c[h+(ac<<2)>>2]|0)|0;M=b[p>>1]|0;R=$(S>>16,M);ad=$(S&65535,M)>>16;M=(c[h+(ac+22<<2)>>2]|0)+(c[h+(ac+1<<2)>>2]|0)|0;S=b[a>>1]|0;ae=$(M>>16,S);af=$(M&65535,S)>>16;S=(c[h+(ac+21<<2)>>2]|0)+(c[h+(ac+2<<2)>>2]|0)|0;M=b[v>>1]|0;ag=$(S>>16,M);ah=$(S&65535,M)>>16;M=(c[h+(ac+20<<2)>>2]|0)+(c[h+(ac+3<<2)>>2]|0)|0;S=b[w>>1]|0;ai=$(M>>16,S);aj=$(M&65535,S)>>16;S=(c[h+(ac+19<<2)>>2]|0)+(c[h+(ac+4<<2)>>2]|0)|0;M=b[x>>1]|0;ak=$(S>>16,M);al=$(S&65535,M)>>16;M=(c[h+(ac+18<<2)>>2]|0)+(c[h+(ac+5<<2)>>2]|0)|0;S=b[y>>1]|0;am=$(M>>16,S);an=$(M&65535,S)>>16;S=(c[h+(ac+17<<2)>>2]|0)+(c[h+(ac+6<<2)>>2]|0)|0;M=b[z>>1]|0;V=$(S>>16,M);ao=$(S&65535,M)>>16;M=(c[h+(ac+16<<2)>>2]|0)+(c[h+(ac+7<<2)>>2]|0)|0;S=b[A>>1]|0;ap=$(M>>16,S);aq=$(M&65535,S)>>16;S=(c[h+(ac+15<<2)>>2]|0)+(c[h+(ac+8<<2)>>2]|0)|0;M=b[B>>1]|0;ar=$(S>>16,M);as=$(S&65535,M)>>16;M=(c[h+(ac+14<<2)>>2]|0)+(c[h+(ac+9<<2)>>2]|0)|0;S=b[C>>1]|0;at=$(M>>16,S);au=$(M&65535,S)>>16;S=(c[h+(ac+13<<2)>>2]|0)+(c[h+(ac+10<<2)>>2]|0)|0;M=b[D>>1]|0;av=$(S>>16,M);aw=$(S&65535,M)>>16;M=(c[h+(ac+12<<2)>>2]|0)+(c[h+(ac+11<<2)>>2]|0)|0;ac=b[E>>1]|0;S=$(M>>16,ac);ax=(((((((((((((((((((((((ad+R|0)+ae|0)+af|0)+ag|0)+ah|0)+ai|0)+aj|0)+ak|0)+al|0)+am|0)+an|0)+V|0)+ao|0)+ap|0)+aq|0)+ar|0)+as|0)+at|0)+au|0)+av|0)+aw|0)+S|0)+($(M&65535,ac)>>16)>>5)+1>>1;if((ax|0)>32767){aL=32767}else{aL=(ax|0)<-32768?-32768:ax&65535}ax=aK+2|0;b[aK>>1]=aL;ac=aJ+q|0;if((ac|0)<(Q|0)){aJ=ac;aK=ax}else{W=ax;break L1622}}}else{W=L}}while(0);Q=e-N|0;if((Q|0)<=1){break}P=c[l>>2]|0;dH(j|0,h+(N<<2)|0,P<<2);L=W;d=d+(N<<1)|0;e=Q;f=P;m=c[n>>2]|0}dH(k|0,h+(N<<2)|0,c[l>>2]<<2);i=g;return}function cv(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if((f|0)<=0){return}g=a+4|0;h=a+8|0;i=a+12|0;j=a+16|0;k=a+20|0;l=0;while(1){m=(b[e+(l<<1)>>1]|0)<<10;n=c[a>>2]|0;o=m-n|0;p=(((o&65535)*1746&-1)>>>16)+((o>>16)*1746&-1)|0;o=p+n|0;c[a>>2]=p+m|0;p=c[g>>2]|0;n=o-p|0;q=(((n&65535)*14986&-1)>>>16)+((n>>16)*14986&-1)|0;n=q+p|0;c[g>>2]=q+o|0;o=n-(c[h>>2]|0)|0;q=(((o&65535)*-26453&-1)>>16)+((o>>16)*-26453&-1)|0;c[h>>2]=(o+n|0)+q|0;o=(q+n>>9)+1>>1;if((o|0)>32767){r=32767}else{r=(o|0)<-32768?-32768:o&65535}o=l<<1;b[d+(o<<1)>>1]=r;n=c[i>>2]|0;q=m-n|0;p=(((q&65535)*6854&-1)>>>16)+((q>>16)*6854&-1)|0;q=p+n|0;c[i>>2]=p+m|0;m=c[j>>2]|0;p=q-m|0;n=(((p&65535)*25769&-1)>>>16)+((p>>16)*25769&-1)|0;p=n+m|0;c[j>>2]=n+q|0;q=p-(c[k>>2]|0)|0;n=(((q&65535)*-9994&-1)>>16)+((q>>16)*-9994&-1)|0;c[k>>2]=(q+p|0)+n|0;q=(n+p>>9)+1>>1;if((q|0)>32767){s=32767}else{s=(q|0)<-32768?-32768:q&65535}b[d+((o|1)<<1)>>1]=s;o=l+1|0;if((o|0)==(f|0)){break}else{l=o}}return}function cw(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;f=i;i=i+24|0;g=f|0;h=a+28|0;j=c[h>>2]|0;k=a+32|0;l=c[k>>2]|0;m=j>>>8;n=-1;o=j;while(1){p=n+1|0;q=$(d[p+5246280|0]|0,m);if(l>>>0<q>>>0){n=p;o=q}else{break}}n=l-q|0;c[k>>2]=n;l=o-q|0;c[h>>2]=l;q=a+20|0;o=a+40|0;m=a+24|0;j=a+4|0;r=a|0;L1662:do{if(l>>>0<8388609){a=c[j>>2]|0;s=c[q>>2]|0;t=l;u=c[o>>2]|0;v=c[m>>2]|0;w=n;while(1){x=s+8|0;c[q>>2]=x;y=t<<8;c[h>>2]=y;if(v>>>0<a>>>0){z=v+1|0;c[m>>2]=z;A=d[(c[r>>2]|0)+v|0]|0;B=z}else{A=0;B=v}c[o>>2]=A;z=((A|u<<8)>>>1&255|w<<8&2147483392)^255;c[k>>2]=z;if(y>>>0<8388609){s=x;t=y;u=A;v=B;w=z}else{C=y;D=z;break L1662}}}else{C=l;D=n}}while(0);n=(p|0)/5&-1;l=g+8|0;c[l>>2]=n;B=g+20|0;c[B>>2]=(n*-5&-1)+p|0;p=0;n=C;C=D;while(1){D=n>>>8;A=-1;w=n;while(1){E=A+1|0;F=$(d[E+5246236|0]|0,D);if(C>>>0<F>>>0){A=E;w=F}else{break}}A=C-F|0;c[k>>2]=A;D=w-F|0;c[h>>2]=D;L1675:do{if(D>>>0<8388609){v=c[j>>2]|0;u=c[q>>2]|0;t=D;s=c[o>>2]|0;a=c[m>>2]|0;z=A;while(1){y=u+8|0;c[q>>2]=y;x=t<<8;c[h>>2]=x;if(a>>>0<v>>>0){G=a+1|0;c[m>>2]=G;H=d[(c[r>>2]|0)+a|0]|0;I=G}else{H=0;I=a}c[o>>2]=H;G=((H|s<<8)>>>1&255|z<<8&2147483392)^255;c[k>>2]=G;if(x>>>0<8388609){u=y;t=x;s=H;a=I;z=G}else{J=x;K=G;break L1675}}}else{J=D;K=A}}while(0);c[g+(p*12&-1)>>2]=E;A=J>>>8;D=-1;w=J;while(1){L=D+1|0;M=$(d[L+5246224|0]|0,A);if(K>>>0<M>>>0){D=L;w=M}else{break}}D=K-M|0;c[k>>2]=D;A=w-M|0;c[h>>2]=A;L1686:do{if(A>>>0<8388609){z=c[j>>2]|0;a=c[q>>2]|0;s=A;t=c[o>>2]|0;u=c[m>>2]|0;v=D;while(1){G=a+8|0;c[q>>2]=G;x=s<<8;c[h>>2]=x;if(u>>>0<z>>>0){y=u+1|0;c[m>>2]=y;N=d[(c[r>>2]|0)+u|0]|0;O=y}else{N=0;O=u}c[o>>2]=N;y=((N|t<<8)>>>1&255|v<<8&2147483392)^255;c[k>>2]=y;if(x>>>0<8388609){a=G;s=x;t=N;u=O;v=y}else{P=x;Q=y;break L1686}}}else{P=A;Q=D}}while(0);c[g+(p*12&-1)+4>>2]=L;D=p+1|0;if((D|0)==2){break}else{p=D;n=P;C=Q}}Q=g|0;C=(c[Q>>2]|0)+((c[l>>2]|0)*3&-1)|0;c[Q>>2]=C;Q=b[5246248+(C<<1)>>1]|0;l=(b[5246248+(C+1<<1)>>1]|0)-Q|0;C=$(l>>16,429522944)+((l&65535)*6554&-1)>>16;l=$(C,c[g+4>>2]<<17>>16|1)+Q|0;Q=g+12|0;C=(c[Q>>2]|0)+((c[B>>2]|0)*3&-1)|0;c[Q>>2]=C;Q=b[5246248+(C<<1)>>1]|0;B=(b[5246248+(C+1<<1)>>1]|0)-Q|0;C=$(B>>16,429522944)+((B&65535)*6554&-1)>>16;B=$(C,c[g+16>>2]<<17>>16|1)+Q|0;c[e+4>>2]=B;c[e>>2]=l-B|0;i=f;return}function cx(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+976|0;h=g|0;j=h;k=a+24|0;dH(j|0,k|0,32);l=c[a+272>>2]|0;m=a+268|0;n=a;a=h+16|0;o=d;d=e;e=f;while(1){f=c[m>>2]|0;p=(e|0)<(f|0)?e:f;cv(n,a,d,p);f=p<<17;L1698:do{if((f|0)>0){q=0;r=o;while(1){s=((q&65535)*12&-1)>>>16;t=q>>16;u=$(b[5246984+(s<<3)>>1]|0,b[h+(t<<1)>>1]|0);v=$(b[5246986+(s<<3)>>1]|0,b[h+(t+1<<1)>>1]|0)+u|0;u=v+$(b[5246988+(s<<3)>>1]|0,b[h+(t+2<<1)>>1]|0)|0;v=u+$(b[5246990+(s<<3)>>1]|0,b[h+(t+3<<1)>>1]|0)|0;u=11-s|0;s=v+$(b[5246990+(u<<3)>>1]|0,b[h+(t+4<<1)>>1]|0)|0;v=s+$(b[5246988+(u<<3)>>1]|0,b[h+(t+5<<1)>>1]|0)|0;s=v+$(b[5246986+(u<<3)>>1]|0,b[h+(t+6<<1)>>1]|0)|0;v=(s+$(b[5246984+(u<<3)>>1]|0,b[h+(t+7<<1)>>1]|0)>>14)+1>>1;if((v|0)>32767){w=32767}else{w=(v|0)<-32768?-32768:v&65535}v=r+2|0;b[r>>1]=w;t=q+l|0;if((t|0)<(f|0)){q=t;r=v}else{x=v;break L1698}}}else{x=o}}while(0);f=e-p|0;if((f|0)<=0){break}dH(j|0,h+(p<<1<<1)|0,32);o=x;d=d+(p<<1)|0;e=f}dH(k|0,h+(p<<1<<1)|0,32);i=g;return}function cy(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0,i=0;if(a>>>0<=65535){b=a<<16>>16;do{if((a&65535)<<16>>16==0){c=16}else{do{if((b&65280|0)==0){d=(b&65520|0)==0;e=d?12:8;f=d?a:b>>>4}else{if((b&61440|0)==0){e=4;f=b>>>8;break}else{e=0;f=b>>>12;break}}}while(0);d=f<<16>>16;if((d&12|0)!=0){c=(d>>>3&1|e)^1;break}if((d&14|0)==0){c=e|3;break}else{c=e|2;break}}}while(0);g=c+16|0;return g|0}c=a>>>16;a=c<<16>>16;if((c|0)==0){g=16;return g|0}do{if((a&65280|0)==0){e=(a&65520|0)==0;h=e?12:8;i=e?c:a>>>4}else{if((a&61440|0)==0){h=4;i=a>>>8;break}else{h=0;i=a>>>12;break}}}while(0);a=i<<16>>16;if((a&12|0)!=0){g=(a>>>3&1|h)^1;return g|0}if((a&14|0)==0){g=h|3;return g|0}else{g=h|2;return g|0}return 0}function cz(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=0;g=0;while(1){h=d+(f<<2)|0;i=e+(f*3&-1)|0;j=e+(f*3&-1)+1|0;k=2147483647;l=0;m=g;while(1){n=b[5246248+(l<<1)>>1]|0;o=l+1|0;p=(b[5246248+(o<<1)>>1]|0)-n|0;q=$(p>>16,429522944)+((p&65535)*6554&-1)>>16;p=l&255;r=q+n|0;s=(c[h>>2]|0)-r|0;t=(s|0)>0?s:-s|0;if((t|0)>=(k|0)){u=1214;break}a[i]=p;a[j]=0;s=(q*3&-1)+n|0;v=(c[h>>2]|0)-s|0;w=(v|0)>0?v:-v|0;if((w|0)>=(t|0)){x=r;y=p;break}a[i]=p;a[j]=1;r=(q*5&-1)+n|0;t=(c[h>>2]|0)-r|0;v=(t|0)>0?t:-t|0;if((v|0)>=(w|0)){x=s;y=p;break}a[i]=p;a[j]=2;s=(q*7&-1)+n|0;w=(c[h>>2]|0)-s|0;t=(w|0)>0?w:-w|0;if((t|0)>=(v|0)){x=r;y=p;break}a[i]=p;a[j]=3;r=(q*9&-1)+n|0;n=(c[h>>2]|0)-r|0;q=(n|0)>0?n:-n|0;if((q|0)>=(t|0)){x=s;y=p;break}a[i]=p;a[j]=4;if((o|0)<15){k=q;l=o;m=r}else{x=r;y=p;break}}if((u|0)==1214){u=0;x=m;y=a[i]|0}l=(y<<24>>24|0)/3&-1;a[e+(f*3&-1)+2|0]=l&255;a[i]=((l<<24>>24)*-3&-1)+(y&255)&255;c[h>>2]=x;l=f+1|0;if((l|0)==2){break}else{f=l;g=x}}c[d>>2]=(c[d>>2]|0)-(c[d+4>>2]|0)|0;return}function cA(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;i=g-1|0;j=0;k=0;while(1){if((k|0)>=(i|0)){l=k;m=0;n=j;break}o=b[d+(k<<1)>>1]|0;p=o<<16>>16;q=$(p,p)+j|0;p=b[d+((k|1)<<1)>>1]|0;r=q+$(p,p)|0;if((r|0)<0){s=1224;break}else{j=r;k=k+2|0}}L1765:do{if((s|0)==1224){j=k;p=2;q=r>>>2;t=o;while(1){u=t<<16>>16;v=$(u,u);u=b[d+((j|1)<<1)>>1]|0;w=(($(u,u)+v|0)>>>(p>>>0))+q|0;if((w|0)<0){x=w>>>2;y=p+2|0}else{x=w;y=p}w=j+2|0;if((w|0)>=(i|0)){l=w;m=y;n=x;break L1765}j=w;p=y;q=x;t=b[d+(w<<1)>>1]|0}}}while(0);if((l|0)==(i|0)){l=b[d+(i<<1)>>1]|0;z=($(l,l)>>>(m>>>0))+n|0}else{z=n}if(z>>>0>1073741823){A=z>>>2;B=m+2|0}else{A=z;B=m}m=0;z=0;while(1){if((z|0)>=(i|0)){C=z;D=0;E=m;break}F=b[e+(z<<1)>>1]|0;n=F<<16>>16;l=$(n,n)+m|0;n=b[e+((z|1)<<1)>>1]|0;G=l+$(n,n)|0;if((G|0)<0){s=1236;break}else{m=G;z=z+2|0}}L1783:do{if((s|0)==1236){m=z;n=2;l=G>>>2;x=F;while(1){y=x<<16>>16;o=$(y,y);y=b[e+((m|1)<<1)>>1]|0;r=(($(y,y)+o|0)>>>(n>>>0))+l|0;if((r|0)<0){H=r>>>2;I=n+2|0}else{H=r;I=n}r=m+2|0;if((r|0)>=(i|0)){C=r;D=I;E=H;break L1783}m=r;n=I;l=H;x=b[e+(r<<1)>>1]|0}}}while(0);if((C|0)==(i|0)){C=b[e+(i<<1)>>1]|0;J=($(C,C)>>>(D>>>0))+E|0}else{J=E}if(J>>>0>1073741823){K=J>>>2;L=D+2|0}else{K=J;L=D}D=(B|0)>(L|0)?B:L;J=(D&1)+D|0;D=K>>J-L;L=A>>J-B;B=(L|0)>1?L:1;L1798:do{if((g|0)>0){L=0;A=0;while(1){K=($(b[e+(L<<1)>>1]|0,b[d+(L<<1)>>1]|0)>>J)+A|0;E=L+1|0;if((E|0)==(g|0)){M=K;break L1798}else{L=E;A=K}}}else{M=0}}while(0);g=cB(M,B,13)|0;if((g|0)>16384){N=16384}else{N=(g|0)<-16384?-16384:g}g=N<<16>>16;d=$(g,N>>16);e=($(g,N&65535)>>16)+d|0;d=(e|0)>0?e:-e|0;A=(d|0)<(h|0)?h:d;d=J>>1;J=c[f>>2]|0;h=cy(B)|0;L=24-h|0;K=-L|0;E=(h|0)==24;do{if(E){O=B}else{if((L|0)<0){O=B>>>((L+32|0)>>>0)|B<<K;break}else{O=B<<32-L|B>>>(L>>>0);break}}}while(0);C=((h&1|0)==0?46214:32768)>>>(h>>1>>>0);h=C>>16;i=$(O&127,13959168)>>>16;O=$(i,h);H=C&65535;I=A<<16>>16;A=$(((O+C|0)+($(i,H)>>>16)<<d)-J>>16,I);do{if(E){P=B}else{if((L|0)<0){P=B>>>((L+32|0)>>>0)|B<<K;break}else{P=B<<32-L|B>>>(L>>>0);break}}}while(0);L=$(P&127,13959168)>>>16;P=$(L,h);h=(A+J|0)+($(((P+C|0)+($(L,H)>>>16)<<d)-J&65535,I)>>16)|0;c[f>>2]=h;J=$(g,M>>16);H=D-(($(g,M&65535)>>16)+J<<4)|0;J=e<<16>>16;e=$(J,B>>16);M=(($(J,B&65535)>>16)+e<<6)+H|0;H=f+4|0;f=c[H>>2]|0;if((M|0)<1){Q=0;R=0}else{e=cy(M)|0;B=24-e|0;J=-B|0;g=(e|0)==24;do{if(g){S=M}else{if((B|0)<0){S=M>>>((B+32|0)>>>0)|M<<J;break}else{S=M<<32-B|M>>>(B>>>0);break}}}while(0);D=((e&1|0)==0?46214:32768)>>>(e>>1>>>0);e=D>>16;L=$(S&127,13959168)>>>16;S=$(L,e);C=D&65535;P=(S+D|0)+($(L,C)>>>16)<<d;do{if(g){T=M}else{if((B|0)<0){T=M>>>((B+32|0)>>>0)|M<<J;break}else{T=M<<32-B|M>>>(B>>>0);break}}}while(0);B=$(T&127,13959168)>>>16;T=$(B,e);Q=(T+D|0)+($(B,C)>>>16)|0;R=P}P=$(R-f>>16,I);R=(P+f|0)+($((Q<<d)-f&65535,I)>>16)|0;c[H>>2]=R;H=cB(R,(h|0)>1?h:1,14)|0;c[a>>2]=H;if((H|0)>32767){U=32767;c[a>>2]=U;return N|0}U=(H|0)<0?0:H;c[a>>2]=U;return N|0}function cB(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=cy((a|0)>0?a:-a|0)|0;e=a<<d-1;a=cy((b|0)>0?b:-b|0)|0;f=b<<a-1;b=(536870911/(f>>16|0)&-1)<<16>>16;g=$(b,e>>16);h=($(b,e&65535)>>16)+g|0;dT(h,(h|0)<0?-1:0,f,(f|0)<0?-1:0);f=D;g=e-(f<<3|0>>>29)|0;f=$(g>>16,b);e=(f+h|0)+($(g&65535,b)>>16)|0;b=((28-c|0)+d|0)+(1-a|0)|0;if((b|0)>=0){return((b|0)<32?e>>b:0)|0}a=-b|0;b=-2147483648>>a;d=2147483647>>>(a>>>0);if((b|0)>(d|0)){if((e|0)>(b|0)){i=b;j=i<<a;return j|0}i=(e|0)<(d|0)?d:e;j=i<<a;return j|0}else{if((e|0)>(d|0)){i=d;j=i<<a;return j|0}i=(e|0)<(b|0)?b:e;j=i<<a;return j|0}return 0}function cC(a){a=a|0;var b=0;if((a-1|0)>>>0>1){b=0;return b|0}b=(a*8768&-1)+9380|0;return b|0}function cD(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,h=0,i=0.0,j=0.0,k=0,l=0,m=0,n=0,o=0.0,p=0,q=0.0,r=0.0,s=0,t=0,u=0.0,v=0,w=0.0,x=0,y=0,z=0.0,A=0,B=0,C=0.0,D=0,E=0.0,F=0,G=0.0,H=0.0;e=$(c,b);L1858:do{if((e|0)>0){f=0;while(1){h=a+(f<<2)|0;i=+g[h>>2];do{if(i<=2.0&i<-2.0){j=-2.0}else{if(i>2.0){j=2.0;break}j=i}}while(0);g[h>>2]=j;k=f+1|0;if((k|0)==(e|0)){break L1858}else{f=k}}}}while(0);if((c|0)<=0){return}e=(b|0)>0;f=0;while(1){k=a+(f<<2)|0;l=d+(f<<2)|0;j=+g[l>>2];L1871:do{if(e){m=0;while(1){n=a+($(m,c)+f<<2)|0;i=+g[n>>2];o=j*i;if(o>=0.0){break L1871}g[n>>2]=i+i*o;n=m+1|0;if((n|0)<(b|0)){m=n}else{break L1871}}}}while(0);j=+g[k>>2];m=0;while(1){h=m;while(1){p=(h|0)<(b|0);if(!p){break}o=+g[a+($(h,c)+f<<2)>>2];if(o>1.0|o<-1.0){break}else{h=h+1|0}}if((h|0)==(b|0)){q=0.0;break}o=+g[a+($(h,c)+f<<2)>>2];if(o<0.0){r=-0.0-o}else{r=o}n=h;while(1){if((n|0)<=0){break}s=n-1|0;if(o*+g[a+($(s,c)+f<<2)>>2]<0.0){break}else{n=s}}L1890:do{if(p){s=h;i=r;t=h;while(1){u=+g[a+($(s,c)+f<<2)>>2];if(o*u<0.0){v=s;w=i;x=t;break L1890}y=u<0.0;if(y){z=-0.0-u}else{z=u}A=z<=i;if(A|y^1){B=A?t:s;C=A?i:u}else{B=s;C=-0.0-u}A=s+1|0;if((A|0)<(b|0)){s=A;i=C;t=B}else{v=A;w=C;x=B;break L1890}}}else{v=h;w=r;x=h}}while(0);if((n|0)==0){D=o*+g[k>>2]>=0.0}else{D=0}i=(w+-1.0)/(w*w);if(o>0.0){E=-0.0-i}else{E=i}L1907:do{if((n|0)<(v|0)){h=n;while(1){t=a+($(h,c)+f<<2)|0;i=+g[t>>2];g[t>>2]=i+i*E*i;t=h+1|0;if((t|0)==(v|0)){break L1907}else{h=t}}}}while(0);L1911:do{if(D&(x|0)>1){o=j- +g[k>>2];i=o/+(x|0);if((m|0)<(x|0)){F=m;G=o}else{break}while(1){o=G-i;n=a+($(F,c)+f<<2)|0;u=o+ +g[n>>2];g[n>>2]=u;do{if(u<=1.0&u<-1.0){H=-1.0}else{if(u>1.0){H=1.0;break}H=u}}while(0);g[n>>2]=H;h=F+1|0;if((h|0)==(x|0)){break L1911}else{F=h;G=o}}}}while(0);if((v|0)==(b|0)){q=E;break}else{m=v}}g[l>>2]=q;m=f+1|0;if((m|0)==(c|0)){break}else{f=m}}return}function cE(e,f,g,h,i,j,k){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;if((j|0)==0){l=-1;return l|0}m=a[e]|0;n=m&255;do{if((n&128|0)==0){if((n&96|0)==96){o=(n&8|0)==0?480:960;break}p=n>>>3&3;if((p|0)==3){o=2880;break}o=(48e3<<p|0)/100&-1}else{o=(48e3<<(n>>>3&3)|0)/400&-1}}while(0);p=e+1|0;q=f-1|0;r=n&3;L1934:do{if((r|0)==1){if((g|0)!=0){s=2;t=1;u=q;v=q;w=p;x=1380;break}if((q&1|0)==0){n=(q|0)/2&-1;b[j>>1]=n&65535;y=p;z=n;A=q;B=1;C=2;x=1379;break}else{l=-4;return l|0}}else if((r|0)==2){if((q|0)<1){b[j>>1]=-1;l=-4;return l|0}n=a[p]|0;D=n&255;do{if((n&255)<252){E=1;F=D;G=D}else{if((q|0)>=2){H=((d[e+2|0]|0)<<2)+D&65535;E=2;F=H;G=H;break}b[j>>1]=-1;l=-4;return l|0}}while(0);b[j>>1]=G;D=q-E|0;n=F<<16>>16;if(F<<16>>16<0|(n|0)>(D|0)){l=-4;return l|0}else{y=e+(E+1|0)|0;z=D-n|0;A=D;B=0;C=2;x=1379;break}}else if((r|0)==0){y=p;z=q;A=q;B=0;C=1;x=1379}else{if((q|0)<1){l=-4;return l|0}D=e+2|0;n=a[p]|0;H=n&255;I=H&63;if((I|0)==0){l=-4;return l|0}if(($(I,o)|0)>5760){l=-4;return l|0}J=f-2|0;L1966:do{if((H&64|0)==0){K=D;L=J}else{M=D;N=J;while(1){if((N|0)<1){l=-4;break}O=M+1|0;P=a[M]|0;Q=P<<24>>24==-1;R=(N-1|0)+(Q?-254:-(P&255)|0)|0;if(Q){M=O;N=R}else{K=O;L=R;break L1966}}return l|0}}while(0);if((L|0)<0){l=-4;return l|0}J=H>>>7^1;if((H&128|0)==0){if((g|0)!=0){s=I;t=J;u=L;v=q;w=K;x=1380;break}D=(L|0)/(I|0)&-1;if(($(D,I)|0)!=(L|0)){l=-4;return l|0}if((I-1|0)<=0){y=K;z=D;A=L;B=J;C=I;x=1379;break}N=D&65535;M=(n&63)-1|0;R=0;while(1){b[j+(R<<1)>>1]=N;O=R+1|0;if((O|0)==(M|0)){y=K;z=D;A=L;B=J;C=I;x=1379;break L1934}else{R=O}}}R=I-1|0;L1985:do{if((R|0)>0){D=0;M=L;N=L;n=K;while(1){S=j+(D<<1)|0;if((M|0)<1){x=1365;break}H=a[n]|0;O=H&255;if((H&255)<252){T=1;U=O;V=O}else{if((M|0)<2){x=1369;break}H=((d[n+1|0]|0)<<2)+O&65535;T=2;U=H;V=H}b[S>>1]=V;H=M-T|0;O=U<<16>>16;if(U<<16>>16<0|(O|0)>(H|0)){l=-4;x=1414;break}Q=n+T|0;P=(N-T|0)-O|0;O=D+1|0;if((O|0)<(R|0)){D=O;M=H;N=P;n=Q}else{W=H;X=P;Y=Q;break L1985}}if((x|0)==1414){return l|0}else if((x|0)==1365){b[S>>1]=-1;l=-4;return l|0}else if((x|0)==1369){b[S>>1]=-1;l=-4;return l|0}}else{W=L;X=L;Y=K}}while(0);if((X|0)<0){l=-4}else{y=Y;z=X;A=W;B=J;C=I;x=1379;break}return l|0}}while(0);do{if((x|0)==1379){if((g|0)!=0){s=C;t=B;u=A;v=z;w=y;x=1380;break}if((z|0)>1275){l=-4;return l|0}else{b[j+(C-1<<1)>>1]=z&65535;Z=y;_=C;break}}}while(0);L2009:do{if((x|0)==1380){C=s-1|0;y=j+(C<<1)|0;if((u|0)<1){b[y>>1]=-1;l=-4;return l|0}z=a[w]|0;A=z&255;do{if((z&255)<252){aa=1;ab=A;ac=A}else{if((u|0)>=2){B=((d[w+1|0]|0)<<2)+A&65535;aa=2;ab=B;ac=B;break}b[y>>1]=-1;l=-4;return l|0}}while(0);b[y>>1]=ac;A=u-aa|0;z=ab<<16>>16;if(ab<<16>>16<0|(z|0)>(A|0)){l=-4;return l|0}I=w+aa|0;if((t|0)==0){if((z|0)>(v|0)){l=-4}else{Z=I;_=s;break}return l|0}if(($(z,s)|0)>(A|0)){l=-4;return l|0}if((C|0)>0){ad=0;ae=ab}else{Z=I;_=s;break}while(1){b[j+(ad<<1)>>1]=ae;A=ad+1|0;if((A|0)==(C|0)){Z=I;_=s;break L2009}ad=A;ae=b[y>>1]|0}}}while(0);L2037:do{if((i|0)!=0&(_|0)>0){ae=0;ad=Z;while(1){c[i+(ae<<2)>>2]=ad;s=ad+(b[j+(ae<<1)>>1]|0)|0;ab=ae+1|0;if((ab|0)==(_|0)){af=s;break L2037}else{ae=ab;ad=s}}}else{af=Z}}while(0);if((h|0)!=0){a[h]=m}if((k|0)==0){l=_;return l|0}c[k>>2]=af-e|0;l=_;return l|0}function cF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;if(!((b|0)==48e3|(b|0)==24e3|(b|0)==16e3|(b|0)==12e3|(b|0)==8e3)){f=-1;i=e;return f|0}if((d-1|0)>>>0>1){f=-1;i=e;return f|0}g=d*8768&-1;dF(a|0,0,g+9380|0);c[a+4>>2]=84;c[a>>2]=8628;h=a+84|0;j=a+8628|0;k=j;c[a+8>>2]=d;c[a+44>>2]=d;c[a+12>>2]=b;c[a+24>>2]=b;c[a+16>>2]=d;dF(h|0,0,4252);c[a+2460>>2]=1;c[h>>2]=65536;c[a+4232>>2]=0;c[a+4236>>2]=3176576;c[a+4252>>2]=0;c[a+4324>>2]=65536;c[a+4328>>2]=65536;c[a+4340>>2]=20;c[a+4336>>2]=2;h=a+4344|0;dF(h|0,0,4252);c[a+6720>>2]=1;c[h>>2]=65536;c[a+8492>>2]=0;c[a+8496>>2]=3176576;c[a+8512>>2]=0;c[a+8584>>2]=65536;c[a+8588>>2]=65536;c[a+8600>>2]=20;c[a+8596>>2]=2;dF(a+8604|0,0,12);c[a+8624>>2]=0;if(d>>>0>2|(j|0)==0){f=-3;i=e;return f|0}dF(j|0,0,g+752|0);c[j>>2]=5251160;c[j+4>>2]=120;c[j+8>>2]=d;c[j+12>>2]=d;d=j+16|0;c[d>>2]=1;c[j+20>>2]=0;c[j+24>>2]=21;c[j+28>>2]=1;c[j+44>>2]=0;bp(k,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);if((b|0)==48e3){l=1}else if((b|0)==12e3){l=4}else if((b|0)==24e3){l=2}else if((b|0)==16e3){l=3}else if((b|0)==8e3){l=6}else{c[d>>2]=0;f=-3;i=e;return f|0}c[d>>2]=l;bp(k,10016,(u=i,i=i+4|0,c[u>>2]=0,u)|0);c[a+56>>2]=0;c[a+60>>2]=(b|0)/400&-1;f=0;i=e;return f|0}function cG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;do{if((a|0)==48e3|(a|0)==24e3|(a|0)==16e3|(a|0)==12e3|(a|0)==8e3){if((b-1|0)>>>0>1){e=1444;break}f=dC((b*8768&-1)+9380|0)|0;g=f;if((f|0)==0){if((d|0)==0){h=0;break}c[d>>2]=-7;h=0;break}i=cF(g,a,b)|0;if((d|0)!=0){c[d>>2]=i}if((i|0)==0){h=g;break}dD(f);h=0;break}else{e=1444}}while(0);do{if((e|0)==1444){if((d|0)==0){h=0;break}c[d>>2]=-1;h=0}}while(0);return h|0}function cH(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return cE(a,b,0,c,d,e,f)|0}function cI(d,e,f,h,j,k,l,m,n){d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;o=i;i=i+104|0;p=o|0;q=o+4|0;r=o+8|0;if(k>>>0>1){s=-1;i=o;return s|0}t=(k|0)!=0;k=(f|0)==0;u=(e|0)==0;do{if(t|k|u){if(((j|0)%((c[d+12>>2]|0)/400&-1|0)|0)==0){break}else{s=-1}i=o;return s|0}}while(0);if(k|u){u=d+8|0;k=0;while(1){v=cJ(d,0,0,h+($(c[u>>2]|0,k)<<2)|0,j-k|0,0)|0;if((v|0)<0){s=v;w=1511;break}x=v+k|0;if((x|0)<(j|0)){k=x}else{break}}if((w|0)==1511){i=o;return s|0}c[d+68>>2]=x;s=x;i=o;return s|0}if((f|0)<0){s=-1;i=o;return s|0}x=a[e]|0;k=x&255;do{if((k&128|0)==0){u=(k&96|0)==96?1001:1e3;if((k&96|0)==96){v=d+12|0;y=k>>>4&1|1104;z=v;A=v}else{v=d+12|0;y=(k>>>5&3)+1101|0;z=v;A=v}v=c[A>>2]|0;if((k&96|0)==96){if((k&8|0)==0){B=(v|0)/100&-1;C=u;D=y;E=z;break}else{B=(v|0)/50&-1;C=u;D=y;E=z;break}}else{F=k>>>3&3;if((F|0)==3){B=(v*60&-1|0)/1e3&-1;C=u;D=y;E=z;break}else{B=(v<<F|0)/100&-1;C=u;D=y;E=z;break}}}else{u=k>>>5&3;F=d+12|0;B=(c[F>>2]<<(k>>>3&3)|0)/400&-1;C=1002;D=(u|0)==0?1101:u+1102|0;E=F}}while(0);k=(x&4)<<24>>24!=0?2:1;x=r|0;z=cE(e,f,l,q,0,x,p)|0;q=c[p>>2]|0;p=e+q|0;if(!t){if((z|0)<0){s=z;i=o;return s|0}if(($(z,B)|0)>(j|0)){s=-2;i=o;return s|0}c[d+52>>2]=C;c[d+48>>2]=D;c[d+60>>2]=B;c[d+44>>2]=k;L2130:do{if((z|0)>0){t=d+8|0;e=q;l=0;f=0;y=p;while(1){A=r+(f<<1)|0;F=b[A>>1]|0;u=cJ(d,y,F,h+($(c[t>>2]|0,l)<<2)|0,j-l|0,0)|0;if((u|0)<0){s=u;break}F=b[A>>1]|0;A=F+e|0;v=u+l|0;u=f+1|0;if((u|0)<(z|0)){e=A;l=v;f=u;y=y+F|0}else{G=A;H=v;break L2130}}i=o;return s|0}else{G=q;H=0}}while(0);if((m|0)!=0){c[m>>2]=G}c[d+68>>2]=H;if((n|0)==0){g[d+76>>2]=0.0;g[d+72>>2]=0.0;s=H;i=o;return s|0}else{cD(h,H,c[d+8>>2]|0,d+72|0);s=H;i=o;return s|0}}do{if(!((B|0)>(j|0)|(C|0)==1002)){H=d+52|0;if((c[H>>2]|0)==1002){break}n=d+68|0;G=c[n>>2]|0;m=j-B|0;L2149:do{if((B|0)==(j|0)){I=d+8|0}else{L2151:do{if(((m|0)%((c[E>>2]|0)/400&-1|0)|0)==0){q=d+8|0;z=0;while(1){r=cJ(d,0,0,h+($(c[q>>2]|0,z)<<2)|0,m-z|0,0)|0;if((r|0)<0){J=r;break L2151}K=r+z|0;if((K|0)<(m|0)){z=K}else{break}}c[n>>2]=K;if((K|0)<0){J=K}else{I=q;break L2149}}else{J=-1}}while(0);c[n>>2]=G;s=J;i=o;return s|0}}while(0);c[H>>2]=C;c[d+48>>2]=D;c[d+60>>2]=B;c[d+44>>2]=k;G=b[x>>1]|0;z=cJ(d,p,G,h+($(c[I>>2]|0,m)<<2)|0,B,1)|0;if((z|0)<0){s=z;i=o;return s|0}c[n>>2]=j;s=j;i=o;return s|0}}while(0);if(((j|0)%((c[E>>2]|0)/400&-1|0)|0)!=0){s=-1;i=o;return s|0}E=d+8|0;B=0;while(1){I=cJ(d,0,0,h+($(c[E>>2]|0,B)<<2)|0,j-B|0,0)|0;if((I|0)<0){s=I;w=1512;break}L=I+B|0;if((L|0)<(j|0)){B=L}else{break}}if((w|0)==1512){i=o;return s|0}c[d+68>>2]=L;s=L;i=o;return s|0}function cJ(a,e,f,h,j,k){a=a|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0.0,aX=0.0,aY=0,aZ=0,a_=0,a$=0;l=i;i=i+72|0;m=l|0;n=l+8|0;o=l+56|0;p=l+60|0;q=l+64|0;r=l+68|0;c[p>>2]=0;s=a;t=c[a+4>>2]|0;v=s+t|0;w=s+(c[a>>2]|0)|0;x=a+12|0;y=c[x>>2]|0;z=(y|0)/50&-1;A=z>>1;B=z>>2;C=z>>3;if((C|0)>(j|0)){D=-2;i=l;return D|0}E=((y|0)/25&-1)*3&-1;y=(E|0)>(j|0)?j:E;do{if((f|0)<2){E=c[a+60>>2]|0;F=(y|0)<(E|0)?y:E;G=1531;break}else{if((e|0)==0){F=y;G=1531;break}E=c[a+60>>2]|0;j=c[a+52>>2]|0;c[n>>2]=e;c[n+4>>2]=f;c[n+8>>2]=0;c[n+12>>2]=0;c[n+16>>2]=0;H=n+20|0;c[H>>2]=9;I=n+24|0;c[I>>2]=0;J=n+28|0;c[J>>2]=128;if((f|0)==0){K=0;L=0}else{c[I>>2]=1;K=d[e]|0;L=1}M=n+40|0;c[M>>2]=K;N=K>>>1^127;O=n+32|0;c[O>>2]=N;c[n+44>>2]=0;if(L>>>0<f>>>0){P=L+1|0;c[I>>2]=P;Q=d[e+L|0]|0;R=P}else{Q=0;R=L}if(R>>>0<f>>>0){P=R+1|0;c[I>>2]=P;S=d[e+R|0]|0;T=P}else{S=0;T=R}if(T>>>0<f>>>0){c[I>>2]=T+1|0;U=d[e+T|0]|0}else{U=0}c[H>>2]=33;c[J>>2]=-2147483648;c[M>>2]=U;c[O>>2]=((((Q|K<<8)>>>1&255|N<<8)<<8|(S|Q<<8)>>>1&255)<<8&2147483392|(U|S<<8)>>>1&255)^16777215;V=E;W=j;X=y;Z=e;_=1;break}}while(0);do{if((G|0)==1531){e=c[a+56>>2]|0;if((e|0)!=0){V=F;W=e;X=F;Z=0;_=0;break}e=a+8|0;if(($(c[e>>2]|0,F)|0)>0){aa=0}else{D=F;i=l;return D|0}while(1){g[h+(aa<<2)>>2]=0.0;y=aa+1|0;if((y|0)<($(c[e>>2]|0,F)|0)){aa=y}else{D=F;break}}i=l;return D|0}}while(0);F=(Z|0)==0;aa=(W|0)==1e3;if(aa|F^1){ab=X}else{ab=(X|0)<(z|0)?X:z}do{if(_){X=c[a+56>>2]|0;if((X|0)<=0){G=1541;break}e=(W|0)==1002;y=(X|0)==1002;do{if(y|e^1){G=1540}else{if((c[a+64>>2]|0)==0){break}else{G=1540;break}}}while(0);if((G|0)==1540){if(e|y^1){G=1541;break}}X=$(c[a+8>>2]|0,B);S=e?0:X;U=at()|0;Q=i;i=i+((e?X:0)*4&-1)|0;i=i+3>>2<<2;if(!e){ac=1;ad=S;ae=U;af=Q;break}cJ(a,0,0,Q,(B|0)<(V|0)?B:V,0);ac=1;ad=S;ae=U;af=Q;break}else{G=1541}}while(0);if((G|0)==1541){ac=0;ad=0;ae=at()|0;af=m|0}L2220:do{if((V|0)>(ab|0)){ag=-1}else{G=(W|0)!=1002;L2222:do{if(G){Q=a+8|0;U=$(c[Q>>2]|0,(A|0)>(V|0)?A:V);S=i;i=i+(U*2&-1)|0;i=i+3>>2<<2;if((c[a+56>>2]|0)==1002){dF(v|0,0,4252);c[s+(t+2376|0)>>2]=1;c[v>>2]=65536;c[s+(t+4148|0)>>2]=0;c[s+(t+4152|0)>>2]=3176576;c[s+(t+4168|0)>>2]=0;c[s+(t+4240|0)>>2]=65536;c[s+(t+4244|0)>>2]=65536;c[s+(t+4256|0)>>2]=20;c[s+(t+4252|0)>>2]=2;U=s+(t+4260|0)|0;dF(U|0,0,4252);c[s+(t+6636|0)>>2]=1;c[U>>2]=65536;c[s+(t+8408|0)>>2]=0;c[s+(t+8412|0)>>2]=3176576;c[s+(t+8428|0)>>2]=0;c[s+(t+8500|0)>>2]=65536;c[s+(t+8504|0)>>2]=65536;c[s+(t+8516|0)>>2]=20;c[s+(t+8512|0)>>2]=2;dF(s+(t+8520|0)|0,0,12);c[s+(t+8540|0)>>2]=0}U=(V*1e3&-1|0)/(c[x>>2]|0)&-1;X=a+16|0;c[a+32>>2]=(U|0)<10?10:U;do{if(_){c[a+20>>2]=c[a+44>>2]|0;if(!aa){c[a+28>>2]=16e3;break}U=c[a+48>>2]|0;if((U|0)==1101){c[a+28>>2]=8e3;break}else if((U|0)==1102){c[a+28>>2]=12e3;break}else{c[a+28>>2]=16e3;break}}}while(0);U=F?1:k<<1;K=(U|0)==0;T=S;R=0;while(1){L2240:do{if((b1(v,X,U,(R|0)==0&1,n,T,o)|0)==0){ah=c[Q>>2]|0}else{if(K){ag=-4;break L2220}c[o>>2]=V;L=c[Q>>2]|0;if(($(L,V)|0)>0){ai=0}else{ah=L;break}while(1){b[T+(ai<<1)>>1]=0;L=ai+1|0;j=c[Q>>2]|0;if((L|0)<($(j,V)|0)){ai=L}else{ah=j;break L2240}}}}while(0);j=c[o>>2]|0;L=T+($(ah,j)<<1)|0;E=j+R|0;if((E|0)<(V|0)){T=L;R=E}else{aj=S;break L2222}}}else{aj=m}}while(0);e=(k|0)!=0;do{if(e){ak=f;al=0;am=0;an=0}else{if(!G){ak=f;al=0;am=0;an=0;break}if(!_){ak=f;al=0;am=0;an=0;break}y=n+20|0;S=c[y>>2]|0;R=n+28|0;T=c[R>>2]|0;Q=dG(T|0)|-32;if((((S+17|0)+Q|0)+(-((c[a+52>>2]|0)==1001&1)&20)|0)>(f<<3|0)){ak=f;al=0;am=0;an=0;break}Q=(W|0)==1001;K=n+32|0;U=c[K>>2]|0;if(Q){X=T>>>12;E=U>>>0<X>>>0;L=E&1;if(E){c[R>>2]=X;ao=U;ap=X}else{j=U-X|0;c[K>>2]=j;N=T-X|0;c[R>>2]=N;if(N>>>0<8388609){ao=j;ap=N}else{ak=f;al=0;am=0;an=0;break}}N=n+40|0;j=n+24|0;X=n|0;O=c[n+4>>2]|0;M=S;J=ap;H=c[N>>2]|0;I=c[j>>2]|0;P=ao;while(1){aq=M+8|0;c[y>>2]=aq;ar=J<<8;c[R>>2]=ar;if(I>>>0<O>>>0){as=I+1|0;c[j>>2]=as;av=d[(c[X>>2]|0)+I|0]|0;aw=as}else{av=0;aw=I}c[N>>2]=av;ax=((av|H<<8)>>>1&255|P<<8&2147483392)^255;c[K>>2]=ax;if(ar>>>0<8388609){M=aq;J=ar;H=av;I=aw;P=ax}else{break}}if(E){ay=L;az=ar;aA=aq;aB=ax}else{ak=f;al=0;am=0;an=0;break}}else{ay=1;az=T;aA=S;aB=U}P=n+32|0;I=az>>>1;H=aB>>>0<I>>>0;J=H&1;if(H){aC=I;aD=aB}else{H=aB-I|0;c[P>>2]=H;aC=az-I|0;aD=H}c[R>>2]=aC;L2269:do{if(aC>>>0<8388609){H=n+40|0;I=n+24|0;M=n|0;K=c[n+4>>2]|0;N=aA;X=aC;j=c[H>>2]|0;O=c[I>>2]|0;as=aD;while(1){aE=N+8|0;c[y>>2]=aE;aF=X<<8;c[R>>2]=aF;if(O>>>0<K>>>0){aG=O+1|0;c[I>>2]=aG;aH=d[(c[M>>2]|0)+O|0]|0;aI=aG}else{aH=0;aI=O}c[H>>2]=aH;aG=((aH|j<<8)>>>1&255|as<<8&2147483392)^255;c[P>>2]=aG;if(aF>>>0<8388609){N=aE;X=aF;j=aH;O=aI;as=aG}else{aJ=aE;aK=aF;break L2269}}}else{aJ=aA;aK=aC}}while(0);if(Q){P=(bt(n,256)|0)+2|0;aL=P;aM=c[y>>2]|0;aN=c[R>>2]|0}else{aL=f-((aJ+7|0)+(dG(aK|0)|-32)>>3)|0;aM=aJ;aN=aK}P=f-aL|0;U=(P<<3|0)<((dG(aN|0)|-32)+aM|0);S=U?0:aL;T=n+4|0;c[T>>2]=(c[T>>2]|0)-S|0;ak=U?0:P;al=J;am=S;an=U?0:ay}}while(0);U=G?17:0;S=c[a+48>>2]|0;if((S|0)==1101){aO=13}else if((S|0)==1102|(S|0)==1103){aO=17}else if((S|0)==1104){aO=19}else{aO=21}bp(w,10012,(u=i,i=i+4|0,c[u>>2]=aO,u)|0);bp(w,10008,(u=i,i=i+4|0,c[u>>2]=c[a+44>>2]|0,u)|0);S=(an|0)!=0;P=i;i=i+((S?0:ad)*4&-1)|0;i=i+3>>2<<2;T=(ac|0)!=0;L=T&(S^1);if(S|T^1|G^1){aP=af}else{T=(B|0)<(V|0)?B:V;cJ(a,0,0,P,T,0);aP=P}do{if(S){P=$(c[a+8>>2]|0,B);T=i;i=i+(P*4&-1)|0;i=i+3>>2<<2;if((al|0)==0){aQ=T;aR=1;aS=1;break}bp(w,10010,(u=i,i=i+4|0,c[u>>2]=0,u)|0);bn(w,Z+ak|0,am,T,B,0);bp(w,4031,(u=i,i=i+4|0,c[u>>2]=p,u)|0);aQ=T;aR=0;aS=0}else{aQ=m|0;aR=(al|0)==0;aS=1}}while(0);bp(w,10010,(u=i,i=i+4|0,c[u>>2]=U,u)|0);do{if(aa){b[q>>1]=-1;T=a+8|0;L2302:do{if(($(c[T>>2]|0,V)|0)>0){P=0;while(1){g[h+(P<<2)>>2]=0.0;E=P+1|0;if((E|0)<($(c[T>>2]|0,V)|0)){P=E}else{break L2302}}}}while(0);if((c[a+56>>2]|0)!=1001){aT=0;aU=aS;break}if(!aS){if((c[a+64>>2]|0)!=0){aT=0;aU=0;break}}bp(w,10010,(u=i,i=i+4|0,c[u>>2]=0,u)|0);bn(w,q,2,h,C,0);aT=0;aU=aS}else{T=(z|0)<(V|0)?z:V;J=c[a+56>>2]|0;do{if((W|0)!=(J|0)&(J|0)>0){if((c[a+64>>2]|0)!=0){break}bp(w,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0)}}while(0);aT=bn(w,e?0:Z,ak,h,T,n)|0;aU=aS}}while(0);L2311:do{if(G){e=a+8|0;if(($(c[e>>2]|0,V)|0)>0){aV=0}else{break}while(1){U=h+(aV<<2)|0;g[U>>2]=+g[U>>2]+ +(b[aj+(aV<<1)>>1]|0|0)*30517578125.0e-15;U=aV+1|0;if((U|0)<($(c[e>>2]|0,V)|0)){aV=U}else{break L2311}}}}while(0);bp(w,10015,(u=i,i=i+4|0,c[u>>2]=r,u)|0);G=c[(c[r>>2]|0)+60>>2]|0;e=S&aR;L2316:do{if(e){bp(w,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);bp(w,10010,(u=i,i=i+4|0,c[u>>2]=0,u)|0);T=Z+ak|0;bn(w,T,am,aQ,B,0);bp(w,4031,(u=i,i=i+4|0,c[u>>2]=p,u)|0);T=c[a+8>>2]|0;U=$(T,V-C|0);J=$(T,C);R=48e3/(c[x>>2]|0)&-1;if((T|0)<=0){break}y=(C|0)>0;Q=0;while(1){L2321:do{if(y){P=0;while(1){aW=+g[G+($(P,R)<<2)>>2];aX=aW*aW;E=$(P,T)+Q|0;as=h+(E+U<<2)|0;g[as>>2]=aX*+g[aQ+(E+J<<2)>>2]+(1.0-aX)*+g[as>>2];as=P+1|0;if((as|0)==(C|0)){break L2321}else{P=as}}}}while(0);P=Q+1|0;if((P|0)==(T|0)){break L2316}else{Q=P}}}}while(0);L2326:do{if(!aU){S=a+8|0;Q=c[S>>2]|0;if((Q|0)<=0){break}T=(C|0)>0;J=0;U=Q;while(1){L2331:do{if(T){Q=0;R=U;while(1){y=$(R,Q)+J|0;g[h+(y<<2)>>2]=+g[aQ+(y<<2)>>2];y=Q+1|0;P=c[S>>2]|0;if((y|0)==(C|0)){aY=P;break L2331}else{Q=y;R=P}}}else{aY=U}}while(0);R=J+1|0;if((R|0)<(aY|0)){J=R;U=aY}else{break}}U=$(aY,C);J=48e3/(c[x>>2]|0)&-1;if((aY|0)<=0){break}S=(C|0)>0;T=0;while(1){L2339:do{if(S){R=0;while(1){aX=+g[G+($(R,J)<<2)>>2];aW=aX*aX;Q=($(R,aY)+T|0)+U|0;P=h+(Q<<2)|0;g[P>>2]=aW*+g[P>>2]+(1.0-aW)*+g[aQ+(Q<<2)>>2];Q=R+1|0;if((Q|0)==(C|0)){break L2339}else{R=Q}}}}while(0);R=T+1|0;if((R|0)==(aY|0)){break L2326}else{T=R}}}}while(0);L2344:do{if(L){T=a+8|0;U=c[T>>2]|0;if((V|0)<(B|0)){J=48e3/(c[x>>2]|0)&-1;if((U|0)<=0){break}S=(C|0)>0;R=0;while(1){L2351:do{if(S){Q=0;while(1){aW=+g[G+($(Q,J)<<2)>>2];aX=aW*aW;P=$(Q,U)+R|0;y=h+(P<<2)|0;g[y>>2]=aX*+g[y>>2]+(1.0-aX)*+g[aP+(P<<2)>>2];P=Q+1|0;if((P|0)==(C|0)){break L2351}else{Q=P}}}}while(0);Q=R+1|0;if((Q|0)==(U|0)){break L2344}else{R=Q}}}R=$(U,C);L2356:do{if((R|0)>0){J=0;while(1){g[h+(J<<2)>>2]=+g[aP+(J<<2)>>2];S=J+1|0;Q=c[T>>2]|0;P=$(Q,C);if((S|0)<(P|0)){J=S}else{aZ=Q;a_=P;break L2356}}}else{aZ=U;a_=R}}while(0);R=48e3/(c[x>>2]|0)&-1;if((aZ|0)<=0){break}U=(C|0)>0;T=0;while(1){L2363:do{if(U){J=0;while(1){aX=+g[G+($(J,R)<<2)>>2];aW=aX*aX;P=($(J,aZ)+T|0)+a_|0;Q=h+(P<<2)|0;g[Q>>2]=aW*+g[Q>>2]+(1.0-aW)*+g[aP+(P<<2)>>2];P=J+1|0;if((P|0)==(C|0)){break L2363}else{J=P}}}}while(0);J=T+1|0;if((J|0)==(aZ|0)){break L2344}else{T=J}}}}while(0);G=c[a+40>>2]|0;L2368:do{if((G|0)!=0){aW=+Y(+(+(G|0)*.0006488140788860619*.6931471805599453));L=a+8|0;if(($(c[L>>2]|0,V)|0)>0){a$=0}else{break}while(1){T=h+(a$<<2)|0;g[T>>2]=aW*+g[T>>2];T=a$+1|0;if((T|0)<($(c[L>>2]|0,V)|0)){a$=T}else{break L2368}}}}while(0);if((ak|0)<2){c[a+80>>2]=0}else{c[a+80>>2]=c[p>>2]^c[n+28>>2]}c[a+56>>2]=W;c[a+64>>2]=e&1;ag=(aT|0)<0?aT:V}}while(0);au(ae|0);D=ag;i=l;return D|0}function cK(a){a=a|0;var b=0;b=d[a]|0;if((b&128|0)!=0){a=b>>>5&3;return((a|0)==0?1101:a+1102|0)|0}if((b&96|0)==96){a=b>>>4&1|1104;return a|0}else{a=(b>>>5&3)+1101|0;return a|0}return 0}function cL(a,b){a=a|0;b=b|0;var c=0,e=0;c=d[a]|0;do{if((c&128|0)==0){if((c&96|0)==96){if((c&8|0)==0){e=(b|0)/100&-1;break}else{e=(b|0)/50&-1;break}}else{a=c>>>3&3;if((a|0)==3){e=(b*60&-1|0)/1e3&-1;break}else{e=(b<<a|0)/100&-1;break}}}else{e=(b<<(c>>>3&3)|0)/400&-1}}while(0);return e|0}function cM(b){b=b|0;return((a[b]&4)<<24>>24!=0?2:1)|0}function cN(a){a=a|0;var b=0;if((a-1|0)>>>0>1){b=0;return b|0}b=(a*4828&-1)+43748|0;return b|0}function cO(b,c){b=b|0;c=c|0;var d=0,e=0;do{if((c|0)<1){d=-1}else{e=a[b]&3;if((e|0)==0){d=1;break}else if((e|0)!=3){d=2;break}if((c|0)<2){d=-4;break}d=a[b+1|0]&63}}while(0);return d|0}function cP(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;if((c|0)<1){f=-1;return f|0}g=d[b]|0;h=g&3;do{if((h|0)==3){if((c|0)<2){f=-4;return f|0}else{i=a[b+1|0]&63;break}}else if((h|0)==0){i=1}else{i=2}}while(0);do{if((g&128|0)==0){if((g&96|0)==96){if((g&8|0)==0){j=(e|0)/100&-1;break}else{j=(e|0)/50&-1;break}}else{h=g>>>3&3;if((h|0)==3){j=(e*60&-1|0)/1e3&-1;break}else{j=(e<<h|0)/100&-1;break}}}else{j=(e<<(g>>>3&3)|0)/400&-1}}while(0);g=$(j,i);f=(g*25&-1|0)>(e*3&-1|0)?-4:g;return f|0}function cQ(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[b+12>>2]|0;if((f|0)<1){h=-1;return h|0}b=d[e]|0;i=b&3;do{if((i|0)==0){j=1}else if((i|0)==3){if((f|0)<2){h=-4;return h|0}else{j=a[e+1|0]&63;break}}else{j=2}}while(0);do{if((b&128|0)==0){if((b&96|0)==96){if((b&8|0)==0){k=(g|0)/100&-1;break}else{k=(g|0)/50&-1;break}}else{e=b>>>3&3;if((e|0)==3){k=(g*60&-1|0)/1e3&-1;break}else{k=(g<<e|0)/100&-1;break}}}else{k=(g<<(b>>>3&3)|0)/400&-1}}while(0);b=$(k,j);h=(b*25&-1|0)>(g*3&-1|0)?-4:b;return h|0}function cR(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,h=0,i=0,j=0,k=0.0;f=a;a=(c|0)>0;L2467:do{if(a){h=0;while(1){g[b+(h<<2)>>2]=+g[f+($(h+d|0,e)<<2)>>2];i=h+1|0;if((i|0)==(c|0)){break L2467}else{h=i}}}}while(0);if((e|0)>1){j=1}else{return}while(1){L2475:do{if(a){h=0;while(1){k=+g[f+($(h+d|0,e)+j<<2)>>2];i=b+(h<<2)|0;g[i>>2]=k+ +g[i>>2];i=h+1|0;if((i|0)==(c|0)){break L2475}else{h=i}}}}while(0);h=j+1|0;if((h|0)==(e|0)){break}else{j=h}}return}function cS(a,c,d,e,f){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0.0,l=0,m=0;h=a;a=(d|0)>0;L2481:do{if(a){i=0;while(1){g[c+(i<<2)>>2]=+(b[h+($(i+e|0,f)<<1)>>1]|0|0);j=i+1|0;if((j|0)==(d|0)){break L2481}else{i=j}}}}while(0);L2485:do{if((f|0)>1){i=1;while(1){L2488:do{if(a){j=0;while(1){k=+(b[h+($(j+e|0,f)+i<<1)>>1]|0|0);l=c+(j<<2)|0;g[l>>2]=+g[l>>2]+k;l=j+1|0;if((l|0)==(d|0)){break L2488}else{j=l}}}}while(0);j=i+1|0;if((j|0)==(f|0)){break L2485}else{i=j}}}}while(0);if(a){m=0}else{return}while(1){a=c+(m<<2)|0;g[a>>2]=+g[a>>2]*30517578125.0e-15;a=m+1|0;if((a|0)==(d|0)){break}else{m=a}}return}function cT(a,d,e,f,h,j){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0.0;k=i;if((h|0)<0){l=-1;i=k;return l|0}m=a+8|0;n=$(c[m>>2]|0,h);o=at()|0;p=i;i=i+(n*4&-1)|0;i=i+3>>2<<2;n=cI(a,d,e,p,h,j,0,0,1)|0;L2502:do{if((n|0)>0){if(($(c[m>>2]|0,n)|0)>0){q=0}else{break}while(1){r=+g[p+(q<<2)>>2]*32768.0;s=r>-32768.0?r:-32768.0;b[f+(q<<1)>>1]=aq(+(s<32767.0?s:32767.0))&65535;j=q+1|0;if((j|0)<($(c[m>>2]|0,n)|0)){q=j}else{break L2502}}}}while(0);au(o|0);l=n;i=k;return l|0}function cU(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return cI(a,b,c,d,e,f,0,0,0)|0}function cV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+4|0;f=e|0;g=a;h=c[a+4>>2]|0;j=g+(c[a>>2]|0)|0;c[f>>2]=d;if((b|0)==4045){d=c[f>>2]|0;c[f>>2]=d+4|0;k=c[d>>2]|0;if((k|0)==0){l=-1;i=e;return l|0}c[k>>2]=c[a+40>>2]|0;l=0;i=e;return l|0}else if((b|0)==4009){k=c[f>>2]|0;c[f>>2]=k+4|0;c[c[k>>2]>>2]=c[a+48>>2]|0;l=0;i=e;return l|0}else if((b|0)==4034){k=c[f>>2]|0;c[f>>2]=k+4|0;d=c[k>>2]|0;if((d+32768|0)>>>0>65535){l=-1;i=e;return l|0}c[a+40>>2]=d;l=0;i=e;return l|0}else if((b|0)==4029){d=c[f>>2]|0;c[f>>2]=d+4|0;k=c[d>>2]|0;if((k|0)==0){l=-1;i=e;return l|0}c[k>>2]=c[a+12>>2]|0;l=0;i=e;return l|0}else if((b|0)==4028){k=g+h|0;d=a+44|0;dF(d|0,0,40);bp(j,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);dF(k|0,0,4252);c[g+(h+2376|0)>>2]=1;c[k>>2]=65536;c[g+(h+4148|0)>>2]=0;c[g+(h+4152|0)>>2]=3176576;c[g+(h+4168|0)>>2]=0;c[g+(h+4240|0)>>2]=65536;c[g+(h+4244|0)>>2]=65536;c[g+(h+4256|0)>>2]=20;c[g+(h+4252|0)>>2]=2;k=g+(h+4260|0)|0;dF(k|0,0,4252);c[g+(h+6636|0)>>2]=1;c[k>>2]=65536;c[g+(h+8408|0)>>2]=0;c[g+(h+8412|0)>>2]=3176576;c[g+(h+8428|0)>>2]=0;c[g+(h+8500|0)>>2]=65536;c[g+(h+8504|0)>>2]=65536;c[g+(h+8516|0)>>2]=20;c[g+(h+8512|0)>>2]=2;dF(g+(h+8520|0)|0,0,12);c[g+(h+8540|0)>>2]=0;c[d>>2]=c[a+8>>2]|0;c[a+60>>2]=(c[a+12>>2]|0)/400&-1;l=0;i=e;return l|0}else if((b|0)==4033){d=c[f>>2]|0;c[f>>2]=d+4|0;h=c[d>>2]|0;if((h|0)==0){l=-1;i=e;return l|0}if((c[a+56>>2]|0)==1002){bp(j,4033,(u=i,i=i+4|0,c[u>>2]=h,u)|0);l=0;i=e;return l|0}else{c[h>>2]=c[a+36>>2]|0;l=0;i=e;return l|0}}else if((b|0)==4031){h=c[f>>2]|0;c[f>>2]=h+4|0;c[c[h>>2]>>2]=c[a+80>>2]|0;l=0;i=e;return l|0}else if((b|0)==4039){b=c[f>>2]|0;c[f>>2]=b+4|0;c[c[b>>2]>>2]=c[a+68>>2]|0;l=0;i=e;return l|0}else{l=-5;i=e;return l|0}return 0}function cW(a){a=a|0;dD(a);return}function cX(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;if(!((d|0)==48e3|(d|0)==24e3|(d|0)==16e3|(d|0)==12e3|(d|0)==8e3)){j=-1;i=h;return j|0}if((e-1|0)>>>0>1){j=-1;i=h;return j|0}if((f-2048|0)>>>0>1&(f|0)!=2051){j=-1;i=h;return j|0}k=e*4828&-1;dF(a|0,0,k+43748|0);c[a+4>>2]=19008;c[a>>2]=43556;l=a+43556|0;m=l;c[a+96>>2]=e;c[a+160>>2]=e;n=a+128|0;c[n>>2]=d;o=a+8|0;b2(a+19008|0,o);c[o>>2]=e;c[a+12>>2]=e;c[a+16>>2]=c[n>>2]|0;c[a+20>>2]=16e3;c[a+24>>2]=8e3;c[a+28>>2]=16e3;c[a+32>>2]=20;c[a+36>>2]=25e3;c[a+40>>2]=0;c[a+44>>2]=10;c[a+48>>2]=0;c[a+52>>2]=0;c[a+56>>2]=0;if(e>>>0>2|(l|0)==0){j=-3;i=h;return j|0}dF(l|0,0,k+192|0);c[l>>2]=5251160;c[a+43560>>2]=120;c[a+43564>>2]=e;c[a+43568>>2]=e;l=a+43588|0;c[l>>2]=1;c[a+43592>>2]=0;c[a+43596>>2]=21;c[a+43608>>2]=1;c[a+43612>>2]=1;c[a+43576>>2]=1;c[a+43600>>2]=-1;c[a+43604>>2]=0;c[a+43572>>2]=0;c[a+43584>>2]=5;c[a+43620>>2]=24;bm(m,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);if((d|0)==12e3){p=4}else if((d|0)==24e3){p=2}else if((d|0)==48e3){p=1}else if((d|0)==16e3){p=3}else if((d|0)==8e3){p=6}else{p=0}c[l>>2]=p;bm(m,10016,(u=i,i=i+4|0,c[u>>2]=0,u)|0);bm(m,4010,(u=i,i=i+4|0,c[u>>2]=10,u)|0);c[a+132>>2]=1;c[a+136>>2]=1;c[a+148>>2]=-1e3;c[a+144>>2]=$(e,d)+3e3|0;c[a+92>>2]=f;c[a+108>>2]=-1e3;c[a+112>>2]=-1e3;c[a+116>>2]=1105;c[a+104>>2]=-1e3;c[a+120>>2]=-1e3;c[a+124>>2]=-1;f=c[n>>2]|0;c[a+156>>2]=(f|0)/100&-1;c[a+152>>2]=24;c[a+140>>2]=5e3;c[a+100>>2]=(f|0)/250&-1;b[a+164>>1]=16384;g[a+172>>2]=1.0;c[a+168>>2]=193536;c[a+216>>2]=1;c[a+192>>2]=1001;c[a+208>>2]=1105;j=0;i=h;return j|0}function cY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;do{if((a|0)==48e3|(a|0)==24e3|(a|0)==16e3|(a|0)==12e3|(a|0)==8e3){if((b-1|0)>>>0>1){break}if((d-2048|0)>>>0>1&(d|0)!=2051){break}f=dC((b*4828&-1)+43748|0)|0;g=f;if((f|0)==0){if((e|0)==0){h=0;return h|0}c[e>>2]=-7;h=0;return h|0}i=cX(g,a,b,d)|0;if((e|0)!=0){c[e>>2]=i}if((i|0)==0){h=g;return h|0}dD(f);h=0;return h|0}}while(0);if((e|0)==0){h=0;return h|0}c[e>>2]=-1;h=0;return h|0}function cZ(a,b,d,e,f,h,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=+h;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0,L=0,M=0.0,N=0.0,O=0.0,Q=0.0,R=0,S=0.0,T=0.0,U=0.0,V=0.0,W=0;m=i;i=i+3292|0;n=m|0;o=m+1536|0;p=m+3072|0;q=m+3184|0;r=(e|0)/400&-1;s=i;i=i+(r*4&-1)|0;i=i+3>>2<<2;t=+g[j>>2];g[p>>2]=t;g[q>>2]=1.0/(t+1.0000000036274937e-15);u=(k|0)!=0;if(u){v=(r<<1)-k|0;k=a+($(v,d)<<2)|0;t=+g[j+4>>2];g[p+4>>2]=t;g[q+4>>2]=1.0/(t+1.0000000036274937e-15);t=+g[j+8>>2];g[p+8>>2]=t;g[q+8>>2]=1.0/(t+1.0000000036274937e-15);w=k;x=b-v|0;y=3}else{w=a;x=b;y=1}b=(x|0)/(r|0)&-1;x=(b|0)<24?b:24;L2594:do{if((x|0)>0){a=w;v=(e|0)>399;k=(b|0)<24?b:24;t=+g[w>>2];z=0;while(1){A=$(z,r);aL[l&15](a,s,r,A,d);B=+g[s>>2];C=(z|0)==0?B:t;L2598:do{if(v){D=C;E=1.0000000036274937e-15;A=1;F=B;while(1){G=F-D;H=E+G*G;if((A|0)>=(r|0)){I=F;J=H;break L2598}G=+g[s+(A<<2)>>2];D=F;E=H;A=A+1|0;F=G}}else{I=C;J=1.0000000036274937e-15}}while(0);A=z+y|0;g[p+(A<<2)>>2]=J;g[q+(A<<2)>>2]=1.0/J;A=z+1|0;if((A|0)==(k|0)){K=k;break L2594}else{t=I;z=A}}}else{K=0}}while(0);s=K+y|0;g[p+(s<<2)>>2]=+g[p+(s-1<<2)>>2];if(u){s=x+2|0;L=(s|0)>24?24:s}else{L=x}x=~~(+((d*60&-1)+40|0)*(h*.5+1.0));d=(f|0)/400&-1;s=o;do{if((f|0)<32e3){M=0.0}else{if((f|0)>64399){M=1.0;break}M=(+(d|0)+-80.0)/80.0}}while(0);dF(s|0,-1|0,64);g[n>>2]=1.0e10;g[n+4>>2]=1.0e10;g[n+8>>2]=1.0e10;g[n+12>>2]=1.0e10;g[n+16>>2]=1.0e10;g[n+20>>2]=1.0e10;g[n+24>>2]=1.0e10;g[n+28>>2]=1.0e10;g[n+32>>2]=1.0e10;g[n+36>>2]=1.0e10;g[n+40>>2]=1.0e10;g[n+44>>2]=1.0e10;g[n+48>>2]=1.0e10;g[n+52>>2]=1.0e10;g[n+56>>2]=1.0e10;g[n+60>>2]=1.0e10;s=L+1|0;f=-2-L|0;y=0;while(1){K=1<<y;h=+((d<<y)+x|0);r=K+1|0;l=(r|0)>(s|0)?s:r;L2613:do{if((l|0)>0){r=-2-K|0;w=((r|0)<(f|0)?f:r)^-1;I=0.0;J=0.0;r=0;while(1){t=I+ +g[p+(r<<2)>>2];C=J+ +g[q+(r<<2)>>2];b=r+1|0;if((b|0)==(w|0)){N=t;O=C;break L2613}else{I=t;J=C;r=b}}}else{N=0.0;O=0.0}}while(0);J=(O*N/+($(l,l)|0)+-2.0)*.05;I=+P(+(J<0.0?0.0:J));if(I>1.0){Q=1.0}else{Q=I}g[n+(K<<2)>>2]=h*(M*Q+1.0);c[o+(K<<2)>>2]=y;r=y+1|0;if((r|0)==4){break}else{y=r}}L2622:do{if((L|0)>1){y=1;while(1){f=y-1|0;s=n+(f<<6)+4|0;Q=+g[s>>2];g[n+(y<<6)+8>>2]=Q;c[o+(y<<6)+8>>2]=1;g[n+(y<<6)+12>>2]=+g[n+(f<<6)+8>>2];c[o+(y<<6)+12>>2]=2;g[n+(y<<6)+16>>2]=+g[n+(f<<6)+12>>2];c[o+(y<<6)+16>>2]=3;g[n+(y<<6)+20>>2]=+g[n+(f<<6)+16>>2];c[o+(y<<6)+20>>2]=4;g[n+(y<<6)+24>>2]=+g[n+(f<<6)+20>>2];c[o+(y<<6)+24>>2]=5;g[n+(y<<6)+28>>2]=+g[n+(f<<6)+24>>2];c[o+(y<<6)+28>>2]=6;g[n+(y<<6)+32>>2]=+g[n+(f<<6)+28>>2];c[o+(y<<6)+32>>2]=7;g[n+(y<<6)+36>>2]=+g[n+(f<<6)+32>>2];c[o+(y<<6)+36>>2]=8;g[n+(y<<6)+40>>2]=+g[n+(f<<6)+36>>2];c[o+(y<<6)+40>>2]=9;g[n+(y<<6)+44>>2]=+g[n+(f<<6)+40>>2];c[o+(y<<6)+44>>2]=10;g[n+(y<<6)+48>>2]=+g[n+(f<<6)+44>>2];c[o+(y<<6)+48>>2]=11;g[n+(y<<6)+52>>2]=+g[n+(f<<6)+48>>2];c[o+(y<<6)+52>>2]=12;g[n+(y<<6)+56>>2]=+g[n+(f<<6)+52>>2];c[o+(y<<6)+56>>2]=13;g[n+(y<<6)+60>>2]=+g[n+(f<<6)+56>>2];c[o+(y<<6)+60>>2]=14;r=L-y|0;w=r+1|0;b=-2-r|0;N=+(r|0);e=0;O=Q;while(1){z=1<<e;Q=O;k=1;v=1;L2627:while(1){a=k;while(1){if((a|0)>=4){break L2627}A=a+1|0;R=(1<<A)-1|0;I=+g[n+(f<<6)+(R<<2)>>2];if(I<Q){Q=I;k=A;v=R;continue L2627}else{a=A}}}c[o+(y<<6)+(z<<2)>>2]=v;I=+((d<<e)+x|0);k=z+1|0;a=(k|0)>(w|0)?w:k;L2633:do{if((a|0)>0){k=-2-z|0;A=((k|0)<(b|0)?b:k)^-1;J=0.0;C=0.0;k=0;while(1){R=k+y|0;t=J+ +g[p+(R<<2)>>2];B=C+ +g[q+(R<<2)>>2];R=k+1|0;if((R|0)==(A|0)){S=t;T=B;break L2633}else{J=t;C=B;k=R}}}else{S=0.0;T=0.0}}while(0);C=(T*S/+($(a,a)|0)+-2.0)*.05;J=+P(+(C<0.0?0.0:C));if(J>1.0){U=1.0}else{U=J}J=I*(M*U+1.0);v=n+(y<<6)+(z<<2)|0;g[v>>2]=Q;if((r|0)<(z|0)){V=N*J/+(z|0)}else{V=J}g[v>>2]=Q+V;v=e+1|0;if((v|0)==4){break}e=v;O=+g[s>>2]}s=y+1|0;if((s|0)==(L|0)){break L2622}else{y=s}}}}while(0);q=L-1|0;V=+g[n+(q<<6)+4>>2];U=+g[n+(q<<6)+8>>2];x=U<V;M=x?U:V;V=+g[n+(q<<6)+12>>2];d=V<M;U=d?V:M;M=+g[n+(q<<6)+16>>2];y=M<U;V=y?M:U;U=+g[n+(q<<6)+20>>2];K=U<V;M=K?U:V;V=+g[n+(q<<6)+24>>2];l=V<M;U=l?V:M;M=+g[n+(q<<6)+28>>2];s=M<U;V=s?M:U;U=+g[n+(q<<6)+32>>2];e=U<V;M=e?U:V;V=+g[n+(q<<6)+36>>2];r=V<M;U=r?V:M;M=+g[n+(q<<6)+40>>2];b=M<U;V=b?M:U;U=+g[n+(q<<6)+44>>2];w=U<V;M=w?U:V;V=+g[n+(q<<6)+48>>2];f=V<M;U=f?V:M;M=+g[n+(q<<6)+52>>2];v=M<U;V=v?M:U;U=+g[n+(q<<6)+56>>2];k=U<V;A=+g[n+(q<<6)+60>>2]<(k?U:V)?15:k?14:v?13:f?12:w?11:b?10:r?9:e?8:s?7:l?6:K?5:y?4:d?3:x?2:1;L2647:do{if((L|0)>0){x=A;d=q;while(1){y=c[o+(d<<6)+(x<<2)>>2]|0;if((d|0)>0){x=y;d=d-1|0}else{W=y;break L2647}}}else{W=A}}while(0);A=1<<W;g[j>>2]=+g[p+(A<<2)>>2];if(!u){i=m;return W|0}g[j+4>>2]=+g[p+(A+1<<2)>>2];g[j+8>>2]=+g[p+(A+2<<2)>>2];i=m;return W|0}function c_(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0.0,h=0.0,i=0.0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0,B=0.0,C=0.0;e=(c|0)/(b|0)&-1;f=+(e|0);h=1.0-25.0/((e|0)<50?50.0:f);L2656:do{if((b|0)>0){e=0;i=0.0;j=0.0;k=0.0;while(1){c=e<<1;l=+g[a+(c<<2)>>2];m=+g[a+((c|1)<<2)>>2];n=+g[a+((c|2)<<2)>>2];o=+g[a+((c|3)<<2)>>2];p=+g[a+((c|4)<<2)>>2];q=+g[a+((c|5)<<2)>>2];r=+g[a+((c|6)<<2)>>2];s=+g[a+((c|7)<<2)>>2];t=k+(l*l+n*n+p*p+r*r);u=j+(l*m+n*o+p*q+r*s);r=i+(m*m+o*o+q*q+s*s);c=e+4|0;if((c|0)<(b|0)){e=c;i=r;j=u;k=t}else{v=r;w=u;x=t;break L2656}}}else{v=0.0;w=0.0;x=0.0}}while(0);b=d|0;k=+g[b>>2];j=k+h*(x-k);a=d+4|0;k=+g[a>>2];x=k+h*(w-k);e=d+8|0;k=+g[e>>2];w=k+h*(v-k);k=j<0.0?0.0:j;g[b>>2]=k;j=x<0.0?0.0:x;g[a>>2]=j;x=w<0.0?0.0:w;g[e>>2]=x;if((k>x?k:x)<=.0007999999797903001){y=+g[d+16>>2];z=y*20.0;A=z>1.0;B=A?1.0:z;return+B}w=+P(+k);k=+P(+x);x=+P(+w);v=+P(+k);h=w*k;k=j<h?j:h;g[a>>2]=k;j=k/(h+1.0000000036274937e-15);h=x-v;if(h<0.0){C=-0.0-h}else{C=h}h=C/(x+1.0000000036274937e-15+v)*+P(+(1.0-j*j));a=d+12|0;j=+g[a>>2];v=j+(h-j)/f;g[a>>2]=v;a=d+16|0;j=+g[a>>2]-.019999999552965164/f;f=j>v?j:v;g[a>>2]=f;y=f;z=y*20.0;A=z>1.0;B=A?1.0:z;return+B}function c$(d,e,f,h,j,k,l){d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,O=0,P=0,Q=0.0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0.0,am=0,an=0,ao=0,ap=0,ar=0,as=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bh=0,bi=0,bj=0,bk=0,bl=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0.0,bu=0.0,bw=0.0,bz=0.0,bA=0.0,bB=0.0,bC=0.0,bD=0.0,bE=0.0,bF=0,bG=0,bH=0,bI=0,bJ=0.0,bK=0,bL=0.0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0,cr=0,cs=0,ct=0,cu=0,cv=0,cw=0,cx=0,cy=0,cz=0,cA=0,cB=0,cC=0,cD=0,cE=0,cF=0,cG=0,cH=0,cI=0,cJ=0,cK=0;m=i;i=i+464|0;n=m|0;o=m+4|0;p=m+52|0;q=m+56|0;r=m+140|0;s=m+440|0;t=m+444|0;v=m+448|0;w=m+452|0;x=m+456|0;y=m+460|0;c[p>>2]=0;z=(j|0)>1276?1276:j;A=d+19004|0;c[A>>2]=0;B=d+140|0;do{if((c[B>>2]|0)==0){C=f*400&-1;D=c[d+128>>2]|0;if((C|0)==(D|0)|(f*200&-1|0)==(D|0)|(f*100&-1|0)==(D|0)){E=D;F=C;break}G=f*50&-1;if((G|0)==(D|0)|(f*25&-1|0)==(D|0)|(G|0)==(D*3&-1|0)){E=D;F=C;break}else{H=-1}i=m;return H|0}else{E=c[d+128>>2]|0;F=f*400&-1}}while(0);C=d+128|0;if((F|0)<(E|0)|(z|0)<1){H=-1;i=m;return H|0}F=d;D=c[d+4>>2]|0;G=F+D|0;I=F+(c[d>>2]|0)|0;J=d+92|0;if((c[J>>2]|0)==2051){K=0}else{K=c[d+100>>2]|0}L=c[d+152>>2]|0;M=(L|0)>(k|0)?k:L;L=d+124|0;c[L>>2]=-1;k=d+18996|0;c[k>>2]=0;O=l|0;if((c[O>>2]|0)!=0){if((c[d+108>>2]|0)==-1e3){c[L>>2]=~~+N(+((1.0- +g[l+20>>2])*100.0+.5))}c[k>>2]=c[l+28>>2]|0}P=d+96|0;do{if((c[P>>2]|0)==2){if((c[d+104>>2]|0)==1){Q=0.0;break}Q=+c_(e,f,E,d+220|0)}else{Q=0.0}}while(0);if((f|0)==0){R=(c[C>>2]|0)/400&-1}else{R=f}E=c[d+148>>2]|0;if((E|0)==(-1|0)){S=c[C>>2]|0;T=($(z<<3,S)|0)/(R|0)&-1;U=S}else if((E|0)==(-1e3|0)){S=c[C>>2]|0;T=$(c[P>>2]|0,S)+((S*60&-1|0)/(R|0)&-1)|0;U=S}else{T=E;U=c[C>>2]|0}E=d+144|0;c[E>>2]=T;S=(U|0)/(f|0)&-1;do{if((z|0)>=3){if((T|0)<(S*24&-1|0)){break}if((S|0)<50){if(($(S,z)|0)<300|(T|0)<2400){break}}R=d+132|0;V=(c[R>>2]|0)==0;if(V){W=S<<3;X=(T+(S<<2)|0)/(W|0)&-1;Y=(X|0)<(z|0)?X:z;X=$(Y,W);c[E>>2]=X;Z=Y;_=X}else{Z=z;_=T}X=$(Z,S);Y=X<<3;W=(_+3e3|0)+(S*-60&-1)|0;aa=c[d+108>>2]|0;do{if((aa|0)==3001){ab=127}else if((aa|0)==3002){ab=0}else{ac=c[L>>2]|0;if((ac|0)<=-1){ab=(c[J>>2]|0)==2048?115:48;break}ad=(ac*327&-1)>>8;if((c[J>>2]|0)!=2049){ab=ad;break}ab=(ad|0)<115?ad:115}}while(0);aa=d+104|0;ad=c[aa>>2]|0;ac=c[P>>2]|0;ae=(ac|0)==2;af=d+160|0;do{if((ad|0)==-1e3){if(!ae){ag=1924;break}ah=(W|0)>(((c[af>>2]|0)==2?3e4:32e3)|0)?2:1;c[af>>2]=ah;ai=ah;break}else{if(!ae){ag=1924;break}c[af>>2]=ad;ai=ad;break}}while(0);if((ag|0)==1924){c[af>>2]=ac;ai=ac}ad=c[J>>2]|0;do{if((ad|0)==2051){c[d+192>>2]=1002;aj=1002;ak=d+192|0}else{ae=c[d+120>>2]|0;do{if((ae|0)==-1e3){al=1.0-Q;ah=~~(Q*2.0e4+al*2.0e4);am=($($(ab,~~(Q*36.0e3+al*64.0e3)-ah|0),ab)>>14)+ah|0;ah=(ad|0)==2048?am+8e3|0:am;am=c[d+196>>2]|0;if((am|0)==1002){an=ah-4e3|0}else{an=(am|0)>0?ah+4e3|0:ah}ah=(W|0)>=(an|0)?1002:1e3;am=d+192|0;c[am>>2]=ah;do{if((c[d+48>>2]|0)==0){ao=ah}else{if((c[d+40>>2]|0)<=(128-ab>>4|0)){ao=ah;break}c[am>>2]=1e3;ao=1e3}}while(0);if(!((c[d+52>>2]|0)!=0&(ab|0)>100)){ap=ao;ag=1937;break}c[am>>2]=1e3;ar=1e3;as=d+192|0;break}else{c[d+192>>2]=ae;ap=ae;ag=1937;break}}while(0);if((ag|0)==1937){ae=d+192|0;if((ap|0)==1002){aj=1002;ak=ae;break}else{ar=ap;as=ae}}if(((U|0)/100&-1|0)<=(f|0)){aj=ar;ak=as;break}c[as>>2]=1002;aj=1002;ak=as}}while(0);do{if((ai|0)==1){if((c[d+200>>2]|0)!=2){ag=1945;break}ad=d+64|0;if((c[ad>>2]|0)!=0|(aj|0)==1002){ag=1945;break}ac=c[d+196>>2]|0;if((ac|0)==1002){ag=1945;break}c[ad>>2]=1;c[af>>2]=2;av=ac;break}else{ag=1945}}while(0);if((ag|0)==1945){c[d+64>>2]=0;av=c[d+196>>2]|0}ac=d+196|0;do{if((av|0)>0){ad=(aj|0)!=1002;if(ad^(av|0)==1002){aw=0;ax=0;ay=0;az=aj;break}ae=ad&1;if(ad){aw=1;ax=ae;ay=0;az=aj;break}if(((U|0)/100&-1|0)>(f|0)){aw=0;ax=ae;ay=0;az=1002;break}ad=c[ac>>2]|0;c[ak>>2]=ad;aw=1;ax=ae;ay=1;az=ad}else{aw=0;ax=0;ay=0;az=aj}}while(0);ad=d+212|0;do{if((c[ad>>2]|0)==0){if((aw|0)==0){aA=0;aB=ax;aC=0;aD=0;break}else{aE=ax;aF=0;ag=1954;break}}else{c[ad>>2]=0;aE=1;aF=1;ag=1954;break}}while(0);do{if((ag|0)==1954){ae=(U|0)/200&-1;ah=($(ae,Z)|0)/(ae+f|0)&-1;ae=(ah|0)>257?257:ah;if(V){aA=ae;aB=aE;aC=1;aD=aF;break}ah=(_|0)/1600&-1;aA=(ae|0)<(ah|0)?ae:ah;aB=aE;aC=1;aD=aF}}while(0);L2765:do{if((az|0)==1002){aG=W;aH=aD;aI=1002;ag=1965}else{if((c[ac>>2]|0)==1002){b2(G,q);aJ=1;aK=c[ak>>2]|0}else{aJ=aD;aK=az}if((aK|0)==1002){aG=W;aH=aJ;aI=1002;ag=1965;break}do{if((c[d+216>>2]|0)==0){if((c[d+76>>2]|0)!=0){break}aL=aJ;aM=aK;aN=c[d+208>>2]|0;break L2765}}while(0);V=($((c[d+44>>2]|0)+45|0,W)|0)/50&-1;if((c[R>>2]|0)!=0){aG=V;aH=aJ;aI=aK;ag=1965;break}aG=V-1e3|0;aH=aJ;aI=aK;ag=1965;break}}while(0);do{if((ag|0)==1965){do{if((c[P>>2]|0)==2){if((c[aa>>2]|0)==1){ag=1967;break}else{aO=5246164;aP=5246132;break}}else{ag=1967}}while(0);if((ag|0)==1967){aO=5251128;aP=5251096}W=$(ab,ab);V=c[aO>>2]|0;ah=($(W,(c[aP>>2]|0)-V|0)>>14)+V|0;V=c[aO+4>>2]|0;ae=($(W,(c[aP+4>>2]|0)-V|0)>>14)+V|0;V=c[aO+8>>2]|0;aQ=($(W,(c[aP+8>>2]|0)-V|0)>>14)+V|0;V=c[aO+12>>2]|0;aR=($(W,(c[aP+12>>2]|0)-V|0)>>14)+V|0;V=c[aO+16>>2]|0;aS=($(W,(c[aP+16>>2]|0)-V|0)>>14)+V|0;V=c[aO+20>>2]|0;aT=($(W,(c[aP+20>>2]|0)-V|0)>>14)+V|0;V=c[aO+24>>2]|0;aU=($(W,(c[aP+24>>2]|0)-V|0)>>14)+V|0;V=c[aO+28>>2]|0;aV=($(W,(c[aP+28>>2]|0)-V|0)>>14)+V|0;V=(c[d+216>>2]|0)==0;W=d+208|0;do{if(V){if((c[W>>2]|0)<1105){aW=aV+aU|0;break}else{aW=aU-aV|0;break}}else{aW=aU}}while(0);do{if((aG|0)<(aW|0)){do{if(V){if((c[W>>2]|0)<1104){aX=aT+aS|0;break}else{aX=aS-aT|0;break}}else{aX=aS}}while(0);if((aG|0)>=(aX|0)){aY=1104;break}do{if(V){if((c[W>>2]|0)<1103){aZ=aR+aQ|0;break}else{aZ=aQ-aR|0;break}}else{aZ=aQ}}while(0);if((aG|0)>=(aZ|0)){aY=1103;break}do{if(V){if((c[W>>2]|0)<1102){a_=ae+ah|0;break}else{a_=ah-ae|0;break}}else{a_=ah}}while(0);aY=(aG|0)<(a_|0)?1101:1102}else{aY=1105}}while(0);c[W>>2]=aY;if(!V){aL=aH;aM=aI;aN=aY;break}if((aI|0)==1002){aL=aH;aM=1002;aN=aY;break}if(!((c[d+80>>2]|0)==0&aY>>>0>1103)){aL=aH;aM=aI;aN=aY;break}c[W>>2]=1103;aL=aH;aM=aI;aN=1103}}while(0);ah=d+208|0;ae=c[d+116>>2]|0;if((aN|0)>(ae|0)){c[ah>>2]=ae;a$=ae}else{a$=aN}ae=d+112|0;aQ=c[ae>>2]|0;aR=(aQ|0)==-1e3;if(aR){a0=a$}else{c[ah>>2]=aQ;a0=aQ}if((aM|0)!=1002&(Y|0)<15e3){aQ=(a0|0)<1103?a0:1103;c[ah>>2]=aQ;a1=aQ}else{a1=a0}aQ=c[C>>2]|0;do{if((aQ|0)<24001){if((a1|0)>1104){c[ah>>2]=1104;a2=1104}else{a2=a1}if((aQ|0)>=16001){a3=a2;break}if((a2|0)>1103){c[ah>>2]=1103;a4=1103}else{a4=a2}if((aQ|0)>=12001){a3=a4;break}if((a4|0)>1102){c[ah>>2]=1102;a5=1102}else{a5=a4}if(!((aQ|0)<8001&(a5|0)>1101)){a3=a5;break}c[ah>>2]=1101;a3=1101}else{a3=a1}}while(0);aQ=c[k>>2]|0;do{if(!((aQ|0)==0|aR^1)){if((aM|0)==1002){c[ah>>2]=(a3|0)<(aQ|0)?a3:aQ;break}else{aS=(aQ|0)<1103?1103:aQ;c[ah>>2]=(a3|0)<(aS|0)?a3:aS;break}}}while(0);bm(I,4036,(u=i,i=i+4|0,c[u>>2]=M,u)|0);aQ=(S|0)>50;aR=$(aQ?12e3:8e3,f);aS=c[C>>2]|0;aT=aS<<3;do{if((Z|0)<((aR|0)/(aT|0)&-1|0)){c[ak>>2]=1002;ag=2002;break}else{am=c[ak>>2]|0;if((am|0)==1002){ag=2002;break}else{a6=am;break}}}while(0);do{if((ag|0)==2002){if((c[ah>>2]|0)!=1102){a6=1002;break}c[ah>>2]=1103;a6=1002}}while(0);do{if(((aS|0)/50&-1|0)<(f|0)){if((a6|0)!=1002){aR=c[ah>>2]|0;if((aR|0)<=1103){a7=aR;a8=a6;break}}aR=((aS|0)/25&-1|0)<(f|0)?3:2;am=(j-3|0)/(aR|0)&-1;aU=(am|0)>1276?1276:am;am=$(aU,aR);aV=at()|0;a9=i;i=i+am|0;i=i+3>>2<<2;am=r+4|0;c[am>>2]=0;ba=d+120|0;bb=c[ba>>2]|0;bc=c[ae>>2]|0;bd=c[aa>>2]|0;c[ba>>2]=c[ak>>2]|0;c[ae>>2]=c[ah>>2]|0;be=c[af>>2]|0;c[aa>>2]=be;bf=d+64|0;bh=c[bf>>2]|0;if((bh|0)==0){c[d+200>>2]=be}else{c[aa>>2]=1}be=(ay|0)!=0;bi=aR-1|0;bj=0;while(1){if((bj|0)>=(aR|0)){ag=2016;break}c[bf>>2]=0;if(be&(bj|0)==(bi|0)){c[ba>>2]=1002}bk=c[C>>2]|0;bl=e+($(($(bk,c[P>>2]|0)|0)/50&-1,bj)<<2)|0;bn=a9+$(bj,aU)|0;bo=c$(d,bl,(bk|0)/50&-1,bn,aU,M,l)|0;if((bo|0)<0){bp=-3;break}if((du(r,bn,bo)|0)<0){bp=-3;break}else{bj=bj+1|0}}do{if((ag|0)==2016){bj=dv(r,0,c[am>>2]|0,h,j,0)|0;if((bj|0)<0){bp=-3;break}c[ba>>2]=bb;c[ae>>2]=bc;c[aa>>2]=bd;c[bf>>2]=bh;bp=bj}}while(0);au(aV|0);H=bp;i=m;return H|0}else{bh=c[ah>>2]|0;if(!((a6|0)==1e3&(bh|0)>1103)){a7=bh;a8=a6;break}c[ak>>2]=1001;a7=bh;a8=1001}}while(0);if((a8|0)==1001&(a7|0)<1104){c[ak>>2]=1e3}ah=Z-aA|0;aa=($(c[E>>2]|0,f)|0)/(aT|0)&-1;ae=((ah|0)<(aa|0)?ah:aa)-1|0;aa=h+1|0;ah=Z-1|0;aS=o|0;c[aS>>2]=aa;bh=o+8|0;c[bh>>2]=0;c[o+12>>2]=0;c[o+16>>2]=0;bf=o+20|0;c[bf>>2]=33;c[o+24>>2]=0;bd=o+28|0;c[bd>>2]=-2147483648;c[o+40>>2]=-1;c[o+32>>2]=0;c[o+36>>2]=0;bc=o+4|0;c[bc>>2]=ah;c[o+44>>2]=0;bb=K+f|0;ba=$(c[P>>2]|0,bb);am=at()|0;bj=i;i=i+(ba*4&-1)|0;i=i+3>>2<<2;ba=c[P>>2]|0;aU=$(ba,K);L2880:do{if((aU|0)>0){a9=(c[d+156>>2]|0)-K|0;bi=0;while(1){g[bj+(bi<<2)>>2]=+g[d+240+($(a9,ba)+bi<<2)>>2];be=bi+1|0;if((be|0)<(aU|0)){bi=be}else{break L2880}}}}while(0);aT=c[ak>>2]|0;if((aT|0)==1002){bq=193536}else{bq=c[F+(D+8|0)>>2]|0}bi=d+168|0;a9=c[bi>>2]|0;aV=bq-a9|0;be=(((aV>>16)*983&-1)+a9|0)+(((aV&65535)*983&-1)>>>16)|0;c[bi>>2]=be;bi=be>>8;if((bi|0)<0){br=0}else{aV=be>>15;be=1<<aV;a9=bi&127;if((bi|0)<2048){bs=($(a9*-174&-1,128-a9|0)>>16)+a9<<aV>>7}else{bs=$(($(a9*-174&-1,128-a9|0)>>16)+a9|0,be>>7)}br=(bs+be<<16>>16)*2471&-1}be=d+176|0;a9=c[C>>2]|0;L2895:do{if((c[J>>2]|0)==2048){aV=(br|0)/((a9|0)/1e3&-1|0)&-1;bi=aV*-471&-1;aR=bi+268435456|0;W=aR>>6;V=aR>>22;bo=aV<<16>>16;bn=$(bo,aV>>16);bk=$(bo,aV&65535)>>16;bo=((bn-8388608|0)+bk|0)+$((aV>>15)+1>>1,aV)|0;aV=bo<<16>>16;bk=$(aV,V);bn=W&65535;bl=($(aV,bn)>>16)+bk|0;bk=bl+$((bo>>15)+1>>1,W)|0;bo=W<<16>>16;bl=$(bo,V);V=$(bo,bn)>>16;al=+(bk|0)*3.725290298461914e-9;bt=+(($((aR>>21)+1>>1,W)+bl|0)+V|0)*3.725290298461914e-9;bu=+(aR|0)*3.725290298461914e-9;bw=+(-268435456-bi<<1|0)*3.725290298461914e-9;bi=(f|0)>0;L2897:do{if(bi){aR=d+180|0;V=0;bz=+g[be>>2];bA=+g[aR>>2];while(1){bB=+g[e+($(V,ba)<<2)>>2];bC=bu*bB;bD=bz+bC;bE=bw*bB+(bA-al*bD);g[be>>2]=bE;bB=bC+bt*(-0.0-bD);g[aR>>2]=bB;g[bj+($(V+K|0,ba)<<2)>>2]=bD;bl=V+1|0;if((bl|0)==(f|0)){break L2897}else{V=bl;bz=bE;bA=bB}}}}while(0);if((ba|0)!=2){bF=aT;break}V=d+184|0;if(!bi){bF=aT;break}aR=d+188|0;bl=0;bA=+g[V>>2];bz=+g[aR>>2];while(1){W=bl<<1|1;bB=+g[e+(W<<2)>>2];bE=bu*bB;bD=bA+bE;bC=bw*bB+(bz-al*bD);g[V>>2]=bC;bB=bE+bt*(-0.0-bD);g[aR>>2]=bB;g[bj+(W+aU<<2)>>2]=bD;W=bl+1|0;if((W|0)==(f|0)){bF=aT;break L2895}else{bl=W;bA=bC;bz=bB}}}else{bz=12.0/+(a9|0);if((ba|0)<=0){bF=aT;break}bl=(f|0)>0;aR=0;while(1){L2910:do{if(bl){V=aR<<1;bi=d+176+(V<<2)|0;W=d+176+((V|1)<<2)|0;V=0;bA=+g[bi>>2];bt=+g[W>>2];while(1){bk=$(V,ba)+aR|0;al=+g[e+(bk<<2)>>2]-bA;bw=bA+bz*al;g[bi>>2]=bw;bu=al-bt;al=bt+bz*bu;g[W>>2]=al;g[bj+(bk+aU<<2)>>2]=bu;bk=V+1|0;if((bk|0)==(f|0)){break L2910}else{V=bk;bA=bw;bt=al}}}}while(0);V=aR+1|0;if((V|0)==(ba|0)){break}else{aR=V}}bF=c[ak>>2]|0}}while(0);do{if((bF|0)==1002){bG=aC;bH=aB;bI=a7;bJ=1.0;ag=2102}else{ba=$(c[P>>2]|0,f);aU=at()|0;aT=i;i=i+(ba*2&-1)|0;i=i+3>>2<<2;ba=$(ae<<3,S);a9=c[ak>>2]|0;be=(a9|0)==1001;do{if(be){aR=c[af>>2]|0;bl=c[C>>2]|0;V=$((-((bl|0)==(f*100&-1|0)&1)&1e3)+5e3|0,aR);W=d+36|0;c[W>>2]=V;bi=(a7|0)==1104;bk=ba-V|0;if(bi){bK=(bk<<1|0)/3&-1}else{bK=(bk*3&-1|0)/5&-1}bk=bK+V|0;V=(ba<<2|0)/5&-1;bn=(bk|0)>(V|0)?V:bk;c[W>>2]=bn;bz=+(ba-bn|0);bt=bz/(+($(aR,bi?3e3:3600)|0)+bz);if(bt>=.8571428656578064){bL=1.0;bM=bl;bN=aR;bO=bn;break}bL=bt+.1428571492433548;bM=bl;bN=aR;bO=bn}else{c[d+36>>2]=ba;bL=1.0;bM=c[C>>2]|0;bN=c[af>>2]|0;bO=ba}}while(0);ba=d+8|0;c[d+32>>2]=(f*1e3&-1|0)/(bM|0)&-1;bn=c[P>>2]|0;c[ba>>2]=bn;c[d+12>>2]=bN;do{if((a7|0)==1101){c[d+28>>2]=8e3;bP=8e3}else{aR=d+28|0;if((a7|0)==1102){c[aR>>2]=12e3;bP=12e3;break}else{c[aR>>2]=16e3;bP=16e3;break}}}while(0);c[d+24>>2]=be?16e3:8e3;aR=d+20|0;c[aR>>2]=16e3;do{if((a9|0)==1e3){if(aQ){bQ=(X<<4|0)/3&-1}else{bQ=Y}if((bQ|0)>=13e3){break}c[aR>>2]=12e3;bl=d+28|0;bi=bP>>>0>12e3?12e3:bP;c[bl>>2]=bi;if((bQ|0)>=9600){break}c[aR>>2]=8e3;c[bl>>2]=bi>>>0>8e3?8e3:bi}}while(0);aR=(c[R>>2]|0)==0;c[d+56>>2]=aR&1;a9=ah-aA|0;bi=(a9|0)>1275?1275:a9;c[n>>2]=bi;a9=d+60|0;if(be){bR=(bi*72&-1|0)/10&-1}else{bR=bi<<3}c[a9>>2]=bR;if(aR){c[a9>>2]=(($(bO,f)|0)/(bM<<3|0)&-1)<<3;a9=bO-2e3|0;c[d+36>>2]=(a9|0)<1?1:a9}if((aL|0)==0){bS=bn}else{c[s>>2]=0;bm(I,10015,(u=i,i=i+4|0,c[u>>2]=t,u)|0);a9=c[P>>2]|0;aR=d+156|0;bi=c[C>>2]|0;bl=$(((c[aR>>2]|0)-(c[d+100>>2]|0)|0)-((bi|0)/400&-1)|0,a9);W=c[t>>2]|0;bk=c[W+60>>2]|0;V=48e3/(bi|0)&-1;bi=(c[W+4>>2]|0)/(V|0)&-1;W=(bi|0)>0;L2951:do{if((a9|0)==1){if(W){bT=0}else{break}while(1){bt=+g[bk+($(bT,V)<<2)>>2];bz=bt*bt;bo=d+240+(bT+bl<<2)|0;g[bo>>2]=+g[bo>>2]*(bz+(1.0-bz)*0.0);bo=bT+1|0;if((bo|0)==(bi|0)){break L2951}else{bT=bo}}}else{if(W){bU=0}else{break}while(1){bz=+g[bk+($(bU,V)<<2)>>2];bt=bz*bz;bz=bt+(1.0-bt)*0.0;bo=bU<<1;aV=d+240+(bo+bl<<2)|0;g[aV>>2]=+g[aV>>2]*bz;aV=d+240+((bo|1)+bl<<2)|0;g[aV>>2]=+g[aV>>2]*bz;aV=bU+1|0;if((aV|0)==(bi|0)){break L2951}else{bU=aV}}}}while(0);if((bl|0)>0){dF(d+240|0,0,bl<<2|0)}bi=c[aR>>2]|0;L2962:do{if(($(c[P>>2]|0,bi)|0)>0){V=0;while(1){bz=+g[d+240+(V<<2)>>2]*32768.0;bt=bz>-32768.0?bz:-32768.0;b[aT+(V<<1)>>1]=aq(+(bt<32767.0?bt:32767.0))&65535;bk=V+1|0;W=c[aR>>2]|0;if((bk|0)<($(c[P>>2]|0,W)|0)){V=bk}else{bV=W;break L2962}}}else{bV=bi}}while(0);b3(G,ba,aT,bV,0,s,1);bS=c[P>>2]|0}L2967:do{if(($(bS,f)|0)>0){bi=0;aR=bS;while(1){bt=+g[bj+($(aR,K)+bi<<2)>>2]*32768.0;bz=bt>-32768.0?bt:-32768.0;b[aT+(bi<<1)>>1]=aq(+(bz<32767.0?bz:32767.0))&65535;bl=bi+1|0;V=c[P>>2]|0;if((bl|0)<($(V,f)|0)){bi=bl;aR=V}else{break L2967}}}}while(0);if((b3(G,ba,aT,f,o,n,0)|0)==0){if((c[n>>2]|0)!=0){do{if((c[ak>>2]|0)==1e3){aR=c[d+72>>2]|0;if((aR|0)==12e3){bW=1102;break}else if((aR|0)==8e3){bW=1101;break}else{bW=(aR|0)==16e3?1103:a7;break}}else{bW=a7}}while(0);aT=c[d+88>>2]|0;c[d+68>>2]=aT;if((aT|0)==0){bX=aC;bY=aB}else{c[ad>>2]=1;bX=1;bY=0}au(aU|0);bG=bX;bH=bY;bI=bW;bJ=bL;ag=2102;break}c[A>>2]=0;aT=c[ak>>2]|0;ba=(c[C>>2]|0)/(f|0)&-1;aR=c[af>>2]|0;if((ba|0)<400){bi=ba;ba=0;while(1){V=bi<<1;bZ=ba+1|0;if((V|0)<400){bi=V;ba=bZ}else{break}}b_=bZ<<3}else{b_=0}if((aT|0)==1e3){b$=b_-16|(a7<<5)+96&224}else if((aT|0)==1002){ba=a7-1102|0;b$=b_|((ba|0)<0?128:ba<<5&96|128)}else{b$=a7<<4|b_+240|96}a[h]=(b$|((aR|0)==2&1)<<2)&255;b0=1}else{b0=-3}au(aU|0);b1=b0;break}}while(0);L2996:do{if((ag|0)==2102){if((bI|0)==1101){b4=13}else if((bI|0)==1102|(bI|0)==1103){b4=17}else if((bI|0)==1104){b4=19}else{b4=21}bm(I,10012,(u=i,i=i+4|0,c[u>>2]=b4,u)|0);bm(I,10008,(u=i,i=i+4|0,c[u>>2]=c[af>>2]|0,u)|0);bm(I,4002,(u=i,i=i+4|0,c[u>>2]=-1,u)|0);L3003:do{if((c[ak>>2]|0)==1e3){Y=c[P>>2]|0;X=($(c[C>>2]|0,Y)|0)/400&-1;aQ=i;i=i+(X*4&-1)|0;i=i+3>>2<<2;b5=0;b6=aQ;b7=Y}else{bm(I,4006,(u=i,i=i+4|0,c[u>>2]=0,u)|0);bm(I,10002,(u=i,i=i+4|0,c[u>>2]=2,u)|0);Y=c[ak>>2]|0;if((Y|0)==1001){aQ=c[bf>>2]|0;X=(aQ+7|0)+(dG(c[bd>>2]|0)|-32)>>3;aQ=(bG|0)==0?X:X+3|0;if((c[R>>2]|0)==0){b8=(aQ|0)>(ae|0)?aQ:ae}else{X=$(c[d+36>>2]|0,f);b8=(aQ+ae|0)-((X|0)/(c[C>>2]<<3|0)&-1)|0}X=c[P>>2]|0;aQ=c[C>>2]|0;ba=$(aQ,X);bi=(ba|0)/400&-1;V=i;i=i+(bi*4&-1)|0;i=i+3>>2<<2;b9=1001;ca=b8;cb=X;cc=aQ;cd=ba;ce=bi;cf=V}else{if((c[R>>2]|0)==0){cg=ae;ch=Y}else{do{if((c[B>>2]|0)==5010){Y=c[C>>2]|0;if(((Y|0)/50&-1|0)==(f|0)){ci=0;break}V=$(((c[af>>2]|0)*60&-1)+40|0,((Y|0)/(f|0)&-1)-50|0);if((c[O>>2]|0)==0){ci=V;break}ci=~~(+(V|0)*(+g[l+4>>2]*.5+1.0))}else{ci=0}}while(0);bm(I,4006,(u=i,i=i+4|0,c[u>>2]=1,u)|0);bm(I,4020,(u=i,i=i+4|0,c[u>>2]=c[d+136>>2]|0,u)|0);bm(I,4002,(u=i,i=i+4|0,c[u>>2]=(c[E>>2]|0)+ci|0,u)|0);cg=ah-aA|0;ch=c[ak>>2]|0}V=c[P>>2]|0;Y=c[C>>2]|0;bi=$(Y,V);ba=(bi|0)/400&-1;aQ=i;i=i+(ba*4&-1)|0;i=i+3>>2<<2;if((ch|0)==1e3){b5=cg;b6=aQ;b7=V;break}else{b9=ch;ca=cg;cb=V;cc=Y;cd=bi;ce=ba;cf=aQ}}aQ=c[ac>>2]|0;if(!((b9|0)!=(aQ|0)&(aQ|0)>0&(cd|0)>399)){b5=ca;b6=cf;b7=cb;break}aQ=(c[d+156>>2]|0)-K|0;ba=0;while(1){g[cf+(ba<<2)>>2]=+g[d+240+($(aQ+((cc|0)/-400&-1)|0,cb)+ba<<2)>>2];bi=ba+1|0;if((bi|0)<(ce|0)){ba=bi}else{b5=ca;b6=cf;b7=cb;break L3003}}}}while(0);aU=d+156|0;aR=c[aU>>2]|0;L3026:do{if(($(aR-bb|0,b7)|0)>0){aT=0;ba=b7;while(1){g[d+240+(aT<<2)>>2]=+g[d+240+($(ba,f)+aT<<2)>>2];aQ=aT+1|0;bi=c[P>>2]|0;Y=c[aU>>2]|0;if((aQ|0)<($(Y-bb|0,bi)|0)){aT=aQ;ba=bi}else{cj=aQ;ck=Y;cl=bi;break L3026}}}else{cj=0;ck=aR;cl=b7}}while(0);L3030:do{if((cj|0)<($(cl,ck)|0)){aR=cj;ba=ck;aT=cl;while(1){g[d+240+(aR<<2)>>2]=+g[bj+($(bb-ba|0,aT)+aR<<2)>>2];bi=aR+1|0;Y=c[aU>>2]|0;aQ=c[P>>2]|0;if((bi|0)<($(aQ,Y)|0)){aR=bi;ba=Y;aT=aQ}else{cm=aQ;break L3030}}}else{cm=cl}}while(0);aU=d+172|0;L3034:do{if(+g[aU>>2]<1.0|bJ<1.0){bm(I,10015,(u=i,i=i+4|0,c[u>>2]=v,u)|0);bz=+g[aU>>2];aT=c[v>>2]|0;ba=c[P>>2]|0;aR=c[aT+60>>2]|0;aQ=48e3/(c[C>>2]|0)&-1;Y=(c[aT+4>>2]|0)/(aQ|0)&-1;aT=(Y|0)>0;L3036:do{if((ba|0)==1){if(aT){cn=0}else{break}while(1){bt=+g[aR+($(cn,aQ)<<2)>>2];bA=bt*bt;bi=bj+(cn<<2)|0;g[bi>>2]=+g[bi>>2]*(bJ*bA+bz*(1.0-bA));bi=cn+1|0;if((bi|0)==(Y|0)){break L3036}else{cn=bi}}}else{if(aT){co=0}else{break}while(1){bA=+g[aR+($(co,aQ)<<2)>>2];bt=bA*bA;bA=bJ*bt+bz*(1.0-bt);bi=co<<1;V=bj+(bi<<2)|0;g[V>>2]=+g[V>>2]*bA;V=bj+((bi|1)<<2)|0;g[V>>2]=+g[V>>2]*bA;V=co+1|0;if((V|0)==(Y|0)){break L3036}else{co=V}}}}while(0);aQ=(Y|0)<(f|0);aR=0;while(1){L3046:do{if(aQ){aT=Y;while(1){V=bj+($(aT,ba)+aR<<2)|0;g[V>>2]=bJ*+g[V>>2];V=aT+1|0;if((V|0)==(f|0)){break L3046}else{aT=V}}}}while(0);aT=aR+1|0;if((aT|0)<(ba|0)){aR=aT}else{cp=ba;break L3034}}}else{cp=cm}}while(0);g[aU>>2]=bJ;ba=c[ak>>2]|0;do{if((ba|0)==1001){if((c[af>>2]|0)==1){ag=2139;break}else{break}}else{ag=2139}}while(0);if((ag|0)==2139){aU=(c[E>>2]|0)-32e3|0;aR=(aU|0)<0;if((aU|0)>16384&(aR^1)){cq=16384}else{cq=aR?0:aU}c[d+84>>2]=cq}do{if((cp|0)==2){aU=d+164|0;aR=d+84|0;if((b[aU>>1]|0)>=16384){if((c[aR>>2]|0)>=16384){cr=ba;break}}bm(I,10015,(u=i,i=i+4|0,c[u>>2]=w,u)|0);Y=c[aR>>2]|0;aR=c[w>>2]|0;aQ=c[P>>2]|0;aT=c[aR+60>>2]|0;V=48e3/(c[C>>2]|0)&-1;bi=(c[aR+4>>2]|0)/(V|0)&-1;bz=1.0- +(b[aU>>1]|0|0)*6103515625.0e-14;bA=1.0- +(Y|0)*6103515625.0e-14;L3064:do{if((bi|0)>0){aR=0;while(1){bt=+g[aT+($(aR,V)<<2)>>2];al=bt*bt;X=$(aR,aQ);bl=bj+(X<<2)|0;bt=+g[bl>>2];W=bj+(X+1<<2)|0;bw=+g[W>>2];bu=(bA*al+bz*(1.0-al))*(bt-bw)*.5;g[bl>>2]=bt-bu;g[W>>2]=bw+bu;W=aR+1|0;if((W|0)==(bi|0)){cs=bi;break L3064}else{aR=W}}}else{cs=0}}while(0);L3068:do{if((cs|0)<(f|0)){bi=cs;while(1){V=$(bi,aQ);aT=bj+(V<<2)|0;bz=+g[aT>>2];aR=bj+(V+1<<2)|0;bu=+g[aR>>2];bw=bA*(bz-bu)*.5;g[aT>>2]=bz-bw;g[aR>>2]=bu+bw;aR=bi+1|0;if((aR|0)==(f|0)){break L3068}else{bi=aR}}}}while(0);b[aU>>1]=Y&65535;cr=c[ak>>2]|0}else{cr=ba}}while(0);do{if((cr|0)==1002){ag=2162}else{ba=c[bf>>2]|0;aQ=(dG(c[bd>>2]|0)|-32)+ba|0;ba=(cr|0)==1001;if((((-(ba&1)&20)+17|0)+aQ|0)>(ah<<3|0)){ag=2162;break}if(ba){if((bG|0)==0){if((aQ+37|0)>(b5<<3|0)){ag=2162;break}}bv(o,bG,12)}if((bG|0)==0){ag=2162;break}bv(o,bH,1);aQ=(c[ak>>2]|0)==1001;if(aQ){ct=(Z-2|0)-b5|0}else{ba=c[bf>>2]|0;ct=ah-((ba+7|0)+(dG(c[bd>>2]|0)|-32)>>3)|0}ba=(c[E>>2]|0)/1600&-1;bi=(ct|0)<(ba|0)?ct:ba;ba=(bi|0)<2?2:bi;bi=(ba|0)>257?257:ba;if(!aQ){cu=bi;cv=1;break}bx(o,bi-2|0,256);cu=bi;cv=1;break}}while(0);if((ag|0)==2162){c[ad>>2]=0;cu=0;cv=0}bi=c[ak>>2]|0;aQ=(bi|0)==1002?0:17;if((bi|0)==1e3){bi=c[bf>>2]|0;ba=(bi+7|0)+(dG(c[bd>>2]|0)|-32)>>3;by(o);cw=ba;cx=ba}else{ba=ah-cu|0;bi=(ba|0)<(b5|0)?ba:b5;ba=c[aS>>2]|0;aR=c[bh>>2]|0;dI(ba+(bi-aR|0)|0,ba+((c[bc>>2]|0)-aR|0)|0,aR|0);c[bc>>2]=bi;cw=0;cx=bi}bi=(bH|0)==0;if(!(bi|cv^1)){bm(I,10010,(u=i,i=i+4|0,c[u>>2]=0,u)|0);bm(I,4006,(u=i,i=i+4|0,c[u>>2]=0,u)|0);if((bg(I,bj,(c[C>>2]|0)/200&-1,h+(cx+1|0)|0,cu,0)|0)<0){b1=-3;break}bm(I,4031,(u=i,i=i+4|0,c[u>>2]=p,u)|0);bm(I,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0)}bm(I,10010,(u=i,i=i+4|0,c[u>>2]=aQ,u)|0);aQ=c[ak>>2]|0;do{if((aQ|0)==1e3){cy=cw}else{aR=c[ac>>2]|0;if((aQ|0)!=(aR|0)&(aR|0)>0){bm(I,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);aR=(c[C>>2]|0)/400&-1;ba=x|0;bg(I,b6,aR,ba,2,0);bm(I,10002,(u=i,i=i+4|0,c[u>>2]=0,u)|0)}ba=c[bf>>2]|0;if(((dG(c[bd>>2]|0)|-32)+ba|0)>(cx<<3|0)){cy=cw;break}bm(I,10022,(u=i,i=i+4|0,c[u>>2]=l,u)|0);ba=bg(I,bj,f,0,cx,o)|0;if((ba|0)<0){b1=-3;break L2996}else{cy=ba}}}while(0);if(cv&bi){aQ=c[C>>2]|0;ba=(aQ|0)/200&-1;aR=(aQ|0)/400&-1;bm(I,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);bm(I,10010,(u=i,i=i+4|0,c[u>>2]=0,u)|0);bm(I,10002,(u=i,i=i+4|0,c[u>>2]=0,u)|0);aQ=f-ba|0;aT=bj+($(c[P>>2]|0,aQ-aR|0)<<2)|0;V=y|0;bg(I,aT,aR,V,2,0);if((bg(I,bj+($(c[P>>2]|0,aQ)<<2)|0,ba,h+(cx+1|0)|0,cu,0)|0)<0){b1=-3;break}bm(I,4031,(u=i,i=i+4|0,c[u>>2]=p,u)|0)}ba=c[ak>>2]|0;aQ=(c[C>>2]|0)/(f|0)&-1;V=c[af>>2]|0;if((aQ|0)<400){aR=aQ;aQ=0;while(1){aT=aR<<1;cz=aQ+1|0;if((aT|0)<400){aR=aT;aQ=cz}else{break}}cA=cz<<3}else{cA=0}if((ba|0)==1e3){cB=cA-16|(bI<<5)+96&224}else if((ba|0)==1002){aQ=bI-1102|0;cB=cA|((aQ|0)<0?128:aQ<<5&96|128)}else{cB=bI<<4|cA+240|96}a[h]=(cB|((V|0)==2&1)<<2)&255;aQ=c[bd>>2]|0;c[A>>2]=c[p>>2]^aQ;if((ay|0)==0){cC=c[ak>>2]|0}else{cC=1002}c[ac>>2]=cC;c[d+200>>2]=c[af>>2]|0;c[d+204>>2]=f;c[d+216>>2]=0;aR=c[bf>>2]|0;L3123:do{if(((dG(aQ|0)|-32)+aR|0)>(ah<<3|0)){if((Z|0)<2){b1=-2;break L2996}a[aa]=0;c[A>>2]=0;cD=1}else{if((c[ak>>2]|0)!=1e3|cv){cD=cy;break}else{cE=cy}while(1){if((cE|0)<=2){cD=cE;break L3123}if((a[h+cE|0]|0)==0){cE=cE-1|0}else{cD=cE;break L3123}}}}while(0);aR=(cu+1|0)+cD|0;if(!((c[R>>2]|0)==0&(aR|0)>2)){b1=aR;break}if((aR|0)==(Z|0)){b1=Z;break}if((aR|0)>(Z|0)){b1=-3;break}aQ=a[h]|0;if((aQ&3)<<24>>24!=0){b1=-3;break}V=Z-aR|0;if((V|0)<=1){ba=cD+cu|0;if((ba|0)>0){Y=aR;aU=ba;while(1){a[h+Y|0]=a[h+aU|0]|0;ba=aU-1|0;if((ba|0)>0){Y=aU;aU=ba}else{break}}cF=a[h]|0}else{cF=aQ}a[h]=cF|3;a[aa]=1;b1=Z;break}aU=V-2|0;Y=(aU|0)/255&-1;ba=cD+cu|0;if((ba|0)>0){bi=Y+2|0;aT=ba;while(1){a[h+(bi+aT|0)|0]=a[h+aT|0]|0;ba=aT-1|0;if((ba|0)>0){aT=ba}else{break}}cG=a[h]|0}else{cG=aQ}a[h]=cG|3;a[aa]=65;if((aU|0)>254){dF(h+2|0,-1|0,((Y|0)>1?Y:1)|0)}a[h+(Y+2|0)|0]=(V+254|0)+(Y*-255&-1)&255;aT=(aR+3|0)+Y|0;if((aT|0)>=(Z|0)){b1=Z;break}dF(h+aT|0,0,((Z-3|0)-aR|0)-Y|0);b1=Z}}while(0);au(am|0);H=b1;i=m;return H|0}}while(0);b1=c[d+192>>2]|0;Z=c[d+208>>2]|0;cG=(Z|0)==0?1101:Z;Z=(S|0)<50?1e3:(S|0)>100?1002:(b1|0)==0?1e3:b1;do{if((Z|0)==1e3&(cG|0)>1103){cH=1103}else{if((Z|0)==1002&(cG|0)==1102){cH=1101;break}cH=(cG|0)>1104?cG:1104}}while(0);cG=c[d+160>>2]|0;if((S|0)<400){d=S;S=0;while(1){b1=d<<1;cI=S+1|0;if((b1|0)<400){d=b1;S=cI}else{break}}cJ=cI<<3}else{cJ=0}if((Z|0)==1002){cI=cH-1102|0;cK=cJ|((cI|0)<0?128:cI<<5&96|128)}else if((Z|0)==1e3){cK=cJ-16|(cH<<5)+96&224}else{cK=cH<<4|cJ+240|96}a[h]=(cK|((cG|0)==2&1)<<2)&255;H=1;i=m;return H|0}function c0(a,b){a=a|0;b=b|0;var c=0;if((a|0)<1){c=0;return c|0}if((b|0)>(a|0)|(b|0)<0){c=0;return c|0}c=((b*53404&-1)+15204|0)+((a-b|0)*48576&-1)|0;return c|0}function c1(a,d,e,f,h){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+36|0;k=j|0;l=j+4|0;c2(a,10015,(u=i,i=i+4|0,c[u>>2]=k,u)|0);if((c[a+92>>2]|0)==2051){m=0}else{m=c[a+100>>2]|0}n=c[a+152>>2]|0;c[l>>2]=0;o=c[a+128>>2]|0;do{if((c[a+44>>2]|0)>6&(o|0)==48e3){p=c[k>>2]|0;q=c[a+96>>2]|0;r=d+($(c[a+10964>>2]|0,q)<<1)|0;s=dA(a+4080|0,p,d,r,e,c[a+140>>2]|0,q,48e3,c[a+144>>2]|0,m,(n|0)>16?16:n,6,l)|0}else{q=c[a+140>>2]|0;r=(o|0)/400&-1;if((r|0)>(e|0)){t=-1;i=j;return t|0}do{if((q|0)==5010){v=(o|0)/50&-1;w=2246;break}else if((q|0)==5e3){x=e}else{p=q-5001|0;if(p>>>0<6){y=(o*3&-1|0)/50&-1;z=r<<p;v=(y|0)<(z|0)?y:z;w=2246;break}else{t=-1;i=j;return t|0}}}while(0);do{if((w|0)==2246){if((v|0)>(e|0)){t=-1}else{x=v;break}i=j;return t|0}}while(0);if((x*400&-1|0)==(o|0)|(x*200&-1|0)==(o|0)|(x*100&-1|0)==(o|0)){s=x;break}r=x*50&-1;if((r|0)==(o|0)|(x*25&-1|0)==(o|0)|(r|0)==(o*3&-1|0)){s=x;break}else{t=-1}i=j;return t|0}}while(0);if((s|0)<0){t=-1;i=j;return t|0}x=a+96|0;o=$(c[x>>2]|0,s);v=at()|0;e=i;i=i+(o*4&-1)|0;i=i+3>>2<<2;o=$(c[x>>2]|0,s);L3205:do{if((o|0)>0){x=0;while(1){g[e+(x<<2)>>2]=+(b[d+(x<<1)>>1]|0|0)*30517578125.0e-15;w=x+1|0;if((w|0)<(o|0)){x=w}else{break L3205}}}}while(0);o=c$(a,e,s,f,h,16,l)|0;au(v|0);t=o;i=j;return t|0}function c2(a,d,e){a=a|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+88|0;h=f|0;j=f+4|0;c[h>>2]=e;e=a;k=e+(c[a>>2]|0)|0;L3211:do{if((d|0)==4004){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if((m-1101|0)>>>0>4){n=-1;i=f;return n|0}c[a+116>>2]=m;if((m|0)==1101){c[a+20>>2]=8e3;o=0;p=2335;break}l=a+20|0;if((m|0)==1102){c[l>>2]=12e3;o=0;p=2335;break}else{c[l>>2]=16e3;o=0;p=2335;break}}else if((d|0)==4037){l=c[h>>2]|0;c[h>>2]=l+4|0;c[c[l>>2]>>2]=c[a+152>>2]|0;o=0;p=2335;break}else if((d|0)==4021){l=c[h>>2]|0;c[h>>2]=l+4|0;c[c[l>>2]>>2]=c[a+136>>2]|0;o=0;p=2335;break}else if((d|0)==10015){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if((m|0)==0){p=2336;break}bm(k,10015,(u=i,i=i+4|0,c[u>>2]=m,u)|0);o=0;p=2335;break}else if((d|0)==4003){m=c[h>>2]|0;c[h>>2]=m+4|0;l=c[m>>2]|0;m=c[a+204>>2]|0;if((m|0)==0){q=(c[a+128>>2]|0)/400&-1}else{q=m}m=c[a+148>>2]|0;if((m|0)==(-1|0)){r=((c[a+128>>2]|0)*10208&-1|0)/(q|0)&-1}else if((m|0)==(-1e3|0)){s=c[a+128>>2]|0;r=$(c[a+96>>2]|0,s)+((s*60&-1|0)/(q|0)&-1)|0}else{r=m}c[l>>2]=r;o=0;p=2335;break}else if((d|0)==4011){l=c[h>>2]|0;c[h>>2]=l+4|0;c[c[l>>2]>>2]=c[a+44>>2]|0;o=0;p=2335;break}else if((d|0)==4012){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if(m>>>0>1){n=-1;i=f;return n|0}else{c[a+48>>2]=m;o=0;p=2335;break}}else if((d|0)==4015){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+40>>2]|0;o=0;p=2335;break}else if((d|0)==11019){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+124>>2]|0;o=0;p=2335;break}else if((d|0)==4028){m=e+(c[a+4>>2]|0)|0;l=a+160|0;dF(l|0,0,18848);bm(k,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0);b2(m,j);c[l>>2]=c[a+96>>2]|0;b[a+164>>1]=16384;g[a+172>>2]=1.0;c[a+216>>2]=1;c[a+192>>2]=1001;c[a+208>>2]=1105;c[a+168>>2]=193536;o=0;p=2335;break}else if((d|0)==11002){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if((m-1e3|0)>>>0>2&(m|0)!=-1e3){p=2336;break}c[a+120>>2]=m;o=0;p=2335;break}else if((d|0)==4036){m=c[h>>2]|0;c[h>>2]=m+4|0;l=c[m>>2]|0;if((l-8|0)>>>0>16){p=2336;break}c[a+152>>2]=l;o=0;p=2335;break}else if((d|0)==4017){l=c[h>>2]|0;c[h>>2]=l+4|0;c[c[l>>2]>>2]=c[a+52>>2]|0;o=0;p=2335;break}else if((d|0)==4008){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if((m-1101|0)>>>0>4&(m|0)!=-1e3){n=-1;i=f;return n|0}c[a+112>>2]=m;if((m|0)==1101){c[a+20>>2]=8e3;o=0;p=2335;break}l=a+20|0;if((m|0)==1102){c[l>>2]=12e3;o=0;p=2335;break}else{c[l>>2]=16e3;o=0;p=2335;break}}else if((d|0)==4009){l=c[h>>2]|0;c[h>>2]=l+4|0;c[c[l>>2]>>2]=c[a+208>>2]|0;o=0;p=2335;break}else if((d|0)==4016){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if(m>>>0>1){n=-1;i=f;return n|0}else{c[a+52>>2]=m;o=0;p=2335;break}}else if((d|0)==4005){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+116>>2]|0;o=0;p=2335;break}else if((d|0)==4029){m=c[h>>2]|0;c[h>>2]=m+4|0;l=c[m>>2]|0;if((l|0)==0){o=-1;p=2335;break}c[l>>2]=c[a+128>>2]|0;o=0;p=2335;break}else if((d|0)==4007){l=c[h>>2]|0;c[h>>2]=l+4|0;c[c[l>>2]>>2]=c[a+132>>2]|0;o=0;p=2335;break}else if((d|0)==11018){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;if((m+1|0)>>>0>101){p=2336;break}c[a+124>>2]=m;o=0;p=2335;break}else if((d|0)==4006){m=c[h>>2]|0;c[h>>2]=m+4|0;l=c[m>>2]|0;if(l>>>0>1){n=-1;i=f;return n|0}else{c[a+132>>2]=l;c[a+56>>2]=1-l|0;o=0;p=2335;break}}else if((d|0)==4022){l=c[h>>2]|0;c[h>>2]=l+4|0;m=c[l>>2]|0;do{if((m|0)<1){if((m|0)==-1e3){break}else{n=-1}i=f;return n|0}else{if((m|0)>(c[a+96>>2]|0)){n=-1}else{break}i=f;return n|0}}while(0);c[a+104>>2]=m;o=0;p=2335;break}else if((d|0)==4020){l=c[h>>2]|0;c[h>>2]=l+4|0;s=c[l>>2]|0;if(s>>>0>1){n=-1;i=f;return n|0}else{c[a+136>>2]=s;o=0;p=2335;break}}else if((d|0)==4024){s=c[h>>2]|0;c[h>>2]=s+4|0;l=c[s>>2]|0;if((l|0)==(-1e3|0)|(l|0)==3002|(l|0)==3001){c[a+108>>2]=l;o=0;p=2335;break}else{n=-1;i=f;return n|0}}else if((d|0)==4027){l=c[h>>2]|0;c[h>>2]=l+4|0;s=c[l>>2]|0;l=(c[a+128>>2]|0)/400&-1;c[s>>2]=l;if((c[a+92>>2]|0)==2051){o=0;p=2335;break}c[s>>2]=(c[a+100>>2]|0)+l|0;o=0;p=2335;break}else if((d|0)==4002){l=c[h>>2]|0;c[h>>2]=l+4|0;s=c[l>>2]|0;do{if((s|0)==(-1|0)|(s|0)==(-1e3|0)){t=s}else{if((s|0)<1){p=2336;break L3211}if((s|0)<501){t=500;break}l=(c[a+96>>2]|0)*3e5&-1;t=(s|0)>(l|0)?l:s}}while(0);c[a+148>>2]=t;o=0;p=2335;break}else if((d|0)==4001){s=c[h>>2]|0;c[h>>2]=s+4|0;c[c[s>>2]>>2]=c[a+92>>2]|0;o=0;p=2335;break}else if((d|0)==4013){s=c[h>>2]|0;c[h>>2]=s+4|0;c[c[s>>2]>>2]=c[a+48>>2]|0;o=0;p=2335;break}else if((d|0)==4010){s=c[h>>2]|0;c[h>>2]=s+4|0;m=c[s>>2]|0;if(m>>>0>10){n=-1;i=f;return n|0}else{c[a+44>>2]=m;bm(k,4010,(u=i,i=i+4|0,c[u>>2]=m,u)|0);o=0;p=2335;break}}else if((d|0)==4025){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+108>>2]|0;o=0;p=2335;break}else if((d|0)==4023){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+104>>2]|0;o=0;p=2335;break}else if((d|0)==4031){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+19004>>2]|0;o=0;p=2335;break}else if((d|0)==4e3){m=c[h>>2]|0;c[h>>2]=m+4|0;s=c[m>>2]|0;if((s-2048|0)>>>0>1&(s|0)!=2051){o=-1;p=2335;break}m=a+92|0;if((c[a+216>>2]|0)==0){if((c[m>>2]|0)!=(s|0)){o=-1;p=2335;break}}c[m>>2]=s;o=0;p=2335;break}else if((d|0)==4040){s=c[h>>2]|0;c[h>>2]=s+4|0;m=c[s>>2]|0;c[a+140>>2]=m;bm(k,4040,(u=i,i=i+4|0,c[u>>2]=m,u)|0);o=0;p=2335;break}else if((d|0)==4041){m=c[h>>2]|0;c[h>>2]=m+4|0;c[c[m>>2]>>2]=c[a+140>>2]|0;o=0;p=2335;break}else if((d|0)==4014){m=c[h>>2]|0;c[h>>2]=m+4|0;s=c[m>>2]|0;if(s>>>0>100){n=-1;i=f;return n|0}else{c[a+40>>2]=s;bm(k,4014,(u=i,i=i+4|0,c[u>>2]=s,u)|0);o=0;p=2335;break}}else{o=-5;p=2335}}while(0);if((p|0)==2335){n=o;i=f;return n|0}else if((p|0)==2336){n=-1;i=f;return n|0}return 0}function c3(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0;g=i;i=i+36|0;h=g|0;j=g+4|0;c2(a,10015,(u=i,i=i+4|0,c[u>>2]=h,u)|0);if((c[a+92>>2]|0)==2051){k=0}else{k=c[a+100>>2]|0}l=c[a+152>>2]|0;c[j>>2]=0;m=c[a+128>>2]|0;do{if((c[a+44>>2]|0)>6&(m|0)==48e3){n=c[h>>2]|0;o=c[a+96>>2]|0;p=b+($(c[a+10964>>2]|0,o)<<2)|0;q=dA(a+4080|0,n,b,p,d,c[a+140>>2]|0,o,48e3,c[a+144>>2]|0,k,(l|0)>24?24:l,10,j)|0}else{o=c[a+140>>2]|0;p=(m|0)/400&-1;if((p|0)>(d|0)){r=-1;i=g;return r|0}do{if((o|0)==5010){s=(m|0)/50&-1;t=2360;break}else if((o|0)==5e3){v=d}else{n=o-5001|0;if(n>>>0<6){w=(m*3&-1|0)/50&-1;x=p<<n;s=(w|0)<(x|0)?w:x;t=2360;break}else{r=-1;i=g;return r|0}}}while(0);do{if((t|0)==2360){if((s|0)>(d|0)){r=-1}else{v=s;break}i=g;return r|0}}while(0);if((v*400&-1|0)==(m|0)|(v*200&-1|0)==(m|0)|(v*100&-1|0)==(m|0)){q=v;break}p=v*50&-1;if((p|0)==(m|0)|(v*25&-1|0)==(m|0)|(p|0)==(m*3&-1|0)){q=v;break}else{r=-1}i=g;return r|0}}while(0);if((q|0)<0){r=-1;i=g;return r|0}r=c$(a,b,q,e,f,24,j)|0;i=g;return r|0}function c4(a){a=a|0;dD(a);return}function c5(a,b){a=a|0;b=b|0;var c=0;if((a|0)<1){c=0;return c|0}if((b|0)>(a|0)|(b|0)<0){c=0;return c|0}c=((b*26916&-1)+268|0)+((a-b|0)*18148&-1)|0;return c|0}function c6(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0.0;h=c;if((f|0)>0){i=0}else{return}while(1){j=+g[h+($(i,d)+e<<2)>>2];g[a+($(i,b)<<2)>>2]=j;c=i+1|0;if((c|0)==(f|0)){break}else{i=c}}return}function c7(a,c,d,e,f,h){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,j=0,k=0.0;i=d;if((h|0)>0){j=0}else{return}while(1){k=+(b[i+($(j,e)+f<<1)>>1]|0|0)*30517578125.0e-15;g[a+($(j,c)<<2)>>2]=k;d=j+1|0;if((d|0)==(h|0)){break}else{j=d}}return}function c8(b,e,f,h,i,j,k){b=b|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;if((f-1|0)>>>0>254|(i|0)>(h|0)){l=-1;return l|0}if((i+h|0)>255|(h|0)<1|(i|0)<0){l=-1;return l|0}m=b+14916|0;c[m>>2]=f;n=b+14920|0;c[n>>2]=h;o=b+14924|0;c[o>>2]=i;g[b+15200>>2]=0.0;g[b+15196>>2]=0.0;g[b+15192>>2]=0.0;dF(b|0,0,14916);c[b+15188>>2]=-1e3;c[b+15184>>2]=5e3;if((f|0)>0){p=0;while(1){a[p+(b+14928)|0]=a[j+p|0]|0;q=p+1|0;r=c[m>>2]|0;if((q|0)<(r|0)){p=q}else{break}}s=c[n>>2]|0;t=c[o>>2]|0;u=r}else{s=h;t=i;u=f}f=t+s|0;if((f|0)>255){l=-1;return l|0}else{v=0}while(1){if((v|0)>=(u|0)){break}i=a[v+(b+14928)|0]|0;if((i&255|0)<(f|0)|i<<24>>24==-1){v=v+1|0}else{l=-1;w=2425;break}}if((w|0)==2425){return l|0}L3388:do{if((s|0)>0){v=0;L3389:while(1){if((v|0)<(t|0)){f=v<<1;i=0;while(1){if((i|0)>=(u|0)){l=-1;w=2421;break L3389}if((d[i+(b+14928)|0]|0|0)==(f|0)){break}else{i=i+1|0}}if((i|0)==-1){l=-1;w=2433;break}h=f|1;r=0;while(1){if((r|0)>=(u|0)){l=-1;w=2426;break L3389}if((d[r+(b+14928)|0]|0|0)==(h|0)){break}else{r=r+1|0}}if((r|0)==-1){l=-1;w=2434;break}}else{h=v+t|0;f=0;while(1){if((f|0)>=(u|0)){l=-1;w=2428;break L3389}if((d[f+(b+14928)|0]|0|0)==(h|0)){break}else{f=f+1|0}}if((f|0)==-1){l=-1;w=2423;break}}h=v+1|0;if((h|0)<(s|0)){v=h}else{break L3388}}if((w|0)==2433){return l|0}else if((w|0)==2428){return l|0}else if((w|0)==2434){return l|0}else if((w|0)==2421){return l|0}else if((w|0)==2423){return l|0}else if((w|0)==2426){return l|0}}}while(0);u=b+15204|0;do{if((t|0)>0){b=0;v=u;while(1){h=cX(v,e,2,k)|0;if((h|0)!=0){l=h;w=2427;break}x=v+53404|0;y=b+1|0;if((y|0)<(c[o>>2]|0)){b=y;v=x}else{w=2414;break}}if((w|0)==2414){z=y;A=x;B=c[n>>2]|0;break}else if((w|0)==2427){return l|0}}else{z=0;A=u;B=s}}while(0);if((z|0)<(B|0)){C=z;D=A}else{l=0;return l|0}while(1){A=cX(D,e,1,k)|0;if((A|0)!=0){l=A;w=2424;break}A=C+1|0;if((A|0)<(c[n>>2]|0)){C=A;D=D+48576|0}else{l=0;w=2422;break}}if((w|0)==2422){return l|0}else if((w|0)==2424){return l|0}return 0}function c9(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0;do{if(!((b-1|0)>>>0>254|(e|0)>(d|0))){if((e+d|0)>255|(d|0)<1|(e|0)<0){break}i=dC(((e*53404&-1)+15204|0)+((d-e|0)*48576&-1)|0)|0;j=i;if((i|0)==0){if((h|0)==0){k=0;return k|0}c[h>>2]=-7;k=0;return k|0}l=c8(j,a,b,d,e,f,g)|0;if((l|0)==0){m=j}else{dD(i);m=0}if((h|0)==0){k=m;return k|0}c[h>>2]=l;k=m;return k|0}}while(0);if((h|0)==0){k=0;return k|0}c[h>>2]=-1;k=0;return k|0}function da(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;return db(a,2,b,d,e,f,24,10,b+($((c[a+14924>>2]|0)+(c[a+14920>>2]|0)|0,c[a+6884>>2]|0)<<2)|0)|0}function db(a,b,e,f,g,h,j,k,l){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;m=i;i=i+4180|0;n=m|0;o=m+4|0;p=m+3836|0;q=m+4136|0;r=m+4140|0;s=m+4172|0;t=m+4176|0;v=a+15204|0;w=v;x=v;c2(x,4029,(u=i,i=i+4|0,c[u>>2]=n,u)|0);c2(x,4011,(u=i,i=i+4|0,c[u>>2]=q,u)|0);c2(x,10015,(u=i,i=i+4|0,c[u>>2]=s,u)|0);v=c[n>>2]|0;if((f*400&-1|0)<(v|0)){y=-1;i=m;return y|0}z=(v|0)/50&-1;A=(z|0)>(f|0)?f:z;c[r>>2]=0;L3460:do{if((c[q>>2]|0)>6&(v|0)==48e3){B=(c[a+14924>>2]|0)+(c[a+14920>>2]|0)|0;c2(x,4027,(u=i,i=i+4|0,c[u>>2]=t,u)|0);C=c[n>>2]|0;D=(c[t>>2]|0)-((C|0)/400&-1)|0;c[t>>2]=D;E=dA(a|0,c[s>>2]|0,e,l,f,c[a+15184>>2]|0,B,C,c[a+15188>>2]|0,D,j,k,r)|0;F=E;G=c[n>>2]|0}else{E=c[a+15184>>2]|0;D=(v|0)/400&-1;if((D|0)>(f|0)){F=-1;G=v;break}do{if((E|0)==5010){H=z;I=2461}else if((E|0)==5e3){J=f}else{C=E-5001|0;if(C>>>0>=6){F=-1;G=v;break L3460}B=(v*3&-1|0)/50&-1;K=D<<C;H=(B|0)<(K|0)?B:K;I=2461;break}}while(0);if((I|0)==2461){if((H|0)>(f|0)){F=-1;G=v;break}else{J=H}}if(!((J*400&-1|0)==(v|0)|(J*200&-1|0)==(v|0)|(J*100&-1|0)==(v|0))){D=J*50&-1;if(!((D|0)==(v|0)|(J*25&-1|0)==(v|0)|(D|0)==(v*3&-1|0))){F=-1;G=v;break}}F=J;G=v}}while(0);do{if(!((F*400&-1|0)==(G|0)|(F*200&-1|0)==(G|0)|(F*100&-1|0)==(G|0))){v=F*50&-1;if((v|0)==(G|0)|(F*25&-1|0)==(G|0)|(v|0)==(G*3&-1|0)){break}else{y=-1}i=m;return y|0}}while(0);G=at()|0;v=i;i=i+((F<<1)*4&-1)|0;i=i+3>>2<<2;J=a+14920|0;H=c[J>>2]|0;L3478:do{if(((H<<2)-1|0)>(h|0)){L=-2}else{f=a+14924|0;I=c[a+15188>>2]|0;if((I|0)==(-1e3|0)){z=c[n>>2]|0;M=((z*60&-1|0)/(A|0)&-1)+z|0}else if((I|0)==(-1|0)){M=3e5}else{M=(I|0)/((c[f>>2]|0)+H|0)&-1}do{if((c[a+15184>>2]|0)==5010){I=c[n>>2]|0;if((F|0)==((I|0)/50&-1|0)){N=M;break}N=(M-3e3|0)+(((I|0)/(F|0)&-1)*60&-1)|0}else{N=M}}while(0);if((H|0)>0){O=w;P=0}else{L=0;break}while(1){I=(P|0)<(c[f>>2]|0);z=$(I?2:1,N);c2(O,4002,(u=i,i=i+4|0,c[u>>2]=z,u)|0);z=P+1|0;Q=c[J>>2]|0;if((z|0)>=(Q|0)){break}O=O+(I?53404:48576)|0;P=z}if((Q|0)<=0){L=0;break}z=p+4|0;I=a+14916|0;k=v+4|0;l=o|0;s=0;t=w;x=0;q=g;while(1){c[z>>2]=0;D=t;E=c[f>>2]|0;K=c[I>>2]|0;if((x|0)<(E|0)){B=x<<1;C=0;while(1){if((C|0)>=(K|0)){R=-1;break}if((d[C+(a+14928)|0]|0|0)==(B|0)){R=C;break}else{C=C+1|0}}C=B|1;S=0;while(1){if((S|0)>=(K|0)){T=-1;break}if((d[S+(a+14928)|0]|0|0)==(C|0)){T=S;break}else{S=S+1|0}}aP[b&15](v,2,e,K,R,F);aP[b&15](k,2,e,c[I>>2]|0,T,F);U=53404}else{S=0;while(1){if((S|0)>=(K|0)){V=-1;break}if((d[S+(a+14928)|0]|0|0)==(E+x|0)){V=S;break}else{S=S+1|0}}aP[b&15](v,1,e,K,V,F);U=48576}S=h-s|0;E=((c[J>>2]|0)-x<<2)-5|0;C=S-((E|0)<0?0:E)|0;E=c$(D,v,F,l,(C|0)<3832?C:3832,j,r)|0;if((E|0)<0){L=E;break L3478}du(p,l,E);E=dv(p,0,c[z>>2]|0,q,S,(x|0)!=((c[J>>2]|0)-1|0)&1)|0;S=E+s|0;C=x+1|0;if((C|0)>=(c[J>>2]|0)){L=S;break L3478}s=S;t=t+U|0;x=C;q=q+E|0}}}while(0);au(G|0);y=L;i=m;return y|0}function dc(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;return db(a,4,b,d,e,f,16,6,b+($((c[a+14924>>2]|0)+(c[a+14920>>2]|0)|0,c[a+6884>>2]|0)<<1)|0)|0}function dd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0;e=i;i=i+12|0;f=e|0;g=e+4|0;h=e+8|0;c[f>>2]=d;d=a+15204|0;j=d;L3516:do{if((b|0)==4002){k=c[f>>2]|0;c[f>>2]=k+4|0;l=c[k>>2]|0;do{if((l|0)<0){if((l|0)==(-1|0)|(l|0)==(-1e3|0)){break}m=-1;i=e;return m|0}}while(0);c[a+15188>>2]=l;n=0}else if((b|0)==4036|(b|0)==4010|(b|0)==4006|(b|0)==4020|(b|0)==4008|(b|0)==4024|(b|0)==4e3|(b|0)==4012|(b|0)==4014|(b|0)==4016|(b|0)==11002|(b|0)==4022){k=c[f>>2]|0;c[f>>2]=k+4|0;o=c[k>>2]|0;k=a+14920|0;if((c[k>>2]|0)<=0){n=0;break}p=a+14924|0;q=0;r=j;while(1){s=c[p>>2]|0;t=c2(r,b,(u=i,i=i+4|0,c[u>>2]=o,u)|0)|0;if((t|0)!=0){n=t;break L3516}t=r+((q|0)<(s|0)?53404:48576)|0;s=q+1|0;if((s|0)<(c[k>>2]|0)){q=s;r=t}else{n=0;break L3516}}}else if((b|0)==4037|(b|0)==4007|(b|0)==4001|(b|0)==4009|(b|0)==4011|(b|0)==4015|(b|0)==4017|(b|0)==11019|(b|0)==4021|(b|0)==4025|(b|0)==4027|(b|0)==4029|(b|0)==4013|(b|0)==4023){r=c[f>>2]|0;c[f>>2]=r+4|0;n=c2(d,b,(u=i,i=i+4|0,c[u>>2]=c[r>>2]|0,u)|0)|0}else if((b|0)==4003){r=c[f>>2]|0;c[f>>2]=r+4|0;q=c[r>>2]|0;c[q>>2]=0;r=a+14920|0;if((c[r>>2]|0)<=0){n=0;break}k=a+14924|0;o=0;p=j;while(1){l=p+((o|0)<(c[k>>2]|0)?53404:48576)|0;c2(p,4003,(u=i,i=i+4|0,c[u>>2]=g,u)|0);c[q>>2]=(c[q>>2]|0)+(c[g>>2]|0)|0;t=o+1|0;if((t|0)<(c[r>>2]|0)){o=t;p=l}else{n=0;break L3516}}}else if((b|0)==4040){p=c[f>>2]|0;c[f>>2]=p+4|0;c[a+15184>>2]=c[p>>2]|0;n=0}else if((b|0)==4041){p=c[f>>2]|0;c[f>>2]=p+4|0;c[c[p>>2]>>2]=c[a+15184>>2]|0;n=0}else if((b|0)==4031){p=c[f>>2]|0;c[f>>2]=p+4|0;o=c[p>>2]|0;c[o>>2]=0;p=a+14920|0;if((c[p>>2]|0)<=0){n=0;break}r=a+14924|0;q=0;k=j;while(1){l=c[r>>2]|0;t=c2(k,4031,(u=i,i=i+4|0,c[u>>2]=h,u)|0)|0;if((t|0)!=0){n=t;break L3516}t=k+((q|0)<(l|0)?53404:48576)|0;c[o>>2]=c[o>>2]^c[h>>2];l=q+1|0;if((l|0)<(c[p>>2]|0)){q=l;k=t}else{n=0;break L3516}}}else if((b|0)==5120){k=c[f>>2]|0;q=k+4|0;c[f>>2]=q;p=c[k>>2]|0;do{if((p|0)<0){v=2517}else{if((p|0)<(c[a+14920>>2]|0)){w=0;break}else{v=2517;break}}}while(0);if((v|0)==2517){w=-1}c[f>>2]=k+8|0;o=c[q>>2]|0;L3546:do{if((p|0)>0){r=c[a+14924>>2]|0;t=0;l=j;while(1){s=l+((t|0)<(r|0)?53404:48576)|0;x=t+1|0;if((x|0)==(p|0)){y=s;break L3546}else{t=x;l=s}}}else{y=j}}while(0);c[o>>2]=y;n=w}else{n=-5}}while(0);m=n;i=e;return m|0}function de(a){a=a|0;dD(a);return}function df(){return 300}function dg(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var h=0,i=0,j=0,k=0,l=0.0;h=a;a=(f|0)>0;if((d|0)==0){if(a){i=0}else{return}while(1){g[h+($(i,b)+c<<2)>>2]=0.0;j=i+1|0;if((j|0)==(f|0)){break}else{i=j}}return}else{if(a){k=0}else{return}while(1){l=+g[d+($(k,e)<<2)>>2];g[h+($(k,b)+c<<2)>>2]=l;a=k+1|0;if((a|0)==(f|0)){break}else{k=a}}return}}function dh(a){a=a|0;c[a+4>>2]=0;return a|0}function di(a){a=a|0;return c[a+4>>2]|0}function dj(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;if((e-1|0)>>>0>254|(g|0)>(f|0)){i=-1;return i|0}if((g+f|0)>255|(f|0)<1|(g|0)<0){i=-1;return i|0}j=b|0;c[j>>2]=e;k=b+4|0;c[k>>2]=f;l=b+8|0;c[l>>2]=g;if((e|0)>0){m=0;while(1){a[m+(b+12)|0]=a[h+m|0]|0;n=m+1|0;o=c[j>>2]|0;if((n|0)<(o|0)){m=n}else{break}}p=c[k>>2]|0;q=c[l>>2]|0;r=o}else{p=f;q=g;r=e}e=q+p|0;if((e|0)>255){i=-1;return i|0}else{s=0}while(1){if((s|0)>=(r|0)){break}g=a[s+(b+12)|0]|0;if((g&255|0)<(e|0)|g<<24>>24==-1){s=s+1|0}else{i=-1;t=2561;break}}if((t|0)==2561){return i|0}s=b+268|0;do{if((q|0)>0){b=0;e=s;while(1){r=cF(e,d,2)|0;if((r|0)!=0){i=r;t=2563;break}u=e+26916|0;v=b+1|0;if((v|0)<(c[l>>2]|0)){b=v;e=u}else{t=2552;break}}if((t|0)==2563){return i|0}else if((t|0)==2552){w=v;x=u;y=c[k>>2]|0;break}}else{w=0;x=s;y=p}}while(0);if((w|0)<(y|0)){z=w;A=x}else{i=0;return i|0}while(1){x=cF(A,d,1)|0;if((x|0)!=0){i=x;t=2566;break}x=z+1|0;if((x|0)<(c[k>>2]|0)){z=x;A=A+18148|0}else{i=0;t=2562;break}}if((t|0)==2562){return i|0}else if((t|0)==2566){return i|0}return 0}function dk(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;do{if(!((b-1|0)>>>0>254|(e|0)>(d|0))){if((e+d|0)>255|(d|0)<1|(e|0)<0){break}h=dC(((e*26916&-1)+268|0)+((d-e|0)*18148&-1)|0)|0;i=h;if((h|0)==0){if((g|0)==0){j=0;return j|0}c[g>>2]=-7;j=0;return j|0}k=dj(i,a,b,d,e,f)|0;if((g|0)!=0){c[g>>2]=k}if((k|0)==0){j=i;return j|0}dD(h);j=0;return j|0}}while(0);if((g|0)==0){j=0;return j|0}c[g>>2]=-1;j=0;return j|0}function dl(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return dm(a,b,c,d,12,e,f,1)|0}function dm(b,e,f,g,h,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;m=i;i=i+8|0;n=m|0;o=m+4|0;dq(b,4029,(u=i,i=i+4|0,c[u>>2]=n,u)|0);p=((c[n>>2]|0)/25&-1)*3&-1;n=(p|0)>(j|0)?j:p;p=i;i=i+((n<<1)*4&-1)|0;i=i+3>>2<<2;j=b+268|0;q=(f|0)==0;if((f|0)<0){r=-1;i=m;return r|0}s=c[b+4>>2]|0;do{if(q){t=0}else{if(((s<<1)-1|0)>(f|0)){r=-4}else{t=f;break}i=m;return r|0}}while(0);f=b+4|0;L3639:do{if((s|0)>0){v=b+8|0;w=q^1;x=b|0;y=p+4|0;z=0;A=j;B=n;C=t;D=e;E=s;while(1){F=A+((z|0)<(c[v>>2]|0)?26916:18148)|0;if((C|0)<1&w){r=-4;G=2620;break}c[o>>2]=0;H=cI(A,D,C,p,B,k,(z|0)!=(E-1|0)&1,o,l)|0;I=c[o>>2]|0;J=D+I|0;K=C-I|0;if((H|0)>(B|0)){r=-2;G=2626;break}if(!((z|0)<1|(H|0)==(B|0))){r=-4;G=2623;break}if((H|0)<1){r=H;G=2624;break}L3648:do{if((z|0)<(c[v>>2]|0)){I=z<<1;L=-1;L3650:while(1){M=c[x>>2]|0;N=(L|0)<0?0:L+1|0;while(1){if((N|0)>=(M|0)){break L3650}if((d[N+(b+12)|0]|0|0)==(I|0)){break}else{N=N+1|0}}if((N|0)==-1){break}aP[h&15](g,M,N,p,2,H);L=N}L=I|1;O=-1;P=M;while(1){Q=(O|0)<0?0:O+1|0;while(1){if((Q|0)>=(P|0)){R=P;break L3648}if((d[Q+(b+12)|0]|0|0)==(L|0)){break}else{Q=Q+1|0}}if((Q|0)==-1){R=P;break L3648}aP[h&15](g,P,Q,y,2,H);O=Q;P=c[x>>2]|0}}else{P=-1;while(1){O=c[x>>2]|0;L=(P|0)<0?0:P+1|0;while(1){if((L|0)>=(O|0)){R=O;break L3648}if((d[L+(b+12)|0]|0|0)==((c[v>>2]|0)+z|0)){break}else{L=L+1|0}}if((L|0)==-1){R=O;break L3648}aP[h&15](g,O,L,p,1,H);P=L}}}while(0);P=z+1|0;Q=c[f>>2]|0;if((P|0)<(Q|0)){z=P;A=F;B=H;C=K;D=J;E=Q}else{S=H;T=R;break L3639}}if((G|0)==2620){i=m;return r|0}else if((G|0)==2626){i=m;return r|0}else if((G|0)==2623){i=m;return r|0}else if((G|0)==2624){i=m;return r|0}}else{S=n;T=c[b>>2]|0}}while(0);n=b|0;if((T|0)>0){U=0;V=T}else{r=S;i=m;return r|0}while(1){if((a[U+(b+12)|0]|0)==-1){aP[h&15](g,V,U,0,0,S);W=c[n>>2]|0}else{W=V}T=U+1|0;if((T|0)<(W|0)){U=T;V=W}else{r=S;break}}i=m;return r|0}function dn(a,c,d,e,f,h){a=a|0;c=c|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,j=0,k=0,l=0,m=0.0,n=0.0;i=a;a=(h|0)>0;if((e|0)==0){if(a){j=0}else{return}while(1){b[i+($(j,c)+d<<1)>>1]=0;k=j+1|0;if((k|0)==(h|0)){break}else{j=k}}return}else{if(a){l=0}else{return}while(1){m=+g[e+($(l,f)<<2)>>2]*32768.0;n=m>-32768.0?m:-32768.0;a=aq(+(n<32767.0?n:32767.0))&65535;b[i+($(l,c)+d<<1)>>1]=a;a=l+1|0;if((a|0)==(h|0)){break}else{l=a}}return}}function dp(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return dm(a,b,c,d,8,e,f,0)|0}function dq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,v=0,w=0;e=i;i=i+8|0;f=e|0;g=e+4|0;c[f>>2]=d;d=a+268|0;h=d;L3703:do{if((b|0)==4031){j=c[f>>2]|0;c[f>>2]=j+4|0;k=c[j>>2]|0;c[k>>2]=0;j=a+4|0;if((c[j>>2]|0)<=0){l=0;break}m=a+8|0;n=0;o=h;while(1){p=c[m>>2]|0;q=cV(o,4031,(u=i,i=i+4|0,c[u>>2]=g,u)|0)|0;if((q|0)!=0){l=q;break L3703}q=o+((n|0)<(p|0)?26916:18148)|0;c[k>>2]=c[k>>2]^c[g>>2];p=n+1|0;if((p|0)<(c[j>>2]|0)){n=p;o=q}else{l=0;break L3703}}}else if((b|0)==4009|(b|0)==4029|(b|0)==4045|(b|0)==4039){o=c[f>>2]|0;c[f>>2]=o+4|0;l=cV(d,b,(u=i,i=i+4|0,c[u>>2]=c[o>>2]|0,u)|0)|0}else if((b|0)==4034){o=c[f>>2]|0;c[f>>2]=o+4|0;n=c[o>>2]|0;o=a+4|0;if((c[o>>2]|0)<=0){l=0;break}j=a+8|0;k=0;m=h;while(1){q=c[j>>2]|0;p=cV(m,4034,(u=i,i=i+4|0,c[u>>2]=n,u)|0)|0;if((p|0)!=0){l=p;break L3703}p=m+((k|0)<(q|0)?26916:18148)|0;q=k+1|0;if((q|0)<(c[o>>2]|0)){k=q;m=p}else{l=0;break L3703}}}else if((b|0)==4028){m=a+4|0;if((c[m>>2]|0)<=0){l=0;break}k=a+8|0;o=0;n=h;while(1){j=c[k>>2]|0;p=cV(n,4028,(u=i,i=i+1|0,i=i+3>>2<<2,c[u>>2]=0,u)|0)|0;if((p|0)!=0){l=p;break L3703}p=n+((o|0)<(j|0)?26916:18148)|0;j=o+1|0;if((j|0)<(c[m>>2]|0)){o=j;n=p}else{l=0;break L3703}}}else if((b|0)==5122){n=c[f>>2]|0;o=n+4|0;c[f>>2]=o;m=c[n>>2]|0;do{if((m|0)<0){r=2651}else{if((m|0)<(c[a+4>>2]|0)){s=0;break}else{r=2651;break}}}while(0);if((r|0)==2651){s=-1}c[f>>2]=n+8|0;k=c[o>>2]|0;L3726:do{if((m|0)>0){p=c[a+8>>2]|0;j=0;q=h;while(1){t=q+((j|0)<(p|0)?26916:18148)|0;v=j+1|0;if((v|0)==(m|0)){w=t;break L3726}else{j=v;q=t}}}else{w=h}}while(0);c[k>>2]=w;l=s}else{l=-5}}while(0);i=e;return l|0}function dr(a){a=a|0;dD(a);return}function ds(){var a=0,b=0;a=dC(300)|0;if((a|0)==0){b=0;return b|0}c[a+4>>2]=0;b=a;return b|0}function dt(a){a=a|0;dD(a|0);return}function du(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+4|0;h=g|0;do{if((f|0)<1){j=-4}else{k=b+4|0;l=c[k>>2]|0;if((l|0)==0){a[b|0]=a[e]|0;m=d[e]|0;do{if((m&128|0)==0){if((m&96|0)==96){n=(m&8|0)==0?80:160;break}o=m>>>3&3;if((o|0)==3){n=480;break}n=(8e3<<o|0)/100&-1}else{n=(8e3<<(m>>>3&3)|0)/400&-1}}while(0);c[b+296>>2]=n;p=a[e]|0}else{m=a[e]|0;if(((m^a[b|0])&255)>3){j=-4;break}else{p=m}}m=p&3;if((m|0)==3){if((f|0)<2){j=-4;break}o=a[e+1|0]&63;if((o|0)==0){j=-4;break}else{q=o}}else if((m|0)==0){q=1}else{q=2}if(($(l+q|0,c[b+296>>2]|0)|0)>960){j=-4;break}m=cE(e,f,0,h,b+8+(l<<2)|0,b+200+(l<<1)|0,0)|0;if((m|0)<1){j=m;break}c[k>>2]=(c[k>>2]|0)+q|0;j=0}}while(0);i=g;return j|0}function dv(d,e,f,g,h,i){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;if(!((e|0)>-1&(e|0)<(f|0))){j=-1;return j|0}if((c[d+4>>2]|0)<(f|0)){j=-1;return j|0}k=f-e|0;l=d+200+(e<<1)|0;m=(i|0)!=0;if(m){n=(b[d+200+(f-1<<1)>>1]|0)>251?2:1}else{n=0}L3772:do{if((k|0)==2){i=b[d+200+(e+1<<1)>>1]|0;o=b[l>>1]|0;p=o<<16>>16;if(i<<16>>16==o<<16>>16){q=(p<<1|1)+n|0;if((q|0)>(h|0)){j=-2;return j|0}else{a[g]=a[d|0]&-4|1;r=g+1|0;s=q;break}}q=(((n+2|0)+(i<<16>>16)|0)+p|0)+(o<<16>>16>251&1)|0;if((q|0)>(h|0)){j=-2;return j|0}o=g+1|0;a[g]=a[d|0]&-4|2;p=b[l>>1]|0;i=p<<16>>16;if(p<<16>>16<252){a[o]=p&255;t=2}else{p=i|252;a[o]=p&255;a[g+2|0]=(i-(p&255)|0)>>>2&255;t=3}r=g+t|0;s=q}else if((k|0)==1){q=(n+1|0)+(b[l>>1]|0)|0;if((q|0)>(h|0)){j=-2;return j|0}else{a[g]=a[d|0]&-4;r=g+1|0;s=q;break}}else{q=1;while(1){if((q|0)>=(k|0)){u=2713;break}if((b[d+200+(q+e<<1)>>1]|0)==(b[l>>1]|0)){q=q+1|0}else{break}}if((u|0)==2713){q=(n+2|0)+$(b[l>>1]|0,k)|0;if((q|0)>(h|0)){j=-2;return j|0}else{a[g]=a[d|0]|3;a[g+1|0]=k&255;r=g+2|0;s=q;break}}q=n+2|0;p=(k-1|0)>0;i=f-1|0;L3800:do{if(p){o=i-e|0;v=q;w=0;while(1){x=b[d+200+(w+e<<1)>>1]|0;y=((x<<16>>16)+v|0)+(x<<16>>16>251?2:1)|0;x=w+1|0;if((x|0)==(o|0)){z=y;break L3800}else{v=y;w=x}}}else{z=q}}while(0);q=(b[d+200+(i<<1)>>1]|0)+z|0;if((q|0)>(h|0)){j=-2;return j|0}a[g]=a[d|0]|3;w=g+2|0;a[g+1|0]=(k|128)&255;if(!p){r=w;s=q;break}v=i-e|0;o=0;x=w;while(1){w=b[d+200+(o+e<<1)>>1]|0;y=w<<16>>16;if(w<<16>>16<252){a[x]=w&255;A=1}else{w=y|252;a[x]=w&255;a[x+1|0]=(y-(w&255)|0)>>>2&255;A=2}w=x+A|0;y=o+1|0;if((y|0)==(v|0)){r=w;s=q;break L3772}else{o=y;x=w}}}}while(0);if(m){m=b[d+200+(f-1<<1)>>1]|0;f=m<<16>>16;if(m<<16>>16<252){a[r]=m&255;B=1}else{m=f|252;a[r]=m&255;a[r+1|0]=(f-(m&255)|0)>>>2&255;B=2}C=r+B|0}else{C=r}if((k|0)>0){D=0;E=C}else{j=s;return j|0}while(1){C=D+e|0;r=d+200+(C<<1)|0;dH(E|0,c[d+8+(C<<2)>>2]|0,b[r>>1]|0);C=D+1|0;if((C|0)==(k|0)){j=s;break}else{D=C;E=E+(b[r>>1]|0)|0}}return j|0}function dw(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return dv(a,b,c,d,e,0)|0}function dx(a,b,d){a=a|0;b=b|0;d=d|0;return dv(a,0,c[a+4>>2]|0,b,d,0)|0}function dy(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0,r=0.0,s=0,t=0.0,u=0.0,v=0.0,w=0,x=0.0,y=0.0,z=0.0,A=0;e=a+8508|0;f=c[e>>2]|0;h=c[a+8504>>2]|0;i=h-f|0;j=(i|0)<0?i+200|0:i;if((d|0)<481|(f|0)==(h|0)){k=f}else{i=f+1|0;k=(i|0)==200?0:i}i=(((k|0)==(h|0))<<31>>31)+k|0;dH(b|0,a+8516+(((i|0)<0?199:i)<<5)|0,32);i=(d|0)/120&-1;d=a+8512|0;k=c[d>>2]|0;h=k+i|0;c[d>>2]=h;f=c[e>>2]|0;if((h|0)>3){l=(3-k|0)-i|0;i=(h+((l|0)>-4?l:-4)|0)>>>2;l=(f+i|0)+1|0;c[d>>2]=(h-4|0)-(i<<2)|0;c[e>>2]=l;m=l}else{m=f}if((m|0)>199){c[e>>2]=m-200|0}do{if((210-j|0)>0|(j-10|0)<1){m=9-j|0;e=(209-j|0)-((m|0)>-1?m:-1)|0;n=0.0;m=0;while(1){o=n+ +g[a+7688+(m<<2)>>2];f=m+1|0;if((f|0)==(e|0)){break}else{n=o;m=f}}if((e|0)<200){p=o;q=e;break}else{r=o}s=a+8492|0;t=+g[s>>2];u=r*t;v=1.0-r;w=a+8488|0;x=+g[w>>2];y=v*x;z=u+y;A=b+20|0;g[A>>2]=z;return}else{p=0.0;q=0}}while(0);while(1){o=p+ +g[a+6888+(q<<2)>>2];j=q+1|0;if((j|0)==200){r=o;break}else{p=o;q=j}}s=a+8492|0;t=+g[s>>2];u=r*t;v=1.0-r;w=a+8488|0;x=+g[w>>2];y=v*x;z=u+y;A=b+20|0;g[A>>2]=z;return}function dz(a,b,d,e,f,h,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0.0,B=0.0,C=0.0,D=0,E=0.0,F=0,G=0,H=0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,O=0.0,R=0.0,S=0.0,T=0.0,U=0.0,V=0.0,W=0.0,X=0.0,Y=0.0,_=0.0,$=0.0,aa=0.0,ab=0.0,ac=0.0,ad=0.0,ae=0.0,af=0.0,ag=0.0,ah=0.0,ai=0.0,aj=0.0,ak=0.0,al=0.0,am=0.0,an=0.0,ao=0.0,ap=0.0,aq=0.0,ar=0.0,as=0.0,at=0,au=0.0,av=0.0,aw=0.0,ax=0.0,az=0.0,aA=0.0,aB=0.0,aC=0.0,aD=0.0,aE=0,aF=0.0,aG=0.0,aH=0.0,aI=0.0,aJ=0.0,aK=0.0,aM=0.0,aN=0.0,aO=0;m=i;i=i+9884|0;n=m|0;o=m+72|0;p=m+144|0;q=m+176|0;r=m+276|0;s=m+284|0;t=m+4124|0;u=m+7964|0;v=m+8924|0;w=a+6860|0;c[w>>2]=(c[w>>2]|0)+1|0;x=a+6864|0;y=c[x>>2]|0;z=y+1|0;do{if((z|0)>20){if((z|0)>50){A=50.0;B=.05000000074505806;break}else{C=.05000000074505806;D=2751;break}}else{C=1.0/+(z|0);D=2751;break}}while(0);if((D|0)==2751){A=+(z|0);B=C}C=1.0/A;if((z|0)>6e3){E=6.0e3}else{E=+(z|0)}A=1.0/E;do{if((y|0)<4){g[a+6840>>2]=.5;z=c[d+72>>2]|0;if((y|0)!=0){F=z;D=2757;break}c[a+5760>>2]=240;G=240;H=z;break}else{F=c[d+72>>2]|0;D=2757;break}}while(0);if((D|0)==2757){G=c[a+5760>>2]|0;H=F}F=a+5760|0;D=a+2880|0;d=720-G|0;aL[l&15](e,a+2880+(G<<2)|0,(d|0)>(f|0)?f:d,h,j);d=c[F>>2]|0;G=d+f|0;if((G|0)<720){c[F>>2]=G;i=m;return}G=a+8504|0;y=c[G>>2]|0;z=y+1|0;c[G>>2]=(z|0)>199?y-199|0:z;z=0;while(1){E=+g[5261448+(z<<2)>>2];g[s+(z<<3)>>2]=E*+g[a+2880+(z<<2)>>2];g[s+(z<<3)+4>>2]=E*+g[a+2880+(z+240<<2)>>2];G=(480-z|0)-1|0;g[s+(G<<3)>>2]=E*+g[a+2880+(G<<2)>>2];g[s+(G<<3)+4>>2]=E*+g[a+2880+(719-z<<2)>>2];G=z+1|0;if((G|0)==240){break}else{z=G}}z=a+8516+(y<<5)|0;dH(D|0,a+4800|0,960);D=(f-720|0)+d|0;aL[l&15](e,a+3840|0,D,(h+720|0)-d|0,j);c[F>>2]=D+240|0;bz(H,s|0,t|0);s=1;while(1){E=+g[t+(s<<3)>>2];H=480-s|0;I=+g[t+(H<<3)>>2];J=E+I;K=+g[t+(s<<3)+4>>2];L=+g[t+(H<<3)+4>>2];M=K-L;O=K+L;L=I-E;if(J<0.0){R=-0.0-J}else{R=J}if(M<0.0){S=-0.0-M}else{S=M}if(R+S<9.999999717180685e-10){T=M*999999995904.0;U=J*999999995904.0}else{T=M;U=J}J=U*U;M=T*T;do{if(J<M){E=(M+J*.6784840226173401)*(M+J*.0859554186463356);if(E!=0.0){V=(T<0.0?-1.5707963705062866:1.5707963705062866)+T*(-0.0-U)*(M+J*.43157973885536194)/E;break}else{V=T<0.0?-1.5707963705062866:1.5707963705062866;break}}else{E=(J+M*.6784840226173401)*(J+M*.0859554186463356);if(E!=0.0){I=U*T;V=(T<0.0?-1.5707963705062866:1.5707963705062866)+I*(J+M*.43157973885536194)/E-(I<0.0?-1.5707963705062866:1.5707963705062866);break}else{V=(T<0.0?-1.5707963705062866:1.5707963705062866)-(U*T<0.0?-1.5707963705062866:1.5707963705062866);break}}}while(0);M=V*.15915493667125702;H=a+(s<<2)|0;J=M- +g[H>>2];D=a+960+(s<<2)|0;I=J- +g[D>>2];if(O<0.0){W=-0.0-O}else{W=O}if(L<0.0){X=-0.0-L}else{X=L}if(W+X<9.999999717180685e-10){Y=L*999999995904.0;_=O*999999995904.0}else{Y=L;_=O}E=_*_;K=Y*Y;do{if(E<K){$=(K+E*.6784840226173401)*(K+E*.0859554186463356);if($!=0.0){aa=(Y<0.0?-1.5707963705062866:1.5707963705062866)+Y*(-0.0-_)*(K+E*.43157973885536194)/$;break}else{aa=Y<0.0?-1.5707963705062866:1.5707963705062866;break}}else{$=(E+K*.6784840226173401)*(E+K*.0859554186463356);if($!=0.0){ab=_*Y;aa=(Y<0.0?-1.5707963705062866:1.5707963705062866)+ab*(E+K*.43157973885536194)/$-(ab<0.0?-1.5707963705062866:1.5707963705062866);break}else{aa=(Y<0.0?-1.5707963705062866:1.5707963705062866)-(_*Y<0.0?-1.5707963705062866:1.5707963705062866);break}}}while(0);K=aa*.15915493667125702;E=K-M;O=E-J;L=I- +N(+(I+.5));if(L<0.0){ac=-0.0-L}else{ac=L}F=v+(s<<2)|0;g[F>>2]=ac;ab=L*L;L=O- +N(+(O+.5));if(L<0.0){ad=-0.0-L}else{ad=L}g[F>>2]=ad+ac;O=L*L;L=O*O;F=a+1920+(s<<2)|0;g[u+(s<<2)>>2]=1.0/((L+(ab*ab*2.0+ +g[F>>2]))*.25*62341.81640625+1.0)+-.014999999664723873;g[H>>2]=K;g[D>>2]=E;g[F>>2]=L;F=s+1|0;if((F|0)==240){break}else{s=F}}s=a+8516+(y<<5)+16|0;g[s>>2]=0.0;if((c[x>>2]|0)==0){g[a+6416>>2]=1.0e10;g[a+6488>>2]=-1.0e10;g[a+6420>>2]=1.0e10;g[a+6492>>2]=-1.0e10;g[a+6424>>2]=1.0e10;g[a+6496>>2]=-1.0e10;g[a+6428>>2]=1.0e10;g[a+6500>>2]=-1.0e10;g[a+6432>>2]=1.0e10;g[a+6504>>2]=-1.0e10;g[a+6436>>2]=1.0e10;g[a+6508>>2]=-1.0e10;g[a+6440>>2]=1.0e10;g[a+6512>>2]=-1.0e10;g[a+6444>>2]=1.0e10;g[a+6516>>2]=-1.0e10;g[a+6448>>2]=1.0e10;g[a+6520>>2]=-1.0e10;g[a+6452>>2]=1.0e10;g[a+6524>>2]=-1.0e10;g[a+6456>>2]=1.0e10;g[a+6528>>2]=-1.0e10;g[a+6460>>2]=1.0e10;g[a+6532>>2]=-1.0e10;g[a+6464>>2]=1.0e10;g[a+6536>>2]=-1.0e10;g[a+6468>>2]=1.0e10;g[a+6540>>2]=-1.0e10;g[a+6472>>2]=1.0e10;g[a+6544>>2]=-1.0e10;g[a+6476>>2]=1.0e10;g[a+6548>>2]=-1.0e10;g[a+6480>>2]=1.0e10;g[a+6552>>2]=-1.0e10;g[a+6484>>2]=1.0e10;g[a+6556>>2]=-1.0e10}F=a+6852|0;ac=0.0;ad=0.0;aa=0.0;Y=0.0;_=0.0;X=0.0;W=0.0;j=0;d=2;while(1){h=j+1|0;e=c[5245244+(h<<2)>>2]|0;L3925:do{if((d|0)<(e|0)){V=0.0;T=0.0;U=0.0;l=d;while(1){S=+g[t+(l<<3)>>2];f=480-l|0;R=+g[t+(f<<3)>>2];L=+g[t+(l<<3)+4>>2];E=+g[t+(f<<3)+4>>2];K=S*S+R*R+L*L+E*E;E=V+K;L=T+ +g[u+(l<<2)>>2]*K;R=U+K*2.0*(.5- +g[v+(l<<2)>>2]);f=l+1|0;if((f|0)<(e|0)){V=E;T=L;U=R;l=f}else{ae=E;af=L;ag=R;break L3925}}}else{ae=0.0;af=0.0;ag=0.0}}while(0);g[a+5840+((c[F>>2]|0)*72&-1)+(j<<2)>>2]=ae;I=ae+1.0000000036274937e-15;ah=_+ag/I;J=ae+1.000000013351432e-10;ai=ac+ +P(+J);M=+Z(+J);g[o+(j<<2)>>2]=M;D=a+6416+(j<<2)|0;J=+g[D>>2]+.009999999776482582;U=M<J?M:J;g[D>>2]=U;H=a+6488+(j<<2)|0;J=+g[H>>2]+-.10000000149011612;T=M>J?M:J;g[H>>2]=T;if(T<U+1.0){J=T+.5;g[H>>2]=J;V=U+-.5;g[D>>2]=V;aj=V;ak=J}else{aj=U;ak=T}T=+g[a+5840+(j<<2)>>2];U=+P(+T)+0.0;J=+g[a+5912+(j<<2)>>2];V=U+ +P(+J);U=+g[a+5984+(j<<2)>>2];R=V+ +P(+U);V=+g[a+6056+(j<<2)>>2];L=R+ +P(+V);R=+g[a+6128+(j<<2)>>2];E=L+ +P(+R);L=+g[a+6200+(j<<2)>>2];K=E+ +P(+L);E=+g[a+6272+(j<<2)>>2];S=K+ +P(+E);K=+g[a+6344+(j<<2)>>2];ab=S+ +P(+K);al=ad+(M-aj)/(ak+1.0000000036274937e-15-aj);M=ab/+P(+((T+0.0+J+U+V+R+L+E+K)*8.0+1.0000000036274937e-15));K=M>.9900000095367432?.9900000095367432:M;M=K*K;K=M*M;am=aa+K;M=af/I;D=a+5764+(j<<2)|0;I=+g[D>>2]*K;K=M>I?M:I;g[n+(j<<2)>>2]=K;I=W+K;if((j|0)>8){an=I- +g[n+(j-9<<2)>>2]}else{an=I}I=(+(j-18|0)*.029999999329447746+1.0)*an;ao=X>I?X:I;ap=Y+ +(j-8|0)*K;g[D>>2]=K;if((h|0)==18){break}else{ac=ai;ad=al;aa=am;Y=ap;_=ah;X=ao;W=an;j=h;d=e}}an=+g[a+6560>>2];W=an<0.0?0.0:an;an=+g[a+6564>>2];X=W>an?W:an;an=+g[a+6568>>2];W=X>an?X:an;an=+g[a+6572>>2];X=W>an?W:an;an=+g[a+6576>>2];W=X>an?X:an;an=+g[a+6580>>2];X=W>an?W:an;an=+g[a+6584>>2];W=X>an?X:an;an=+g[a+6588>>2];X=W>an?W:an;an=+g[a+6592>>2];W=X>an?X:an;an=+g[a+6596>>2];X=W>an?W:an;an=+g[a+6600>>2];W=X>an?X:an;an=+g[a+6604>>2];X=W>an?W:an;an=+g[a+6608>>2];W=X>an?X:an;an=+g[a+6612>>2];X=W>an?W:an;an=+g[a+6616>>2];W=X>an?X:an;an=+g[a+6620>>2];X=W>an?W:an;an=+g[a+6624>>2];W=X>an?X:an;an=+g[a+6628>>2];X=W>an?W:an;an=+g[a+6632>>2];W=X>an?X:an;an=+g[a+6636>>2];X=W>an?W:an;an=+g[a+6640>>2];d=k-8|0;W=.0005699999746866524/((d|0)<0?1.0:+(1<<d|0));_=W*W;W=1.0-A;Y=X>an?X:an;d=0;an=0.0;k=0;j=1;while(1){n=k+1|0;v=c[5259084+(n<<2)>>2]|0;L3938:do{if((j|0)<(v|0)){X=0.0;u=j;while(1){aa=+g[t+(u<<3)>>2];D=480-u|0;ad=+g[t+(D<<3)>>2];ac=+g[t+(u<<3)+4>>2];af=+g[t+(D<<3)+4>>2];aj=X+(aa*aa+ad*ad+ac*ac+af*af);D=u+1|0;if((D|0)==(v|0)){aq=aj;break L3938}else{X=aj;u=D}}}else{aq=0.0}}while(0);X=aq/+(v-j|0);aj=Y>X?Y:X;e=a+6560+(k<<2)|0;if((c[x>>2]|0)>2){af=A*X+W*+g[e>>2];ar=af;as=af}else{ar=X;as=X}g[e>>2]=as;af=X>ar?X:ar;X=an*.05000000074505806;ac=X>af?X:af;at=af>ac*.1&af*1.0e10>aj&af>_?k:d;if((n|0)==21){break}else{Y=aj;d=at;an=ac;k=n;j=v}}j=(c[x>>2]|0)<3?20:at;an=+ay(+ai)*20.0;at=a+6844|0;ai=+g[at>>2]+-.029999999329447746;Y=ai>an?ai:an;g[at>>2]=Y;at=a+6848|0;ai=(1.0-C)*+g[at>>2];if(an<Y+-30.0){au=C+ai}else{au=ai}g[at>>2]=au;au=0.0;k=0;while(1){av=au+ +g[5259696+(k<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{au=av;k=d}}g[p>>2]=av;au=0.0;k=0;while(1){aw=au+ +g[5259696+(k+16<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{au=aw;k=d}}g[p+4>>2]=aw;au=0.0;k=0;while(1){ax=au+ +g[5259696+(k+32<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{au=ax;k=d}}g[p+8>>2]=ax;au=0.0;k=0;while(1){az=au+ +g[5259696+(k+48<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{au=az;k=d}}g[p+12>>2]=az;au=0.0;k=0;while(1){aA=au+ +g[5259696+(k+64<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{au=aA;k=d}}g[p+16>>2]=aA;aA=0.0;k=0;while(1){aB=aA+ +g[5259696+(k+80<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{aA=aB;k=d}}g[p+20>>2]=aB;aB=0.0;k=0;while(1){aC=aB+ +g[5259696+(k+96<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{aB=aC;k=d}}g[p+24>>2]=aC;aC=0.0;k=0;while(1){aD=aC+ +g[5259696+(k+112<<2)>>2]*+g[o+(k<<2)>>2];d=k+1|0;if((d|0)==16){break}else{aC=aD;k=d}}g[p+28>>2]=aD;k=c[x>>2]|0;aD=ah/18.0;g[s>>2]=aD+(1.0-aD)*((k|0)<10?.5:al/18.0);al=ao/9.0;o=a+5836|0;ao=+g[o>>2]*.800000011920929;ah=al>ao?al:ao;g[o>>2]=ah;o=a+8516+(y<<5)+8|0;g[o>>2]=ap*.015625;c[F>>2]=((c[F>>2]|0)+1|0)%8;F=k+1|0;c[x>>2]=F;k=a+8516+(y<<5)+4|0;g[k>>2]=ah;ah=+g[a+6740>>2];ap=av+ah;ao=+g[a+6644>>2];al=+g[a+6708>>2];aC=ao+al;aB=+g[a+6676>>2];d=a+6772|0;aA=+g[d>>2];au=aB*.6969299912452698+(ap*-.12298999726772308+aC*.49195000529289246)-aA*1.4349000453948975;t=q|0;g[t>>2]=au;ai=+g[a+6744>>2];C=aw+ai;Y=+g[a+6648>>2];an=+g[a+6712>>2];_=Y+an;ar=+g[a+6680>>2];e=a+6776|0;as=+g[e>>2];W=ar*.6969299912452698+(C*-.12298999726772308+_*.49195000529289246)-as*1.4349000453948975;g[q+4>>2]=W;A=+g[a+6748>>2];aq=ax+A;ac=+g[a+6652>>2];aj=+g[a+6716>>2];af=ac+aj;X=+g[a+6684>>2];h=a+6780|0;ad=+g[h>>2];aa=X*.6969299912452698+(aq*-.12298999726772308+af*.49195000529289246)-ad*1.4349000453948975;g[q+8>>2]=aa;ak=+g[a+6752>>2];ae=+g[a+6656>>2];ag=+g[a+6720>>2];u=a+6784|0;K=+g[u>>2];I=+g[a+6688>>2]*.6969299912452698+((az+ak)*-.12298999726772308+(ae+ag)*.49195000529289246)-K*1.4349000453948975;g[q+12>>2]=I;M=am/18.0;am=1.0-B;g[d>>2]=am*aA+B*av;g[e>>2]=am*as+B*aw;g[h>>2]=am*ad+B*ax;g[u>>2]=am*K+B*az;K=(av-ah)*.6324599981307983+(ao-al)*.31622999906539917;g[q+16>>2]=K;al=(aw-ai)*.6324599981307983+(Y-an)*.31622999906539917;g[q+20>>2]=al;an=(ax-A)*.6324599981307983+(ac-aj)*.31622999906539917;g[q+24>>2]=an;aj=(az-ak)*.6324599981307983+(ae-ag)*.31622999906539917;g[q+28>>2]=aj;ag=ap*.5345199704170227-aC*.26725998520851135-aB*.5345199704170227;g[q+32>>2]=ag;g[q+36>>2]=C*.5345199704170227-_*.26725998520851135-ar*.5345199704170227;g[q+40>>2]=aq*.5345199704170227-af*.26725998520851135-X*.5345199704170227;do{if((F|0)>5){u=a+6804|0;g[u>>2]=am*+g[u>>2]+au*B*au;u=a+6808|0;g[u>>2]=am*+g[u>>2]+W*B*W;u=a+6812|0;g[u>>2]=am*+g[u>>2]+aa*B*aa;u=a+6816|0;g[u>>2]=am*+g[u>>2]+I*B*I;u=a+6820|0;g[u>>2]=am*+g[u>>2]+K*B*K;u=a+6824|0;g[u>>2]=am*+g[u>>2]+al*B*al;u=a+6828|0;g[u>>2]=am*+g[u>>2]+an*B*an;u=a+6832|0;g[u>>2]=am*+g[u>>2]+aj*B*aj;u=a+6836|0;g[u>>2]=am*+g[u>>2]+ag*B*ag;aE=0;aF=ao;aG=av;break}else{aE=0;aF=ao;aG=av}}while(0);while(1){F=a+6644+(aE+16<<2)|0;g[a+6644+(aE+24<<2)>>2]=+g[F>>2];u=a+6644+(aE+8<<2)|0;g[F>>2]=+g[u>>2];g[u>>2]=aF;g[a+6644+(aE<<2)>>2]=aG;u=aE+1|0;if((u|0)==8){break}aE=u;aF=+g[a+6644+(u<<2)>>2];aG=+g[p+(u<<2)>>2]}g[q+44>>2]=+P(+(+g[a+6804>>2]));g[q+48>>2]=+P(+(+g[a+6808>>2]));g[q+52>>2]=+P(+(+g[a+6812>>2]));g[q+56>>2]=+P(+(+g[a+6816>>2]));g[q+60>>2]=+P(+(+g[a+6820>>2]));g[q+64>>2]=+P(+(+g[a+6824>>2]));g[q+68>>2]=+P(+(+g[a+6828>>2]));g[q+72>>2]=+P(+(+g[a+6832>>2]));g[q+76>>2]=+P(+(+g[a+6836>>2]));g[q+80>>2]=+g[k>>2];g[q+84>>2]=+g[s>>2];g[q+88>>2]=M;g[q+92>>2]=+g[o>>2];g[q+96>>2]=+g[at>>2];at=r|0;dB(5251060,t,at);M=(+g[at>>2]+1.0)*.5;aG=M*M*1.2100000381469727+.009999999776482582- +Q(+M,10.0)*.23000000417232513;t=r+4|0;M=+g[t>>2]*.5+.5;g[t>>2]=M;aF=aG*M+(1.0-M)*.5;g[at>>2]=aF;aG=M*4999999873689376.0e-20;do{if(aF<=.949999988079071&aF<.05000000074505806){aH=.05000000074505806}else{if(aF>.949999988079071){aH=.949999988079071;break}aH=aF}}while(0);at=a+6840|0;av=+g[at>>2];do{if(av<=.949999988079071&av<.05000000074505806){aI=.05000000074505806}else{if(av>.949999988079071){aI=.949999988079071;break}aI=av}}while(0);ao=aH-aI;if(ao<0.0){aJ=-0.0-ao}else{aJ=ao}ao=1.0-av;ag=1.0-aG;B=1.0-aF;am=aJ*.05/((1.0-aH)*aI+aH*(1.0-aI))+.01;aI=(aG*av+ag*ao)*+Q(+B,+am);aH=aF;aJ=(ag*av+aG*ao)*+Q(+aH,+am);ao=aJ/(aI+aJ);g[at>>2]=ao;g[a+8516+(y<<5)+20>>2]=ao;ao=+Q(+B,+am);B=+Q(+aH,+am);t=a+6888|0;if((c[x>>2]|0)==1){g[t>>2]=.5;g[a+7688>>2]=.5;aK=.5;aM=.5}else{aK=+g[t>>2];aM=+g[a+7688>>2]}am=aK+ +g[a+6892>>2];aK=aM+ +g[a+7692>>2];g[a+6888>>2]=ao*ag*am;g[a+7688>>2]=B*ag*aK;t=1;while(1){x=t+1|0;g[a+6888+(t<<2)>>2]=ao*+g[a+6888+(x<<2)>>2];g[a+7688+(t<<2)>>2]=B*+g[a+7688+(x<<2)>>2];if((x|0)==199){break}else{t=x}}g[a+7684>>2]=ao*aG*aK;g[a+8484>>2]=B*aG*am;am=9.999999682655225e-21;t=0;while(1){aN=am+(+g[a+6888+(t<<2)>>2]+ +g[a+7688+(t<<2)>>2]);x=t+1|0;if((x|0)==200){break}else{am=aN;t=x}}am=1.0/aN;t=0;while(1){x=a+6888+(t<<2)|0;g[x>>2]=am*+g[x>>2];x=a+7688+(t<<2)|0;g[x>>2]=am*+g[x>>2];x=t+1|0;if((x|0)==200){break}else{t=x}}do{if(M>.75){am=+g[at>>2];if(am>.9){t=a+8500|0;x=(c[t>>2]|0)+1|0;c[t>>2]=(x|0)<500?x:500;t=a+8492|0;aN=+g[t>>2];aG=aF-aN;g[t>>2]=aN+1.0/+(x|0)*(aG<-.20000000298023224?-.20000000298023224:aG)}if(am>=.1){break}x=a+8496|0;t=(c[x>>2]|0)+1|0;c[x>>2]=(t|0)<500?t:500;x=a+8488|0;am=+g[x>>2];aG=aF-am;g[x>>2]=am+1.0/+(t|0)*(aG>.20000000298023224?.20000000298023224:aG)}else{if((c[a+8500>>2]|0)==0){g[a+8492>>2]=.8999999761581421}if((c[a+8496>>2]|0)!=0){break}g[a+8488>>2]=.10000000149011612}}while(0);t=a+6856|0;x=+g[at>>2]>.5&1;if((c[t>>2]|0)!=(x|0)){c[w>>2]=0}c[t>>2]=x;do{if((j|0)<13){c[a+6868>>2]=1101;aO=1101}else{if((j|0)<15){c[a+6868>>2]=1102;aO=1102;break}if((j|0)<17){c[a+6868>>2]=1103;aO=1103;break}x=a+6868|0;if((j|0)<19){c[x>>2]=1104;aO=1104;break}else{c[x>>2]=1105;aO=1105;break}}}while(0);c[a+8516+(y<<5)+24>>2]=j;c[a+8516+(y<<5)+28>>2]=aO;g[a+8516+(y<<5)+12>>2]=aD;c[z>>2]=1;if((b|0)==0){i=m;return}dH(b|0,z|0,32);i=m;return}function dA(a,b,d,e,f,h,i,j,k,l,m,n,o){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;p=(j*195&-1|0)/100&-1;q=(p|0)<(f|0)?p:f;f=a+6884|0;p=q-(c[f>>2]|0)|0;r=0;while(1){dz(a,0,b,e,(p|0)>480?480:p,r,i,m,n);s=p-480|0;if((s|0)>0){p=s;r=r+480|0}else{break}}c[f>>2]=q;L4040:do{if((h|0)==5010){if((q|0)<((j|0)/200&-1|0)){t=2883;break}r=(j|0)/400&-1;p=cZ(d,q,i,j,k,+g[a+5836>>2],a+6872|0,l,n)|0;while(1){m=r<<p;if((m|0)>(q|0)){p=p-1|0}else{u=m;break L4040}}}else{t=2883}}while(0);do{if((t|0)==2883){n=(j|0)/400&-1;if((n|0)>(q|0)){v=-1;return v|0}do{if((h|0)==5e3){w=q}else if((h|0)==5010){x=(j|0)/50&-1;t=2888;break}else{l=h-5001|0;if(l>>>0<6){k=(j*3&-1|0)/50&-1;i=n<<l;x=(k|0)<(i|0)?k:i;t=2888;break}else{v=-1;return v|0}}}while(0);do{if((t|0)==2888){if((x|0)>(q|0)){v=-1}else{w=x;break}return v|0}}while(0);if((w*400&-1|0)==(j|0)|(w*200&-1|0)==(j|0)|(w*100&-1|0)==(j|0)){u=w;break}n=w*50&-1;if((n|0)==(j|0)|(w*25&-1|0)==(j|0)|(n|0)==(j*3&-1|0)){u=w;break}else{v=-1}return v|0}}while(0);if((u|0)<0){v=-1;return v|0}c[f>>2]=(c[f>>2]|0)-u|0;c[o>>2]=0;dy(a,o,u);v=u;return v|0}function dB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0.0,q=0,r=0,s=0,t=0.0,u=0,v=0.0,w=0,x=0.0,y=0,z=0.0,A=0.0,B=0.0,C=0.0,D=0,E=0,F=0,G=0,H=0,I=0.0,J=0.0,K=0,L=0.0,M=0.0,O=0.0;e=i;i=i+400|0;f=e|0;h=c[a+8>>2]|0;j=a+4|0;a=c[j>>2]|0;k=a+4|0;l=c[k>>2]|0;L4068:do{if((l|0)>0){m=c[a>>2]|0;n=0;o=h;while(1){p=+g[o>>2];q=o+4|0;if((m|0)>0){r=(m|0)>1;s=0;t=p;u=q;while(1){v=t+ +g[b+(s<<2)>>2]*+g[u>>2];w=s+1|0;if((w|0)<(m|0)){s=w;t=v;u=u+4|0}else{break}}x=v;y=o+((r?m+1|0:2)<<2)|0}else{x=p;y=q}do{if(x<8.0){if(x<=-8.0){z=-1.0;break}if(x<0.0){A=-1.0;B=-0.0-x}else{A=1.0;B=x}u=~~+N(+(B*25.0+.5));t=B- +(u|0)*.03999999910593033;C=+g[5245328+(u<<2)>>2];z=A*(C+(1.0-C*C)*t*(1.0-C*t))}else{z=1.0}}while(0);g[f+(n<<2)>>2]=z;q=n+1|0;r=c[k>>2]|0;if((q|0)<(r|0)){n=q;o=y}else{D=y;E=r;break L4068}}}else{D=h;E=l}}while(0);if((c[a+8>>2]|0)>0){F=0;G=D;H=E}else{i=e;return}while(1){z=+g[G>>2];E=G+4|0;if((H|0)>0){D=(H|0)>1;a=0;A=z;l=E;while(1){I=A+ +g[f+(a<<2)>>2]*+g[l>>2];h=a+1|0;if((h|0)<(H|0)){a=h;A=I;l=l+4|0}else{break}}J=I;K=G+((D?H+1|0:2)<<2)|0}else{J=z;K=E}do{if(J<8.0){if(J<=-8.0){L=-1.0;break}if(J<0.0){M=-1.0;O=-0.0-J}else{M=1.0;O=J}l=~~+N(+(O*25.0+.5));A=O- +(l|0)*.03999999910593033;B=+g[5245328+(l<<2)>>2];L=M*(B+(1.0-B*B)*A*(1.0-B*A))}else{L=1.0}}while(0);g[d+(F<<2)>>2]=L;E=F+1|0;D=c[j>>2]|0;if((E|0)>=(c[D+8>>2]|0)){break}F=E;G=K;H=c[D+4>>2]|0}i=e;return}function dC(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,aq=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aF=0,aH=0,aI=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1315652]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5262648+(h<<2)|0;j=5262648+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1315652]=e&(1<<g^-1)}else{if(l>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{ar();return 0;return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1315654]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5262648+(p<<2)|0;m=5262648+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1315652]=e&(1<<r^-1)}else{if(l>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{ar();return 0;return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1315654]|0;if((l|0)!=0){q=c[1315657]|0;d=l>>>3;l=d<<1;f=5262648+(l<<2)|0;k=c[1315652]|0;h=1<<d;do{if((k&h|0)==0){c[1315652]=k|h;s=f;t=5262648+(l+2<<2)|0}else{d=5262648+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1315656]|0)>>>0){s=g;t=d;break}ar();return 0;return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1315654]=m;c[1315657]=e;n=i;return n|0}l=c[1315653]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5262912+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1315656]|0;if(r>>>0<i>>>0){ar();return 0;return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){ar();return 0;return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L56:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L56}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){ar();return 0;return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){ar();return 0;return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){ar();return 0;return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{ar();return 0;return 0}}}while(0);L78:do{if((e|0)!=0){f=d+28|0;i=5262912+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1315653]=c[1315653]&(1<<c[f>>2]^-1);break L78}else{if(e>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L78}}}while(0);if(v>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1315654]|0;if((f|0)!=0){e=c[1315657]|0;i=f>>>3;f=i<<1;q=5262648+(f<<2)|0;k=c[1315652]|0;g=1<<i;do{if((k&g|0)==0){c[1315652]=k|g;y=q;z=5262648+(f+2<<2)|0}else{i=5262648+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1315656]|0)>>>0){y=l;z=i;break}ar();return 0;return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1315654]=p;c[1315657]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1315653]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5262912+(A<<2)>>2]|0;L126:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L126}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L126}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5262912+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L141:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L141}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1315654]|0)-g|0)>>>0){o=g;break}k=K;q=c[1315656]|0;if(k>>>0<q>>>0){ar();return 0;return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){ar();return 0;return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L154:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L154}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){ar();return 0;return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){ar();return 0;return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){ar();return 0;return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{ar();return 0;return 0}}}while(0);L176:do{if((e|0)!=0){i=K+28|0;q=5262912+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1315653]=c[1315653]&(1<<c[i>>2]^-1);break L176}else{if(e>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L176}}}while(0);if(L>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5262648+(e<<2)|0;r=c[1315652]|0;j=1<<i;do{if((r&j|0)==0){c[1315652]=r|j;O=q;P=5262648+(e+2<<2)|0}else{i=5262648+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1315656]|0)>>>0){O=d;P=i;break}ar();return 0;return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5262912+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1315653]|0;l=1<<Q;if((q&l|0)==0){c[1315653]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=151;break}else{l=l<<1;q=j}}if((T|0)==151){if(S>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1315656]|0;if(q>>>0<i>>>0){ar();return 0;return 0}if(j>>>0<i>>>0){ar();return 0;return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1315654]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1315657]|0;if(S>>>0>15){R=J;c[1315657]=R+o|0;c[1315654]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1315654]=0;c[1315657]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1315655]|0;if(o>>>0<J>>>0){S=J-o|0;c[1315655]=S;J=c[1315658]|0;K=J;c[1315658]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1312768]|0)==0){J=ap(8)|0;if((J-1&J|0)==0){c[1312770]=J;c[1312769]=J;c[1312771]=-1;c[1312772]=2097152;c[1312773]=0;c[1315763]=0;c[1312768]=aJ(0)&-16^1431655768;break}else{ar();return 0;return 0}}}while(0);J=o+48|0;S=c[1312770]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1315762]|0;do{if((O|0)!=0){P=c[1315760]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L268:do{if((c[1315763]&4|0)==0){O=c[1315658]|0;L270:do{if((O|0)==0){T=181}else{L=O;P=5263056;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=181;break L270}else{P=M}}if((P|0)==0){T=181;break}L=R-(c[1315655]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=aE(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=190;break}}while(0);do{if((T|0)==181){O=aE(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1312769]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1315760]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1315762]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=aE($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=190;break}}while(0);L290:do{if((T|0)==190){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=201;break L268}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1312770]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((aE(O|0)|0)==-1){aE(q|0);W=Y;break L290}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=201;break L268}}}while(0);c[1315763]=c[1315763]|4;ad=W;T=198;break}else{ad=0;T=198}}while(0);do{if((T|0)==198){if(S>>>0>=2147483647){break}W=aE(S|0)|0;Z=aE(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=201;break}}}while(0);do{if((T|0)==201){ad=(c[1315760]|0)+aa|0;c[1315760]=ad;if(ad>>>0>(c[1315761]|0)>>>0){c[1315761]=ad}ad=c[1315658]|0;L310:do{if((ad|0)==0){S=c[1315656]|0;if((S|0)==0|ab>>>0<S>>>0){c[1315656]=ab}c[1315764]=ab;c[1315765]=aa;c[1315767]=0;c[1315661]=c[1312768]|0;c[1315660]=-1;S=0;while(1){Y=S<<1;ac=5262648+(Y<<2)|0;c[5262648+(Y+3<<2)>>2]=ac;c[5262648+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1315658]=ab+ae|0;c[1315655]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1315659]=c[1312772]|0}else{S=5263056;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=213;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==213){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1315658]|0;Y=(c[1315655]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1315658]=Z+ai|0;c[1315655]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1315659]=c[1312772]|0;break L310}}while(0);if(ab>>>0<(c[1315656]|0)>>>0){c[1315656]=ab}S=ab+aa|0;Y=5263056;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=223;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==223){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[1315658]|0)){J=(c[1315655]|0)+K|0;c[1315655]=J;c[1315658]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1315657]|0)){J=(c[1315654]|0)+K|0;c[1315654]=J;c[1315657]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L355:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=5262648+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}if((c[U+12>>2]|0)==(Z|0)){break}ar();return 0;return 0}}while(0);if((Q|0)==(U|0)){c[1315652]=c[1315652]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}ar();return 0;return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L376:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){an=0;break L376}else{ao=M;aq=e;break}}else{ao=L;aq=g}}while(0);while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;aq=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;aq=g}}if(aq>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[aq>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){ar();return 0;return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;an=P;break}else{ar();return 0;return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=5262912+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[1315653]=c[1315653]&(1<<c[P>>2]^-1);break L355}else{if(q>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[q+20>>2]=an}if((an|0)==0){break L355}}}while(0);if(an>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}c[an+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);as=ab+(($|al)+aa|0)|0;at=$+K|0}else{as=Z;at=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=at|1;c[ab+(at+W|0)>>2]=at;J=at>>>3;if(at>>>0<256){V=J<<1;X=5262648+(V<<2)|0;P=c[1315652]|0;q=1<<J;do{if((P&q|0)==0){c[1315652]=P|q;au=X;av=5262648+(V+2<<2)|0}else{J=5262648+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1315656]|0)>>>0){au=U;av=J;break}ar();return 0;return 0}}while(0);c[av>>2]=_;c[au+12>>2]=_;c[ab+(W+8|0)>>2]=au;c[ab+(W+12|0)>>2]=X;break}V=ac;q=at>>>8;do{if((q|0)==0){aw=0}else{if(at>>>0>16777215){aw=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;aw=at>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5262912+(aw<<2)|0;c[ab+(W+28|0)>>2]=aw;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1315653]|0;Q=1<<aw;if((X&Q|0)==0){c[1315653]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((aw|0)==31){ax=0}else{ax=25-(aw>>>1)|0}Q=at<<ax;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(at|0)){break}ay=X+16+(Q>>>31<<2)|0;q=c[ay>>2]|0;if((q|0)==0){T=296;break}else{Q=Q<<1;X=q}}if((T|0)==296){if(ay>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[ay>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1315656]|0;if(X>>>0<$>>>0){ar();return 0;return 0}if(q>>>0<$>>>0){ar();return 0;return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=5263056;while(1){az=c[W>>2]|0;if(az>>>0<=Y>>>0){aA=c[W+4>>2]|0;aB=az+aA|0;if(aB>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=az+(aA-39|0)|0;if((W&7|0)==0){aC=0}else{aC=-W&7}W=az+((aA-47|0)+aC|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aD=0}else{aD=-_&7}_=(aa-40|0)-aD|0;c[1315658]=ab+aD|0;c[1315655]=_;c[ab+(aD+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1315659]=c[1312772]|0;c[ac+4>>2]=27;c[W>>2]=c[1315764]|0;c[W+4>>2]=c[5263060>>2]|0;c[W+8>>2]=c[5263064>>2]|0;c[W+12>>2]=c[5263068>>2]|0;c[1315764]=ab;c[1315765]=aa;c[1315767]=0;c[1315766]=W;W=ac+28|0;c[W>>2]=7;L474:do{if((ac+32|0)>>>0<aB>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<aB>>>0){_=K}else{break L474}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5262648+(K<<2)|0;S=c[1315652]|0;q=1<<_;do{if((S&q|0)==0){c[1315652]=S|q;aF=Z;aH=5262648+(K+2<<2)|0}else{_=5262648+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1315656]|0)>>>0){aF=Q;aH=_;break}ar();return 0;return 0}}while(0);c[aH>>2]=ad;c[aF+12>>2]=ad;c[ad+8>>2]=aF;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aI=0}else{if(W>>>0>16777215){aI=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aI=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5262912+(aI<<2)|0;c[ad+28>>2]=aI;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1315653]|0;Q=1<<aI;if((Z&Q|0)==0){c[1315653]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aI|0)==31){aK=0}else{aK=25-(aI>>>1)|0}Q=W<<aK;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aL=Z+16+(Q>>>31<<2)|0;q=c[aL>>2]|0;if((q|0)==0){T=331;break}else{Q=Q<<1;Z=q}}if((T|0)==331){if(aL>>>0<(c[1315656]|0)>>>0){ar();return 0;return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1315656]|0;if(Z>>>0<q>>>0){ar();return 0;return 0}if(W>>>0<q>>>0){ar();return 0;return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1315655]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1315655]=W;ad=c[1315658]|0;Q=ad;c[1315658]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[aG()>>2]=12;n=0;return n|0}
function dD(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1315656]|0;if(b>>>0<e>>>0){ar()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){ar()}h=f&-8;i=a+(h-8|0)|0;j=i;L527:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){ar()}if((n|0)==(c[1315657]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1315654]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=5262648+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){ar()}if((c[k+12>>2]|0)==(n|0)){break}ar()}}while(0);if((s|0)==(k|0)){c[1315652]=c[1315652]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){ar()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}ar()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L561:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L561}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){ar()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){ar()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){ar()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{ar()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=5262912+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1315653]=c[1315653]&(1<<c[v>>2]^-1);q=n;r=o;break L527}else{if(p>>>0<(c[1315656]|0)>>>0){ar()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L527}}}while(0);if(A>>>0<(c[1315656]|0)>>>0){ar()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1315656]|0)>>>0){ar()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1315656]|0)>>>0){ar()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){ar()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){ar()}do{if((e&2|0)==0){if((j|0)==(c[1315658]|0)){B=(c[1315655]|0)+r|0;c[1315655]=B;c[1315658]=q;c[q+4>>2]=B|1;if((q|0)==(c[1315657]|0)){c[1315657]=0;c[1315654]=0}if(B>>>0<=(c[1315659]|0)>>>0){return}dE(0);return}if((j|0)==(c[1315657]|0)){B=(c[1315654]|0)+r|0;c[1315654]=B;c[1315657]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L632:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=5262648+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[1315656]|0)>>>0){ar()}if((c[u+12>>2]|0)==(j|0)){break}ar()}}while(0);if((g|0)==(u|0)){c[1315652]=c[1315652]&(1<<C^-1);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[1315656]|0)>>>0){ar()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}ar()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16|0)>>2]|0;t=c[a+(h|4)>>2]|0;L653:do{if((t|0)==(b|0)){p=a+(h+12|0)|0;v=c[p>>2]|0;do{if((v|0)==0){m=a+(h+8|0)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break L653}else{F=k;G=m;break}}else{F=v;G=p}}while(0);while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[1315656]|0)>>>0){ar()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[1315656]|0)>>>0){ar()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){ar()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{ar()}}}while(0);if((f|0)==0){break}t=a+(h+20|0)|0;u=5262912+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1315653]=c[1315653]&(1<<c[t>>2]^-1);break L632}else{if(f>>>0<(c[1315656]|0)>>>0){ar()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L632}}}while(0);if(E>>>0<(c[1315656]|0)>>>0){ar()}c[E+24>>2]=f;b=c[a+(h+8|0)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[1315656]|0)>>>0){ar()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12|0)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[1315656]|0)>>>0){ar()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[1315657]|0)){H=B;break}c[1315654]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=5262648+(d<<2)|0;A=c[1315652]|0;E=1<<r;do{if((A&E|0)==0){c[1315652]=A|E;I=e;J=5262648+(d+2<<2)|0}else{r=5262648+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1315656]|0)>>>0){I=h;J=r;break}ar()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=(14-(E|J|d)|0)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=5262912+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1315653]|0;d=1<<K;do{if((r&d|0)==0){c[1315653]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=510;break}else{A=A<<1;J=E}}if((N|0)==510){if(M>>>0<(c[1315656]|0)>>>0){ar()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[1315656]|0;if(J>>>0<E>>>0){ar()}if(B>>>0<E>>>0){ar()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[1315660]|0)-1|0;c[1315660]=q;if((q|0)==0){O=5263064}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[1315660]=-1;return}function dE(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;do{if((c[1312768]|0)==0){b=ap(8)|0;if((b-1&b|0)==0){c[1312770]=b;c[1312769]=b;c[1312771]=-1;c[1312772]=2097152;c[1312773]=0;c[1315763]=0;c[1312768]=aJ(0)&-16^1431655768;break}else{ar();return 0;return 0}}}while(0);if(a>>>0>=4294967232){d=0;e=d&1;return e|0}b=c[1315658]|0;if((b|0)==0){d=0;e=d&1;return e|0}f=c[1315655]|0;do{if(f>>>0>(a+40|0)>>>0){g=c[1312770]|0;h=$(((((((-40-a|0)-1|0)+f|0)+g|0)>>>0)/(g>>>0)>>>0)-1|0,g);i=b;j=5263056;while(1){k=c[j>>2]|0;if(k>>>0<=i>>>0){if((k+(c[j+4>>2]|0)|0)>>>0>i>>>0){l=j;break}}k=c[j+8>>2]|0;if((k|0)==0){l=0;break}else{j=k}}if((c[l+12>>2]&8|0)!=0){break}j=aE(0)|0;i=l+4|0;if((j|0)!=((c[l>>2]|0)+(c[i>>2]|0)|0)){break}k=aE(-(h>>>0>2147483646?-2147483648-g|0:h)|0)|0;m=aE(0)|0;if(!((k|0)!=-1&m>>>0<j>>>0)){break}k=j-m|0;if((j|0)==(m|0)){break}c[i>>2]=(c[i>>2]|0)-k|0;c[1315760]=(c[1315760]|0)-k|0;i=c[1315658]|0;n=(c[1315655]|0)-k|0;k=i;o=i+8|0;if((o&7|0)==0){p=0}else{p=-o&7}o=n-p|0;c[1315658]=k+p|0;c[1315655]=o;c[k+(p+4|0)>>2]=o|1;c[k+(n+4|0)>>2]=40;c[1315659]=c[1312772]|0;d=(j|0)!=(m|0);e=d&1;return e|0}}while(0);if((c[1315655]|0)>>>0<=(c[1315659]|0)>>>0){d=0;e=d&1;return e|0}c[1315659]=-1;d=0;e=d&1;return e|0}function dF(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function dG(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function dH(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function dI(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{dH(b,c,d)}}function dJ(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function dK(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(D=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function dL(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(D=e,a-c>>>0|0)|0}function dM(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}D=a<<c-32;return 0}function dN(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=0;return b>>>c-32|0}function dO(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=(b|0)<0?-1:0;return b>>c-32|0}function dP(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function dQ(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=$(d,c);f=a>>>16;a=(e>>>16)+$(d,f)|0;d=b>>>16;b=$(d,c);return(D=((a>>>16)+$(d,f)|0)+(((a&65535)+b|0)>>>16)|0,0|(a+b<<16|e&65535))|0}function dR(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=dL(e^a,f^b,e,f)|0;b=D;a=g^e;e=h^f;f=dL(dW(i,b,dL(g^c,h^d,g,h)|0,D,0)^a,D^e,a,e)|0;return(D=D,f)|0}function dS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=dL(h^a,j^b,h,j)|0;b=D;dW(m,b,dL(k^d,l^e,k,l)|0,D,g);l=dL(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=D;i=f;return(D=j,l)|0}function dT(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=dQ(e,a)|0;f=D;return(D=($(b,a)+$(d,e)|0)+f|f&0,0|c&-1)|0}function dU(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=dW(a,b,c,d,0)|0;return(D=D,e)|0}function dV(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;dW(a,b,d,e,g);i=f;return(D=c[g+4>>2]|0,c[g>>2]|0)|0}function dW(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(D=n,o)|0}else{if(!m){n=0;o=0;return(D=n,o)|0}c[f>>2]=a&-1;c[f+4>>2]=b&0;n=0;o=0;return(D=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(D=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(D=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=0|a&-1;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((dP(l|0)|0)>>>0);return(D=n,o)|0}p=(dG(l|0)|0)-(dG(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}else{if(!m){r=(dG(l|0)|0)-(dG(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=((dG(j|0)|0)+33|0)-(dG(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=0|a&-1;return(D=n,o)|0}else{p=dP(j|0)|0;n=0|i>>>(p>>>0);o=i<<32-p|g>>>(p>>>0)|0;return(D=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;E=u;F=t;G=0;H=0}else{g=0|d&-1;d=k|e&0;e=dK(g,d,-1,-1)|0;k=D;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=0|(u<<1|i>>>31);a=u>>>31|v<<1|0;dL(e,k,j,a);b=D;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=dL(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=D;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;E=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=0|F;c[f+4>>2]=E|0}n=(0|K)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(D=n,o)|0}function dX(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aL[a&15](b|0,c|0,d|0,e|0,f|0)}function dY(a,b){a=a|0;b=b|0;aM[a&15](b|0)}function dZ(a,b){a=a|0;b=b|0;return aN[a&15](b|0)|0}function d_(a){a=a|0;aO[a&15]()}function d$(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;aP[a&15](b|0,c|0,d|0,e|0,f|0,g|0)}function d0(a,b,c){a=a|0;b=b|0;c=c|0;return aQ[a&15](b|0,c|0)|0}function d1(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(0)}function d2(a){a=a|0;aa(1)}function d3(a){a=a|0;aa(2);return 0}function d4(){aa(3)}function d5(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aa(4)}function d6(a,b){a=a|0;b=b|0;aa(5);return 0}
// EMSCRIPTEN_END_FUNCS
var aL=[d1,d1,d1,d1,d1,d1,cS,d1,d1,d1,cR,d1,d1,d1,d1,d1];var aM=[d2,d2,d2,d2,d2,d2,d2,d2,d2,d2,d2,d2,d2,d2,d2,d2];var aN=[d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3];var aO=[d4,d4,d4,d4,d4,d4,d4,d4,d4,d4,d4,d4,d4,d4,d4,d4];var aP=[d5,d5,c6,d5,c7,d5,d5,d5,dg,d5,d5,d5,dn,d5,d5,d5];var aQ=[d6,d6,d6,d6,d6,d6,d6,d6,d6,d6,d6,d6,d6,d6,d6,d6];return{_opus_repacketizer_init:dh,_opus_packet_get_nb_channels:cM,_opus_repacketizer_get_nb_frames:di,_opus_decode_float:cU,_opus_repacketizer_destroy:dt,_opus_encoder_get_size:cN,_opus_encoder_destroy:c4,_opus_multistream_decoder_destroy:dr,_opus_decoder_destroy:cW,_opus_multistream_decoder_ctl:dq,_opus_decoder_get_size:cC,_opus_get_version_string:a9,_opus_strerror:ba,_opus_packet_get_bandwidth:cK,_opus_decoder_create:cG,_opus_packet_get_samples_per_frame:cL,_opus_multistream_decoder_create:dk,_opus_multistream_decoder_get_size:c5,_opus_repacketizer_out_range:dw,_opus_multistream_encode:dc,_opus_multistream_encoder_get_size:c0,_memcpy:dH,_opus_multistream_encoder_create:c9,_opus_multistream_encode_float:da,_opus_packet_get_nb_frames:cO,_memset:dF,_opus_decoder_init:cF,_opus_repacketizer_get_size:df,_opus_multistream_encoder_init:c8,_opus_multistream_decoder_init:dj,_opus_encode:c1,_opus_multistream_encoder_destroy:de,_opus_packet_get_nb_samples:cP,_opus_repacketizer_cat:du,_opus_encoder_ctl:c2,_opus_decoder_get_nb_samples:cQ,_opus_multistream_encoder_ctl:dd,_opus_repacketizer_create:ds,_strlen:dJ,_opus_packet_parse:cH,_free:dD,_opus_multistream_decode:dl,_opus_encode_float:c3,_opus_pcm_soft_clip:cD,_memmove:dI,_malloc:dC,_opus_decoder_ctl:cV,_opus_encoder_create:cY,_llvm_ctlz_i32:dG,_opus_encoder_init:cX,_opus_decode:cT,_opus_multistream_decode_float:dp,_opus_repacketizer_out:dx,stackAlloc:aR,stackSave:aS,stackRestore:aT,setThrew:aU,setTempRet0:aV,setTempRet1:aW,setTempRet2:aX,setTempRet3:aY,setTempRet4:aZ,setTempRet5:a_,setTempRet6:a$,setTempRet7:a0,setTempRet8:a1,setTempRet9:a2,dynCall_viiiii:dX,dynCall_vi:dY,dynCall_ii:dZ,dynCall_v:d_,dynCall_viiiiii:d$,dynCall_iii:d0}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_viiiii: invoke_viiiii, invoke_vi: invoke_vi, invoke_ii: invoke_ii, invoke_v: invoke_v, invoke_viiiiii: invoke_viiiiii, invoke_iii: invoke_iii, _llvm_va_end: _llvm_va_end, _llvm_lifetime_end: _llvm_lifetime_end, _sysconf: _sysconf, _rint: _rint, _abort: _abort, _sqrtf: _sqrtf, _llvm_stacksave: _llvm_stacksave, _llvm_stackrestore: _llvm_stackrestore, _atan2: _atan2, ___setErrNo: ___setErrNo, _sqrt: _sqrt, _log10: _log10, _silk_encode_do_VAD_FLP: _silk_encode_do_VAD_FLP, _floorf: _floorf, _log: _log, _cos: _cos, _llvm_pow_f64: _llvm_pow_f64, _sbrk: _sbrk, _floor: _floor, ___errno_location: ___errno_location, _silk_encode_frame_FLP: _silk_encode_frame_FLP, _exp: _exp, _time: _time, _llvm_lifetime_start: _llvm_lifetime_start, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, cttz_i8: cttz_i8, ctlz_i8: ctlz_i8, NaN: NaN, Infinity: Infinity }, buffer);
var _opus_repacketizer_init = Module["_opus_repacketizer_init"] = asm._opus_repacketizer_init;
var _opus_packet_get_nb_channels = Module["_opus_packet_get_nb_channels"] = asm._opus_packet_get_nb_channels;
var _opus_repacketizer_get_nb_frames = Module["_opus_repacketizer_get_nb_frames"] = asm._opus_repacketizer_get_nb_frames;
var _opus_decode_float = Module["_opus_decode_float"] = asm._opus_decode_float;
var _opus_repacketizer_destroy = Module["_opus_repacketizer_destroy"] = asm._opus_repacketizer_destroy;
var _opus_encoder_get_size = Module["_opus_encoder_get_size"] = asm._opus_encoder_get_size;
var _opus_encoder_destroy = Module["_opus_encoder_destroy"] = asm._opus_encoder_destroy;
var _opus_multistream_decoder_destroy = Module["_opus_multistream_decoder_destroy"] = asm._opus_multistream_decoder_destroy;
var _opus_decoder_destroy = Module["_opus_decoder_destroy"] = asm._opus_decoder_destroy;
var _opus_multistream_decoder_ctl = Module["_opus_multistream_decoder_ctl"] = asm._opus_multistream_decoder_ctl;
var _opus_decoder_get_size = Module["_opus_decoder_get_size"] = asm._opus_decoder_get_size;
var _opus_get_version_string = Module["_opus_get_version_string"] = asm._opus_get_version_string;
var _opus_strerror = Module["_opus_strerror"] = asm._opus_strerror;
var _opus_packet_get_bandwidth = Module["_opus_packet_get_bandwidth"] = asm._opus_packet_get_bandwidth;
var _opus_decoder_create = Module["_opus_decoder_create"] = asm._opus_decoder_create;
var _opus_packet_get_samples_per_frame = Module["_opus_packet_get_samples_per_frame"] = asm._opus_packet_get_samples_per_frame;
var _opus_multistream_decoder_create = Module["_opus_multistream_decoder_create"] = asm._opus_multistream_decoder_create;
var _opus_multistream_decoder_get_size = Module["_opus_multistream_decoder_get_size"] = asm._opus_multistream_decoder_get_size;
var _opus_repacketizer_out_range = Module["_opus_repacketizer_out_range"] = asm._opus_repacketizer_out_range;
var _opus_multistream_encode = Module["_opus_multistream_encode"] = asm._opus_multistream_encode;
var _opus_multistream_encoder_get_size = Module["_opus_multistream_encoder_get_size"] = asm._opus_multistream_encoder_get_size;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var _opus_multistream_encoder_create = Module["_opus_multistream_encoder_create"] = asm._opus_multistream_encoder_create;
var _opus_multistream_encode_float = Module["_opus_multistream_encode_float"] = asm._opus_multistream_encode_float;
var _opus_packet_get_nb_frames = Module["_opus_packet_get_nb_frames"] = asm._opus_packet_get_nb_frames;
var _memset = Module["_memset"] = asm._memset;
var _opus_decoder_init = Module["_opus_decoder_init"] = asm._opus_decoder_init;
var _opus_repacketizer_get_size = Module["_opus_repacketizer_get_size"] = asm._opus_repacketizer_get_size;
var _opus_multistream_encoder_init = Module["_opus_multistream_encoder_init"] = asm._opus_multistream_encoder_init;
var _opus_multistream_decoder_init = Module["_opus_multistream_decoder_init"] = asm._opus_multistream_decoder_init;
var _opus_encode = Module["_opus_encode"] = asm._opus_encode;
var _opus_multistream_encoder_destroy = Module["_opus_multistream_encoder_destroy"] = asm._opus_multistream_encoder_destroy;
var _opus_packet_get_nb_samples = Module["_opus_packet_get_nb_samples"] = asm._opus_packet_get_nb_samples;
var _opus_repacketizer_cat = Module["_opus_repacketizer_cat"] = asm._opus_repacketizer_cat;
var _opus_encoder_ctl = Module["_opus_encoder_ctl"] = asm._opus_encoder_ctl;
var _opus_decoder_get_nb_samples = Module["_opus_decoder_get_nb_samples"] = asm._opus_decoder_get_nb_samples;
var _opus_multistream_encoder_ctl = Module["_opus_multistream_encoder_ctl"] = asm._opus_multistream_encoder_ctl;
var _opus_repacketizer_create = Module["_opus_repacketizer_create"] = asm._opus_repacketizer_create;
var _strlen = Module["_strlen"] = asm._strlen;
var _opus_packet_parse = Module["_opus_packet_parse"] = asm._opus_packet_parse;
var _free = Module["_free"] = asm._free;
var _opus_multistream_decode = Module["_opus_multistream_decode"] = asm._opus_multistream_decode;
var _opus_encode_float = Module["_opus_encode_float"] = asm._opus_encode_float;
var _opus_pcm_soft_clip = Module["_opus_pcm_soft_clip"] = asm._opus_pcm_soft_clip;
var _memmove = Module["_memmove"] = asm._memmove;
var _malloc = Module["_malloc"] = asm._malloc;
var _opus_decoder_ctl = Module["_opus_decoder_ctl"] = asm._opus_decoder_ctl;
var _opus_encoder_create = Module["_opus_encoder_create"] = asm._opus_encoder_create;
var _llvm_ctlz_i32 = Module["_llvm_ctlz_i32"] = asm._llvm_ctlz_i32;
var _opus_encoder_init = Module["_opus_encoder_init"] = asm._opus_encoder_init;
var _opus_decode = Module["_opus_decode"] = asm._opus_decode;
var _opus_multistream_decode_float = Module["_opus_multistream_decode_float"] = asm._opus_multistream_decode_float;
var _opus_repacketizer_out = Module["_opus_repacketizer_out"] = asm._opus_repacketizer_out;
var dynCall_viiiii = Module["dynCall_viiiii"] = asm.dynCall_viiiii;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm.dynCall_viiiiii;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = false;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
