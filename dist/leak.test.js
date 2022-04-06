"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const _1 = require(".");
const variants_1 = require("./variants");
const TEST_LEAK = Boolean(process.env.TEST_LEAK);
function checkModuleForLeaks(getModule) {
    let wasmModule;
    this.timeout(Infinity);
    beforeEach(async function () {
        wasmModule = await getModule();
        const ffi = wasmModule.getFFI();
        if (!ffi.QTS_BuildIsSanitizeLeak()) {
            console.warn("Note: leak sanitizer not enabled in this build.");
        }
    });
    it("if DEBUG and not ASYNCIFY, should have sanitizer.", () => {
        const ffi = wasmModule.getFFI();
        if (ffi.QTS_BuildIsSanitizeLeak()) {
            // Ok! sanitizer enabled
            return;
        }
        if (ffi.QTS_BuildIsDebug() && !ffi.QTS_BuildIsAsyncify()) {
            assert_1.default.fail("Sanitizer should be enabled in sync debug build.");
        }
    });
    const DURATION_MS = TEST_LEAK ? 10 * 1000 : 100;
    const MAX_ITERATIONS = 1000;
    const PASSED_RECENTLY = ["runtime", "runtimeContext"];
    const PRIORITY = ["eval", "dumpEval"];
    const checks = {
        runtime() {
            const rt = wasmModule.newRuntime();
            rt.dispose();
        },
        runtimeContext() {
            const rt = wasmModule.newRuntime();
            const ctx = rt.newContext();
            ctx.dispose();
            rt.dispose();
        },
        moduleContext() {
            const ctx = wasmModule.newContext();
            ctx.dispose();
        },
        newString() {
            const ctx = wasmModule.newContext();
            const longString = "a".repeat(1024 * 1024);
            const string = ctx.newString(longString);
            string.dispose();
            ctx.dispose();
        },
        getString() {
            const ctx = wasmModule.newContext();
            const longString = "a".repeat(1024 * 1024);
            const string = ctx.newString(longString);
            ctx.getString(string);
            string.dispose();
            ctx.dispose();
        },
        dumpString() {
            const ctx = wasmModule.newContext();
            const longString = "a".repeat(1024 * 1024);
            const string = ctx.newString(longString);
            ctx.dump(string);
            string.dispose();
            ctx.dispose();
        },
        newNumber() {
            const ctx = wasmModule.newContext();
            const number = ctx.newNumber(42);
            number.dispose();
            ctx.dispose();
        },
        getNumber() {
            const ctx = wasmModule.newContext();
            const number = ctx.newNumber(42);
            ctx.getNumber(number);
            number.dispose();
            ctx.dispose();
        },
        dumpNumber() {
            const ctx = wasmModule.newContext();
            const number = ctx.newNumber(42);
            ctx.dump(number);
            number.dispose();
            ctx.dispose();
        },
        eval() {
            const ctx = wasmModule.newContext();
            const arrayValue = "[" + '"a",'.repeat(1024) + "]";
            const result = ctx.evalCode(arrayValue);
            ctx.unwrapResult(result).dispose();
            ctx.dispose();
        },
        dumpEval() {
            const ctx = wasmModule.newContext();
            const arrayValue = "[" + '"a",'.repeat(1024) + "]";
            const result = ctx.evalCode(arrayValue);
            const handle = ctx.unwrapResult(result);
            ctx.dump(handle);
            handle.dispose();
            ctx.dispose();
        },
    };
    const checkNames = Object.keys(checks);
    checkNames.sort((a, b) => {
        if (PRIORITY.includes(a) && PRIORITY.includes(b)) {
            return 0;
        }
        if (PRIORITY.includes(a)) {
            return -1;
        }
        if (PRIORITY.includes(b)) {
            return 1;
        }
        const aIndex = PASSED_RECENTLY.indexOf(a);
        const bIndex = PASSED_RECENTLY.indexOf(b);
        return aIndex - bIndex;
    });
    for (const checkName of checkNames) {
        const fn = checks[checkName];
        it(`should not leak: ${checkName}`, () => {
            console.log(`Running ${checkName}...`);
            const startedAt = Date.now();
            let i = 0;
            for (; i < MAX_ITERATIONS; i++) {
                fn();
                if (i > 1 && Date.now() - startedAt > DURATION_MS) {
                    break;
                }
            }
            console.log(i, "iterations,", i / DURATION_MS, "iterations/ms");
            const didLeak = wasmModule.getFFI().QTS_RecoverableLeakCheck();
            assert_1.default.strictEqual(didLeak, 0, "no leaks");
        });
    }
}
describe("Leak checks (most accurate with debug build)", function () {
    describe("DEBUG sync module", function () {
        const loader = (0, variants_1.memoizePromiseFactory)(() => (0, _1.newQuickJSWASMModule)(variants_1.DEBUG_SYNC));
        checkModuleForLeaks.call(this, loader);
    });
    describe("RELEASE sync module", function () {
        checkModuleForLeaks.call(this, _1.getQuickJS);
    });
    describe.skip("DEBUG async module", function () {
        const loader = (0, variants_1.memoizePromiseFactory)(() => (0, _1.newQuickJSAsyncWASMModule)(variants_1.DEBUG_ASYNC));
        checkModuleForLeaks.call(this, loader);
    });
    // Leaving this enabled, but note that we now disable
    // leak sanitizer for ASYNCIFY since it's not reliable.
    describe("RELEASE async module", function () {
        const loader = (0, variants_1.memoizePromiseFactory)(() => (0, _1.newQuickJSAsyncWASMModule)());
        checkModuleForLeaks.call(this, loader);
    });
});
//# sourceMappingURL=leak.test.js.map