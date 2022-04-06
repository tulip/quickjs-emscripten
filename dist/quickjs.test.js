"use strict";
/**
 * These tests demonstrate some common patterns for using quickjs-emscripten.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const mocha_1 = require("mocha");
const assert_1 = __importDefault(require("assert"));
const vm_interface_1 = require("./vm-interface");
const fs_1 = __importDefault(require("fs"));
const variants_1 = require("./variants");
const errors_1 = require("./errors");
const debug_1 = require("./debug");
const TEST_NO_ASYNC = Boolean(process.env.TEST_NO_ASYNC);
function contextTests(getContext) {
    let vm = undefined;
    let ffi = undefined;
    let testId = 0;
    beforeEach(async () => {
        testId++;
        vm = await getContext();
        ffi = vm.ffi;
        assertBuildIsConsistent(vm);
    });
    afterEach(() => {
        vm.dispose();
        vm = undefined;
    });
    after(() => {
        if (ffi.QTS_BuildIsAsyncify()) {
            // Asyncify explodes during leak checking.
            return;
        }
        // https://web.dev/webassembly-memory-debugging/
        assert_1.default.strictEqual(ffi.QTS_RecoverableLeakCheck(), 0, "No lsan errors");
        console.log("Leaks checked (OK)");
    });
    const getTestId = () => `test-${getContext.name}-${testId}`;
    (0, mocha_1.describe)("primitives", () => {
        (0, mocha_1.it)("can round-trip a number", () => {
            const jsNumber = 42;
            const numHandle = vm.newNumber(jsNumber);
            assert_1.default.equal(vm.getNumber(numHandle), jsNumber);
            numHandle.dispose();
        });
        (0, mocha_1.it)("can round-trip a string", () => {
            const jsString = "an example 🤔 string with unicode 🎉";
            const stringHandle = vm.newString(jsString);
            assert_1.default.equal(vm.getString(stringHandle), jsString);
            stringHandle.dispose();
        });
        (0, mocha_1.it)("can round-trip undefined", () => {
            assert_1.default.strictEqual(vm.dump(vm.undefined), undefined);
        });
        (0, mocha_1.it)("can round-trip true", () => {
            assert_1.default.strictEqual(vm.dump(vm.true), true);
        });
        (0, mocha_1.it)("can round-trip false", () => {
            assert_1.default.strictEqual(vm.dump(vm.false), false);
        });
        (0, mocha_1.it)("can round-trip null", () => {
            assert_1.default.strictEqual(vm.dump(vm.null), null);
        });
    });
    (0, mocha_1.describe)("functions", () => {
        (0, mocha_1.it)("can wrap a Javascript function and call it", () => {
            const some = 9;
            const fnHandle = vm.newFunction("addSome", (num) => {
                return vm.newNumber(some + vm.getNumber(num));
            });
            const result = vm.newNumber(1).consume((num) => vm.callFunction(fnHandle, vm.undefined, num));
            if (result.error) {
                result.error.dispose();
                assert_1.default.fail("calling fnHandle must succeed");
            }
            assert_1.default.equal(vm.getNumber(result.value), 10);
            result.value.dispose();
            fnHandle.dispose();
        });
        (0, mocha_1.it)("passes through native exceptions", () => {
            const fnHandle = vm.newFunction("jsOops", () => {
                throw new Error("oops");
            });
            const result = vm.callFunction(fnHandle, vm.undefined);
            if (!result.error) {
                assert_1.default.fail("function call must return error");
            }
            assert_1.default.deepEqual(vm.dump(result.error), {
                name: "Error",
                message: "oops",
            });
            result.error.dispose();
            fnHandle.dispose();
        });
        (0, mocha_1.it)("can return undefined twice", () => {
            const fnHandle = vm.newFunction("returnUndef", () => {
                return vm.undefined;
            });
            vm.unwrapResult(vm.callFunction(fnHandle, vm.undefined)).dispose();
            const result = vm.unwrapResult(vm.callFunction(fnHandle, vm.undefined));
            assert_1.default.equal(vm.typeof(result), "undefined");
            result.dispose();
            fnHandle.dispose();
        });
        (0, mocha_1.it)("can see its arguments being cloned", () => {
            let value;
            const fnHandle = vm.newFunction("doSomething", (arg) => {
                value = arg.dup();
            });
            const argHandle = vm.newString("something");
            const callHandle = vm.callFunction(fnHandle, vm.undefined, argHandle);
            argHandle.dispose();
            vm.unwrapResult(callHandle).dispose();
            if (!value)
                throw new Error(`Value unset`);
            assert_1.default.equal(vm.getString(value), "something");
            value.dispose();
            fnHandle.dispose();
        });
    });
    (0, mocha_1.describe)("properties", () => {
        (0, mocha_1.it)("defining a property does not leak", () => {
            vm.defineProp(vm.global, "Name", {
                enumerable: false,
                configurable: false,
                get: () => vm.newString("World"),
            });
            const result = vm.unwrapResult(vm.evalCode('"Hello " + Name'));
            assert_1.default.equal(vm.dump(result), "Hello World");
            result.dispose();
        });
    });
    (0, mocha_1.describe)("objects", () => {
        (0, mocha_1.it)("can set and get properties by native string", () => {
            const object = vm.newObject();
            const value = vm.newNumber(42);
            vm.setProp(object, "propName", value);
            const value2 = vm.getProp(object, "propName");
            assert_1.default.equal(vm.getNumber(value2), 42);
            object.dispose();
            value.dispose();
            value2.dispose();
        });
        (0, mocha_1.it)("can set and get properties by handle string", () => {
            const object = vm.newObject();
            const key = vm.newString("prop as a QuickJS string");
            const value = vm.newNumber(42);
            vm.setProp(object, key, value);
            const value2 = vm.getProp(object, key);
            assert_1.default.equal(vm.getNumber(value2), 42);
            object.dispose();
            key.dispose();
            value.dispose();
            value2.dispose();
        });
        (0, mocha_1.it)("can create objects with a prototype", () => {
            const defaultGreeting = vm.newString("SUP DAWG");
            const greeterPrototype = vm.newObject();
            vm.setProp(greeterPrototype, "greeting", defaultGreeting);
            defaultGreeting.dispose();
            const greeter = vm.newObject(greeterPrototype);
            // Gets something from the prototype
            const getGreeting = vm.getProp(greeter, "greeting");
            assert_1.default.equal(vm.getString(getGreeting), "SUP DAWG");
            getGreeting.dispose();
            // But setting a property from the prototype does not modify the prototype
            const newGreeting = vm.newString("How do you do?");
            vm.setProp(greeter, "greeting", newGreeting);
            newGreeting.dispose();
            const originalGreeting = vm.getProp(greeterPrototype, "greeting");
            assert_1.default.equal(vm.getString(originalGreeting), "SUP DAWG");
            originalGreeting.dispose();
            greeterPrototype.dispose();
            greeter.dispose();
        });
    });
    (0, mocha_1.describe)("arrays", () => {
        (0, mocha_1.it)("can set and get entries by native number", () => {
            const array = vm.newArray();
            const val1 = vm.newNumber(101);
            vm.setProp(array, 0, val1);
            const val2 = vm.getProp(array, 0);
            assert_1.default.strictEqual(vm.getNumber(val2), 101);
            array.dispose();
            val1.dispose();
            val2.dispose();
        });
        (0, mocha_1.it)("adding items sets array.length", () => {
            const vals = [vm.newNumber(0), vm.newNumber(1), vm.newString("cow")];
            const array = vm.newArray();
            for (let i = 0; i < vals.length; i++) {
                vm.setProp(array, i, vals[i]);
            }
            const length = vm.getProp(array, "length");
            assert_1.default.strictEqual(vm.getNumber(length), 3);
            length.dispose();
            array.dispose();
            vals.forEach((val) => val.dispose());
        });
    });
    (0, mocha_1.describe)(".unwrapResult", () => {
        (0, mocha_1.it)("successful result: returns the value", () => {
            const handle = vm.newString("OK!");
            const result = {
                value: handle,
            };
            assert_1.default.strictEqual(vm.unwrapResult(result), handle);
            handle.dispose();
        });
        (0, mocha_1.it)("error result: throws the error as a Javascript value", () => {
            const handle = vm.newString("ERROR!");
            const result = {
                error: handle,
            };
            try {
                vm.unwrapResult(result);
                assert_1.default.fail("vm.unwrapResult(error) must throw");
            }
            catch (error) {
                if (error instanceof errors_1.QuickJSUnwrapError) {
                    assert_1.default.strictEqual(error.cause, "ERROR!", "QuickJSUnwrapError.cause set correctly");
                    return;
                }
                throw error;
            }
            finally {
                if (handle.alive) {
                    handle.dispose();
                }
            }
        });
    });
    (0, mocha_1.describe)(".evalCode", () => {
        (0, mocha_1.it)("on success: returns { value: success }", () => {
            const value = vm.unwrapResult(vm.evalCode(`["this", "should", "work"].join(' ')`));
            assert_1.default.equal(vm.getString(value), "this should work");
            value.dispose();
        });
        (0, mocha_1.it)("on failure: returns { error: exception }", () => {
            const result = vm.evalCode(`["this", "should", "fail].join(' ')`);
            if (!result.error) {
                assert_1.default.fail("result should be an error");
            }
            assert_1.default.deepEqual(vm.dump(result.error), {
                name: "SyntaxError",
                message: "unexpected end of string",
                stack: "    at eval.js:1\n",
            });
            result.error.dispose();
        });
        (0, mocha_1.it)("runs in the global context", () => {
            vm.unwrapResult(vm.evalCode(`var declaredWithEval = 'Nice!'`)).dispose();
            const declaredWithEval = vm.getProp(vm.global, "declaredWithEval");
            assert_1.default.equal(vm.getString(declaredWithEval), "Nice!");
            declaredWithEval.dispose();
        });
        (0, mocha_1.it)("can access assigned globals", () => {
            let i = 0;
            const fnHandle = vm.newFunction("nextId", () => {
                return vm.newNumber(++i);
            });
            vm.setProp(vm.global, "nextId", fnHandle);
            fnHandle.dispose();
            const nextId = vm.unwrapResult(vm.evalCode(`nextId(); nextId(); nextId()`));
            assert_1.default.equal(i, 3);
            assert_1.default.equal(vm.getNumber(nextId), 3);
            nextId.dispose();
        });
        // TODO: bring back import support.
        (0, mocha_1.it)("can handle imports", () => {
            let moduleLoaderCalls = 0;
            vm.runtime.setModuleLoader(() => {
                moduleLoaderCalls++;
                return `export const name = "from import";`;
            });
            vm.unwrapResult(vm.evalCode(`
          import {name} from './foo.js'
          globalThis.declaredWithEval = name
          `, "importer.js")).dispose();
            const declaredWithEval = vm.getProp(vm.global, "declaredWithEval");
            assert_1.default.equal(vm.getString(declaredWithEval), "from import");
            declaredWithEval.dispose();
            assert_1.default.equal(moduleLoaderCalls, 1, "Only called once");
        });
    });
    (0, mocha_1.describe)(".executePendingJobs", () => {
        (0, mocha_1.it)("runs pending jobs", () => {
            let i = 0;
            const fnHandle = vm.newFunction("nextId", () => {
                return vm.newNumber(++i);
            });
            vm.setProp(vm.global, "nextId", fnHandle);
            fnHandle.dispose();
            const result = vm.unwrapResult(vm.evalCode(`(new Promise(resolve => resolve())).then(nextId).then(nextId).then(nextId);1`));
            assert_1.default.equal(i, 0);
            vm.runtime.executePendingJobs();
            assert_1.default.equal(i, 3);
            assert_1.default.equal(vm.getNumber(result), 1);
            result.dispose();
        });
    });
    (0, mocha_1.describe)(".hasPendingJob", () => {
        (0, mocha_1.it)("returns true when job pending", () => {
            let i = 0;
            const fnHandle = vm.newFunction("nextId", () => {
                return vm.newNumber(++i);
            });
            vm.setProp(vm.global, "nextId", fnHandle);
            fnHandle.dispose();
            vm.unwrapResult(vm.evalCode(`(new Promise(resolve => resolve(5)).then(nextId));1`)).dispose();
            assert_1.default.strictEqual(vm.runtime.hasPendingJob(), true, "has a pending job after creating a promise");
            const executed = vm.unwrapResult(vm.runtime.executePendingJobs());
            assert_1.default.strictEqual(executed, 1, "executed exactly 1 job");
            assert_1.default.strictEqual(vm.runtime.hasPendingJob(), false, "no longer any jobs after execution");
        });
    });
    (0, mocha_1.describe)(".dump", () => {
        function dumpTestExample(val) {
            const json = typeof val === "undefined" ? "undefined" : JSON.stringify(val);
            const nativeType = typeof val;
            (0, mocha_1.it)(`supports ${nativeType} (${json})`, () => {
                const handle = vm.unwrapResult(vm.evalCode(`(${json})`));
                assert_1.default.deepEqual(vm.dump(handle), val);
                handle.dispose();
            });
        }
        dumpTestExample(1);
        dumpTestExample("hi");
        dumpTestExample(true);
        dumpTestExample(false);
        dumpTestExample(undefined);
        dumpTestExample(null);
        dumpTestExample({ cow: true });
        dumpTestExample([1, 2, 3]);
    });
    (0, mocha_1.describe)(".typeof", () => {
        function typeofTestExample(val, toCode = JSON.stringify) {
            const json = toCode(val);
            const nativeType = typeof val;
            (0, mocha_1.it)(`supports ${nativeType} (${json})`, () => {
                const handle = vm.unwrapResult(vm.evalCode(`(${json})`));
                assert_1.default.equal(vm.typeof(handle), nativeType);
                handle.dispose();
            });
        }
        typeofTestExample(1);
        typeofTestExample("hi");
        typeofTestExample(true);
        typeofTestExample(false);
        typeofTestExample(undefined);
        typeofTestExample(null);
        typeofTestExample({ cow: true });
        typeofTestExample([1, 2, 3]);
        typeofTestExample(function () { }, (val) => val.toString());
    });
    (0, mocha_1.describe)("interrupt handler", () => {
        (0, mocha_1.it)("is called with the expected VM", () => {
            let calls = 0;
            const interruptId = getTestId();
            const interruptHandler = (interruptVm) => {
                assert_1.default.strictEqual(interruptVm, vm.runtime, "ShouldInterruptHandler callback runtime is the runtime");
                (0, debug_1.debugLog)("interruptHandler called", interruptId);
                calls++;
                return false;
            };
            (0, debug_1.debugLog)("setInterruptHandler", interruptId);
            vm.runtime.setInterruptHandler(interruptHandler);
            vm.unwrapResult(vm.evalCode("1 + 1")).dispose();
            (0, assert_1.default)(calls > 0, "interruptHandler called at least once");
        });
        (0, mocha_1.it)("interrupts infinite loop execution", () => {
            let calls = 0;
            const interruptId = getTestId();
            const interruptHandler = (interruptVm) => {
                (0, debug_1.debugLog)("interruptHandler called", interruptId);
                if (calls > 10) {
                    return true;
                }
                calls++;
                return false;
            };
            (0, debug_1.debugLog)("setInterruptHandler", interruptId);
            vm.runtime.setInterruptHandler(interruptHandler);
            const result = vm.evalCode("i = 0; while (1) { i++ }");
            // Make sure we actually got to interrupt the loop.
            const iHandle = vm.getProp(vm.global, "i");
            const i = vm.getNumber(iHandle);
            iHandle.dispose();
            (0, assert_1.default)(i > 10, "incremented i");
            (0, assert_1.default)(i > calls, "incremented i more than called the interrupt handler");
            // debug('Javascript loop iterrations:', i, 'interrupt handler calls:', calls)
            if (result.error) {
                const errorJson = vm.dump(result.error);
                result.error.dispose();
                assert_1.default.equal(errorJson.name, "InternalError");
                assert_1.default.equal(errorJson.message, "interrupted");
            }
            else {
                result.value.dispose();
                assert_1.default.fail("Should have returned an interrupt error");
            }
        });
    });
    (0, mocha_1.describe)(".computeMemoryUsage", () => {
        (0, mocha_1.it)("returns an object with JSON memory usage info", () => {
            const result = vm.runtime.computeMemoryUsage();
            const resultObj = vm.dump(result);
            result.dispose();
            const example = {
                array_count: 1,
                atom_count: 414,
                atom_size: 13593,
                binary_object_count: 0,
                binary_object_size: 0,
                c_func_count: 46,
                fast_array_count: 1,
                fast_array_elements: 0,
                js_func_code_size: 0,
                js_func_count: 0,
                js_func_pc2line_count: 0,
                js_func_pc2line_size: 0,
                js_func_size: 0,
                malloc_count: 665,
                malloc_limit: 4294967295,
                memory_used_count: 665,
                memory_used_size: 36305,
                obj_count: 97,
                obj_size: 4656,
                prop_count: 654,
                prop_size: 5936,
                shape_count: 50,
                shape_size: 10328,
                str_count: 0,
                str_size: 0,
            };
            assert_1.default.deepEqual(Object.keys(resultObj).sort(), Object.keys(example).sort());
        });
    });
    (0, mocha_1.describe)(".setMemoryLimit", () => {
        (0, mocha_1.it)("sets an enforced limit", () => {
            vm.runtime.setMemoryLimit(100);
            const result = vm.evalCode(`new Uint8Array(101); "ok"`);
            if (!result.error) {
                result.value.dispose();
                throw new Error("should be an error");
            }
            vm.runtime.setMemoryLimit(-1); // so we can dump
            const error = vm.dump(result.error);
            result.error.dispose();
            assert_1.default.strictEqual(error, null);
        });
        (0, mocha_1.it)("removes limit when set to -1", () => {
            vm.runtime.setMemoryLimit(100);
            vm.runtime.setMemoryLimit(-1);
            const result = vm.unwrapResult(vm.evalCode(`new Uint8Array(101); "ok"`));
            const value = vm.dump(result);
            result.dispose();
            assert_1.default.strictEqual(value, "ok");
        });
    });
    (0, mocha_1.describe)(".dumpMemoryUsage()", () => {
        (0, mocha_1.it)("logs memory usage", () => {
            (0, assert_1.default)(vm.runtime.dumpMemoryUsage().endsWith("per fast array)\n"), 'should end with "per fast array)\\n"');
        });
    });
    (0, mocha_1.describe)(".setMaxStackSize", () => {
        (0, mocha_1.it)("sets an enforced limit", () => {
            vm.runtime.setMaxStackSize(1);
            const result = vm.evalCode('"ok"');
            if (!result.error) {
                result.value.dispose();
                throw new Error("should be an error");
            }
            vm.runtime.setMaxStackSize(0); // so we can dump
            const error = vm.dump(result.error);
            result.error.dispose();
            assert_1.default.strictEqual(error.name, "SyntaxError");
            assert_1.default.strictEqual(error.message, "stack overflow");
        });
        (0, mocha_1.it)("removes limit when set to 0", () => {
            vm.runtime.setMaxStackSize(1);
            vm.runtime.setMaxStackSize(0);
            const result = vm.unwrapResult(vm.evalCode('"ok"'));
            const value = vm.dump(result);
            result.dispose();
            assert_1.default.strictEqual(value, "ok");
        });
    });
    (0, mocha_1.describe)("sharing objects between contexts", () => {
        (0, mocha_1.it)("can share objects between same runtime", () => {
            const otherContext = vm.runtime.newContext();
            const object = vm.newObject();
            vm.newString("bar").consume((it) => vm.setProp(object, "foo", it));
            otherContext.setProp(otherContext.global, "myObject", object);
            object.dispose();
            const value = vm.unwrapResult(otherContext.evalCode(`myObject`)).consume(otherContext.dump);
            assert_1.default.deepStrictEqual(value, { foo: "bar" }, "ok");
            otherContext.dispose();
        });
    });
    (0, mocha_1.describe)(".newPromise()", () => {
        (0, mocha_1.it)("dispose does not leak", () => {
            vm.newPromise().dispose();
        });
        (0, mocha_1.it)("passes an end-to-end test", async () => {
            const expectedValue = Math.random();
            let deferred = undefined;
            function timeout(ms) {
                return new Promise((resolve) => {
                    setTimeout(() => resolve(), ms);
                });
            }
            const asyncFuncHandle = vm.newFunction("getThingy", () => {
                deferred = vm.newPromise();
                timeout(5).then(() => vm.newNumber(expectedValue).consume((val) => deferred.resolve(val)));
                return deferred.handle;
            });
            asyncFuncHandle.consume((func) => vm.setProp(vm.global, "getThingy", func));
            vm.unwrapResult(vm.evalCode(`
          var globalThingy = 'not set by promise';
          getThingy().then(thingy => { globalThingy = thingy })
        `)).dispose();
            // Wait for the promise to settle
            await deferred.settled;
            // Execute promise callbacks inside the VM
            vm.runtime.executePendingJobs();
            // Check that the promise executed.
            const vmValue = vm.unwrapResult(vm.evalCode(`globalThingy`)).consume((x) => vm.dump(x));
            assert_1.default.equal(vmValue, expectedValue);
        });
    });
    (0, mocha_1.describe)(".resolvePromise()", () => {
        (0, mocha_1.it)("retrieves async function return value as a successful VM result", async () => {
            const result = vm.unwrapResult(vm.evalCode(`
        async function return1() {
          return 1
        }

        return1()
        `));
            assert_1.default.equal(vm.typeof(result), "object", "Async function returns an object (promise)");
            const promise = result.consume((result) => vm.resolvePromise(result));
            vm.runtime.executePendingJobs();
            const asyncResult = vm.unwrapResult(await promise);
            assert_1.default.equal(vm.dump(asyncResult), 1, "Awaited promise returns 1");
            asyncResult.dispose();
        });
        (0, mocha_1.it)("retrieves async function error as a error VM result", async () => {
            const result = vm.unwrapResult(vm.evalCode(`
        async function throwOops() {
          throw new Error('oops')
        }

        throwOops()
        `));
            assert_1.default.equal(vm.typeof(result), "object", "Async function returns an object (promise)");
            const promise = result.consume((result) => vm.resolvePromise(result));
            vm.runtime.executePendingJobs();
            const asyncResult = await promise;
            if (!asyncResult.error) {
                throw new Error("Should have returned an error");
            }
            const error = vm.dump(asyncResult.error);
            asyncResult.error.dispose();
            assert_1.default.equal(error.name, "Error");
            assert_1.default.equal(error.message, "oops");
        });
        (0, mocha_1.it)("converts non-promise handles into a promise, too", async () => {
            const stringHandle = vm.newString("foo");
            const promise = vm.resolvePromise(stringHandle);
            stringHandle.dispose();
            vm.runtime.executePendingJobs();
            const final = await promise.then((result) => {
                const stringHandle2 = vm.unwrapResult(result);
                return `unwrapped: ${stringHandle2.consume((stringHandle2) => vm.dump(stringHandle2))}`;
            });
            assert_1.default.equal(final, `unwrapped: foo`);
        });
    });
    (0, mocha_1.describe)("memory pressure", () => {
        (0, mocha_1.it)("can pass a large string to a C function", async () => {
            const jsonString = await fs_1.default.promises.readFile(`${__dirname}/../test/json-generator-dot-com-1024-rows.json`, "utf-8");
            const stringHandle = vm.newString(jsonString);
            const roundTripped = vm.getString(stringHandle);
            stringHandle.dispose();
            assert_1.default.strictEqual(roundTripped, jsonString);
        });
    });
}
function asyncContextTests(getContext) {
    let vm = undefined;
    beforeEach(async () => {
        vm = await getContext();
        assertBuildIsConsistent(vm);
    });
    afterEach(() => {
        vm.dispose();
        vm = undefined;
    });
    (0, mocha_1.describe)("asyncify functions", () => {
        (0, mocha_1.it)("sees Promise<handle> as synchronous", async () => {
            let asyncFunctionCalls = 0;
            const asyncFn = async () => {
                asyncFunctionCalls++;
                await new Promise((resolve) => setTimeout(resolve, 50));
                return vm.newString("hello from async");
            };
            const fnHandle = vm.newAsyncifiedFunction("asyncFn", asyncFn);
            vm.setProp(vm.global, "asyncFn", fnHandle);
            fnHandle.dispose();
            const callResultPromise = vm.evalCodeAsync("asyncFn()");
            (0, assert_1.default)(callResultPromise instanceof Promise);
            const callResult = await callResultPromise;
            const unwrapped = vm.unwrapResult(callResult);
            const dumped = unwrapped.consume(vm.dump);
            assert_1.default.equal(dumped, "hello from async");
            assert_1.default.equal(asyncFunctionCalls, 1, "one call");
        });
        (0, mocha_1.it)("passes through native promise rejection", async () => {
            const asyncFn = async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                throw new Error("async oops");
            };
            vm.newAsyncifiedFunction("asyncFn", asyncFn).consume((fn) => vm.setProp(vm.global, "asyncFn", fn));
            const callResultPromise = vm.evalCodeAsync("asyncFn()");
            (0, assert_1.default)(callResultPromise instanceof Promise);
            const result = await callResultPromise;
            (0, assert_1.default)((0, vm_interface_1.isFail)(result), "VM eval call errored");
            assert_1.default.throws(() => vm.unwrapResult(result), /async oops/);
        });
    });
    (0, mocha_1.describe)("module loading", () => {
        (0, mocha_1.it)("supports async module loading", async () => {
            async function testBody() {
                let moduleLoaderCalls = 0;
                const moduleLoader = async () => {
                    moduleLoaderCalls++;
                    if (moduleLoaderCalls > 1) {
                        throw new Error("Module loader should only be called once");
                    }
                    (0, debug_1.debugLog)("moduleLoader: sleeping");
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    (0, debug_1.debugLog)("moduleLoader: done sleeping");
                    return 'export default function() { return "hello from module" }';
                };
                (0, debug_1.debugLog)("defined module loader");
                vm.runtime.setModuleLoader(moduleLoader);
                (0, debug_1.debugLog)("set module loader");
                const promise = vm.evalCodeAsync(`
        import otherModule from './other-module'
        globalThis.stuff = otherModule()
      `);
                (0, debug_1.debugLog)("promise", promise);
                const result = await promise;
                (0, debug_1.debugLog)("awaited vm.evalCodeAsync", result, { alive: vm.alive });
                const unwrapped = vm.unwrapResult(result);
                (0, debug_1.debugLog)("unwrapped result");
                const dumped = unwrapped.consume(vm.dump);
                (0, debug_1.debugLog)("consumed result");
                assert_1.default.strictEqual(dumped, undefined);
                (0, debug_1.debugLog)("asserted result");
                const stuff = vm.getProp(vm.global, "stuff").consume(vm.dump);
                assert_1.default.strictEqual(stuff, "hello from module");
            }
            try {
                await testBody();
            }
            catch (error) {
                (0, debug_1.debugLog)("test body threw", error);
                throw error;
            }
        });
        (0, mocha_1.it)("passes through the module name", () => {
            let callCtx;
            let callModuleName;
            vm.runtime.setModuleLoader((moduleName, moduleVM) => {
                callCtx = moduleVM;
                callModuleName = moduleName;
                return `export default 5`;
            });
            const result = vm.evalCode("import otherModule from './other-module.js'");
            // Asserts that the eval worked without incident
            const unwrapped = vm.unwrapResult(result).consume(vm.dump);
            assert_1.default.strictEqual(unwrapped, undefined);
            assert_1.default.strictEqual(callCtx, vm, "expected VM");
            assert_1.default.strictEqual(callModuleName, "other-module.js", `expected module name, got ${callModuleName}`);
        });
        (0, mocha_1.it)("calls the module loader with the name returned from the module normalizer", async () => {
            const EVAL_FILE_NAME = "EVAL FILE NAME.ts";
            const NORMALIZED_NAME = "VERY NORMAL NAME";
            const IMPORT_PATH = "./other-module/index.js";
            let requestedBaseName;
            let requestedName;
            let loadedName;
            vm.runtime.setModuleLoader(function load(moduleName) {
                loadedName = moduleName;
                return `export default 5`;
            }, function normalize(baseName, name, moduleVM) {
                requestedBaseName = baseName;
                requestedName = name;
                return NORMALIZED_NAME;
            });
            // Asserts that the eval worked without incident
            const result = vm.evalCode(`import otherModule from '${IMPORT_PATH}'`, EVAL_FILE_NAME);
            const unwrapped = vm.unwrapResult(result).consume(vm.dump);
            assert_1.default.strictEqual(unwrapped, undefined);
            // Check our request
            assert_1.default.strictEqual(requestedName, IMPORT_PATH, "requested name is the literal import string");
            assert_1.default.strictEqual(requestedBaseName, EVAL_FILE_NAME, "base name is our eval file name");
            assert_1.default.strictEqual(loadedName, NORMALIZED_NAME, "loader received the normalized name we returned");
        });
    });
}
(0, mocha_1.describe)("QuickJSContext", function () {
    (0, mocha_1.describe)("QuickJS.newContext", function () {
        const loader = _1.getQuickJS;
        const getContext = () => loader().then((mod) => mod.newContext());
        contextTests.call(this, getContext);
    });
    (0, mocha_1.describe)("DEBUG sync module", function () {
        const loader = (0, variants_1.memoizePromiseFactory)(() => (0, _1.newQuickJSWASMModule)(variants_1.DEBUG_SYNC));
        const getContext = () => loader().then((mod) => mod.newContext());
        contextTests.call(this, getContext);
    });
});
if (!TEST_NO_ASYNC) {
    (0, mocha_1.describe)("QuickJSAsyncContext", () => {
        (0, mocha_1.describe)("newQuickJSAsyncWASMModule", function () {
            const loader = (0, variants_1.memoizePromiseFactory)(() => (0, _1.newQuickJSAsyncWASMModule)());
            const getContext = () => loader().then((mod) => mod.newContext());
            (0, mocha_1.describe)("sync API", () => {
                contextTests(getContext);
            });
            (0, mocha_1.describe)("async API", () => {
                asyncContextTests(getContext);
            });
        });
        (0, mocha_1.describe)("DEBUG async module", function () {
            const loader = (0, variants_1.memoizePromiseFactory)(() => (0, _1.newQuickJSAsyncWASMModule)(variants_1.DEBUG_ASYNC));
            const getContext = () => loader().then((mod) => mod.newContext());
            (0, mocha_1.describe)("sync API", () => {
                contextTests(getContext);
            });
            (0, mocha_1.describe)("async API", () => {
                asyncContextTests(getContext);
            });
        });
    });
}
// TODO: test newRuntime
// TODO: test newAsyncRuntime
function assertBuildIsConsistent(vm) {
    const ffi = vm.ffi;
    if (ffi.DEBUG) {
        assert_1.default.strictEqual(ffi.QTS_BuildIsDebug(), 1, "when FFI is generated with DEBUG, C code is compiled with DEBUG");
    }
    else {
        assert_1.default.strictEqual(ffi.QTS_BuildIsDebug(), 0, "when FFI is generated without DEBUG, C code is compiled without DEBUG");
    }
}
//# sourceMappingURL=quickjs.test.js.map