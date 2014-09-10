declare function allocate(bytes: number, type: string, loc: any): number;
declare function _malloc(bytes: number);
declare function _free(ptr: number);
declare function getValue(ptr: number, type: string): number;
declare function setValue(ptr: number, value: number, type: string): void;
declare function Pointer_stringify(ptr: number): string;

declare var ALLOC_NORMAL: number;
declare var ALLOC_STACK: number;
declare var HEAP8: Int8Array;
declare var HEAP16: Int16Array;
declare var HEAP32: Int32Array;
declare var HEAPU8: Uint8Array;
declare var HEAPU16: Uint16Array;
declare var HEAPU32: Uint32Array;
declare var HEAPF32: Float32Array;
declare var HEAPF64: Float64Array;
