"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const asyncify_helpers_1 = require("./asyncify-helpers");
describe("maybeAsync", () => {
    const addPromises = (0, asyncify_helpers_1.maybeAsyncFn)(undefined, function* (awaited, a, b) {
        return (yield* awaited(a)) + (yield* awaited(b));
    });
    it("has sync output for sync inputs", () => {
        const sum2 = addPromises(5, 6);
        assert_1.default.strictEqual(sum2, 11);
    });
    it("has async output for async inputs", async () => {
        const result = addPromises(Promise.resolve(1), 2);
        (0, assert_1.default)(result instanceof Promise, "is promise");
        const sum = await result;
        assert_1.default.strictEqual(sum, 3, "sums correctly");
    });
    it("throws any sync errors", () => {
        const fn = (0, asyncify_helpers_1.maybeAsyncFn)(undefined, function* () {
            throw new Error("sync error");
        });
        assert_1.default.throws(() => fn(), /sync error/);
    });
    it("it throws async errors", () => {
        const fn = (0, asyncify_helpers_1.maybeAsyncFn)(undefined, function* (awaited) {
            yield* awaited(new Promise((resolve) => setTimeout(resolve, 50)));
            throw new Error("async error");
        });
        assert_1.default.rejects(() => fn(), /async error/);
    });
});
//# sourceMappingURL=asyncify-helpers.test.js.map