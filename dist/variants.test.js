"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const _1 = require(".");
const variants_1 = require("./variants");
// Verify that our variants are what we say they are.
async function getVariantBuildInfo(variant) {
    const wasmModule = variant.type === "sync"
        ? await (0, _1.newQuickJSWASMModule)(variant)
        : await (0, _1.newQuickJSAsyncWASMModule)(variant);
    return getModuleBuildInfo(wasmModule);
}
function getModuleBuildInfo(wasmModule) {
    const ffi = wasmModule.getFFI();
    return {
        ffiDebug: ffi.DEBUG,
        debug: ffi.QTS_BuildIsDebug(),
        asyncify: ffi.QTS_BuildIsAsyncify(),
        sanitize: ffi.QTS_BuildIsSanitizeLeak(),
    };
}
const DEFAULT_VARIANT = {
    ffiDebug: false,
    debug: 0,
    asyncify: 0,
    sanitize: 0,
};
describe("variants", () => {
    describe("getQuickJS (alias of RELEASE_SYNC)", () => {
        it("has expected build settings", async () => {
            assert_1.default.deepStrictEqual(getModuleBuildInfo(await (0, _1.getQuickJS)()), DEFAULT_VARIANT);
        });
    });
    describe("DEBUG_SYNC", () => {
        it("has expected build settings", async () => {
            assert_1.default.deepStrictEqual(await getVariantBuildInfo(variants_1.DEBUG_SYNC), {
                ffiDebug: true,
                debug: 1,
                asyncify: 0,
                sanitize: 1,
            });
        });
    });
    describe("RELEASE_SYNC", () => {
        it("has expected build settings", async () => {
            assert_1.default.deepStrictEqual(await getVariantBuildInfo(variants_1.RELEASE_SYNC), DEFAULT_VARIANT);
        });
    });
    describe("DEBUG_ASYNC", () => {
        it("has expected build settings", async () => {
            assert_1.default.deepStrictEqual(await getVariantBuildInfo(variants_1.DEBUG_ASYNC), {
                ffiDebug: true,
                debug: 1,
                asyncify: 1,
                sanitize: 0,
            });
        });
    });
    describe("RELEASE_ASYNC", () => {
        it("has expected build settings", async () => {
            assert_1.default.deepStrictEqual(await getVariantBuildInfo(variants_1.RELEASE_ASYNC), {
                ffiDebug: false,
                debug: 0,
                asyncify: 1,
                sanitize: 0,
            });
        });
    });
});
//# sourceMappingURL=variants.test.js.map