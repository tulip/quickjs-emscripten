// This file generated by "generate.ts ffi" in the root of the repo.
import { QuickJSEmscriptenModule } from "./emscripten-types"
import { JSRuntimePointer, JSContextPointer, JSContextPointerPointer, JSModuleDefPointer, JSValuePointer, JSValueConstPointer, JSValuePointerPointer, JSValueConstPointerPointer, QTS_C_To_HostCallbackFuncPointer, QTS_C_To_HostInterruptFuncPointer, QTS_C_To_HostLoadModuleFuncPointer, HeapCharPointer, JSVoidPointer, EvalFlags, EvalDetectModule } from "./ffi-types"

/**
 * Low-level FFI bindings to QuickJS's Emscripten module.
 * See instead [[QuickJSContext]], the public Javascript interface exposed by this
 * library.
 *
 * @unstable The FFI interface is considered private and may change.
 */
export class QuickJSFFI {
  constructor(private module: QuickJSEmscriptenModule) {}
  /** Set at compile time. */
  readonly DEBUG = false

  QTS_Throw: (ctx: JSContextPointer, error: JSValuePointer | JSValueConstPointer) => JSValuePointer =
    this.module.cwrap("QTS_Throw", "number", ["number","number"])

  QTS_NewError: (ctx: JSContextPointer) => JSValuePointer =
    this.module.cwrap("QTS_NewError", "number", ["number"])

  QTS_RuntimeSetMemoryLimit: (rt: JSRuntimePointer, limit: number) => void =
    this.module.cwrap("QTS_RuntimeSetMemoryLimit", null, ["number","number"])

  QTS_RuntimeComputeMemoryUsage: (rt: JSRuntimePointer, ctx: JSContextPointer) => JSValuePointer =
    this.module.cwrap("QTS_RuntimeComputeMemoryUsage", "number", ["number","number"])

  QTS_RuntimeDumpMemoryUsage: (rt: JSRuntimePointer) => string =
    this.module.cwrap("QTS_RuntimeDumpMemoryUsage", "string", ["number"])

  QTS_GetUndefined: () => JSValueConstPointer =
    this.module.cwrap("QTS_GetUndefined", "number", [])

  QTS_GetNull: () => JSValueConstPointer =
    this.module.cwrap("QTS_GetNull", "number", [])

  QTS_GetFalse: () => JSValueConstPointer =
    this.module.cwrap("QTS_GetFalse", "number", [])

  QTS_GetTrue: () => JSValueConstPointer =
    this.module.cwrap("QTS_GetTrue", "number", [])

  QTS_NewRuntime: () => JSRuntimePointer =
    this.module.cwrap("QTS_NewRuntime", "number", [])

  QTS_FreeRuntime: (rt: JSRuntimePointer) => void =
    this.module.cwrap("QTS_FreeRuntime", null, ["number"])

  QTS_NewContext: (rt: JSRuntimePointer) => JSContextPointer =
    this.module.cwrap("QTS_NewContext", "number", ["number"])

  QTS_FreeContext: (ctx: JSContextPointer) => void =
    this.module.cwrap("QTS_FreeContext", null, ["number"])

  QTS_FreeValuePointer: (ctx: JSContextPointer, value: JSValuePointer) => void =
    this.module.cwrap("QTS_FreeValuePointer", null, ["number","number"])

  QTS_FreeValuePointerRuntime: (rt: JSRuntimePointer, value: JSValuePointer) => void =
    this.module.cwrap("QTS_FreeValuePointerRuntime", null, ["number","number"])

  QTS_FreeVoidPointer: (ctx: JSContextPointer, ptr: JSVoidPointer) => void =
    this.module.cwrap("QTS_FreeVoidPointer", null, ["number","number"])

  QTS_DupValuePointer: (ctx: JSContextPointer, val: JSValuePointer | JSValueConstPointer) => JSValuePointer =
    this.module.cwrap("QTS_DupValuePointer", "number", ["number","number"])

  QTS_NewObject: (ctx: JSContextPointer) => JSValuePointer =
    this.module.cwrap("QTS_NewObject", "number", ["number"])

  QTS_NewObjectProto: (ctx: JSContextPointer, proto: JSValuePointer | JSValueConstPointer) => JSValuePointer =
    this.module.cwrap("QTS_NewObjectProto", "number", ["number","number"])

  QTS_NewArray: (ctx: JSContextPointer) => JSValuePointer =
    this.module.cwrap("QTS_NewArray", "number", ["number"])

  QTS_NewFloat64: (ctx: JSContextPointer, num: number) => JSValuePointer =
    this.module.cwrap("QTS_NewFloat64", "number", ["number","number"])

  QTS_GetFloat64: (ctx: JSContextPointer, value: JSValuePointer | JSValueConstPointer) => number =
    this.module.cwrap("QTS_GetFloat64", "number", ["number","number"])

  QTS_NewString: (ctx: JSContextPointer, string: HeapCharPointer) => JSValuePointer =
    this.module.cwrap("QTS_NewString", "number", ["number","number"])

