"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lifetime_1 = require("./lifetime");
const assert_1 = __importDefault(require("assert"));
describe("Lifetime", () => {
    describe(".consume", () => {
        it("yeilds the value", () => {
            const lifetime = new lifetime_1.Lifetime(1);
            const result = lifetime.consume((l) => l.value + 1);
            assert_1.default.strictEqual(result, 2);
        });
        it("disposes the lifetime", () => {
            let disposed = false;
            const lifetime = new lifetime_1.Lifetime(2, undefined, () => {
                disposed = true;
            });
            lifetime.consume((l) => l.value * 2);
            assert_1.default.strictEqual(lifetime.alive, false);
            assert_1.default.strictEqual(disposed, true);
        });
    });
});
describe("Scope", () => {
    describe(".withScope", () => {
        function counter() {
            let n = 0;
            return {
                increment: () => n++,
                count: () => n,
            };
        }
        it("disposes all the lifetimes", () => {
            const { increment, count } = counter();
            const secondLifetime = lifetime_1.Scope.withScope((scope) => {
                scope.manage(new lifetime_1.Lifetime("first", undefined, (s) => increment()));
                return scope.manage(new lifetime_1.Lifetime("second", undefined, (s) => increment()));
            });
            assert_1.default.strictEqual(secondLifetime.alive, false);
            assert_1.default.strictEqual(count(), 2);
        });
    });
});
//# sourceMappingURL=lifetime.test.js.map