  QTS_GetString: (ctx: JSContextPointer, value: JSValuePointer | JSValueConstPointer) => string =
    this.module.cwrap("QTS_GetString", "string", ["number","number"])

  QTS_IsJobPending: (rt: JSRuntimePointer) => number =
    this.module.cwrap("QTS_IsJobPending", "number", ["number"])

  QTS_ExecutePendingJob: (rt: JSRuntimePointer, maxJobsToExecute: number, lastJobContext: JSContextPointerPointer) => JSValuePointer =
    this.module.cwrap("QTS_ExecutePendingJob", "number", ["number","number","number"])

  QTS_GetProp: (ctx: JSContextPointer, this_val: JSValuePointer | JSValueConstPointer, prop_name: JSValuePointer | JSValueConstPointer) => JSValuePointer =
    this.module.cwrap("QTS_GetProp", "number", ["number","number","number"])

  QTS_SetProp: (ctx: JSContextPointer, this_val: JSValuePointer | JSValueConstPointer, prop_name: JSValuePointer | JSValueConstPointer, prop_value: JSValuePointer | JSValueConstPointer) => void =
    this.module.cwrap("QTS_SetProp", null, ["number","number","number","number"])

  QTS_DefineProp: (ctx: JSContextPointer, this_val: JSValuePointer | JSValueConstPointer, prop_name: JSValuePointer | JSValueConstPointer, prop_value: JSValuePointer | JSValueConstPointer, get: JSValuePointer | JSValueConstPointer, set: JSValuePointer | JSValueConstPointer, configurable: boolean, enumerable: boolean, has_value: boolean) => void =
    this.module.cwrap("QTS_DefineProp", null, ["number","number","number","number","number","number","boolean","boolean","boolean"])

  QTS_Call: (ctx: JSContextPointer, func_obj: JSValuePointer | JSValueConstPointer, this_obj: JSValuePointer | JSValueConstPointer, argc: number, argv_ptrs: JSValueConstPointerPointer) => JSValuePointer =
    this.module.cwrap("QTS_Call", "number", ["number","number","number","number","number"])

  QTS_ResolveException: (ctx: JSContextPointer, maybe_exception: JSValuePointer) => JSValuePointer =
    this.module.cwrap("QTS_ResolveException", "number", ["number","number"])

  QTS_Dump: (ctx: JSContextPointer, obj: JSValuePointer | JSValueConstPointer) => string =
    this.module.cwrap("QTS_Dump", "string", ["number","number"])

  QTS_Eval: (ctx: JSContextPointer, js_code: HeapCharPointer, filename: string, detectModule: EvalDetectModule, evalFlags: EvalFlags) => JSValuePointer =
    this.module.cwrap("QTS_Eval", "number", ["number","number","string","number","number"])

  QTS_Typeof: (ctx: JSContextPointer, value: JSValuePointer | JSValueConstPointer) => string =
    this.module.cwrap("QTS_Typeof", "string", ["number","number"])

  QTS_GetGlobalObject: (ctx: JSContextPointer) => JSValuePointer =
    this.module.cwrap("QTS_GetGlobalObject", "number", ["number"])

  QTS_NewPromiseCapability: (ctx: JSContextPointer, resolve_funcs_out: JSValuePointerPointer) => JSValuePointer =
    this.module.cwrap("QTS_NewPromiseCapability", "number", ["number","number"])

  QTS_TestStringArg: (string: string) => void =
    this.module.cwrap("QTS_TestStringArg", null, ["string"])

  QTS_BuildIsDebug: () => number =
    this.module.cwrap("QTS_BuildIsDebug", "number", [])

  QTS_BuildIsAsyncify: () => number =
    this.module.cwrap("QTS_BuildIsAsyncify", "number", [])

  QTS_NewFunction: (ctx: JSContextPointer, func_id: number, name: string) => JSValuePointer =
    this.module.cwrap("QTS_NewFunction", "number", ["number","number","string"])

  QTS_ArgvGetJSValueConstPointer: (argv: JSValuePointer | JSValueConstPointer, index: number) => JSValueConstPointer =
    this.module.cwrap("QTS_ArgvGetJSValueConstPointer", "number", ["number","number"])

  QTS_RuntimeEnableInterruptHandler: (rt: JSRuntimePointer) => void =
    this.module.cwrap("QTS_RuntimeEnableInterruptHandler", null, ["number"])

  QTS_RuntimeDisableInterruptHandler: (rt: JSRuntimePointer) => void =
    this.module.cwrap("QTS_RuntimeDisableInterruptHandler", null, ["number"])

  QTS_RuntimeEnableModuleLoader: (rt: JSRuntimePointer, use_custom_normalize: number) => void =
    this.module.cwrap("QTS_RuntimeEnableModuleLoader", null, ["number","number"])

  QTS_RuntimeDisableModuleLoader: (rt: JSRuntimePointer) => void =
    this.module.cwrap("QTS_RuntimeDisableModuleLoader", null, ["number"])
}
