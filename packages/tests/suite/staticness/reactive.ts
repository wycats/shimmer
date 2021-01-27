import fc from "fast-check";
import { module } from "../../context";
import { ClosedFunctionModel, ReactiveModel } from "./reactive-props";
import { reporter } from "./utils";

module("staticness (reactive)", (test) => {
  test("cells are static if they are static", (ctx) => {
    fc.assert(ReactiveModel.property(fc.string()), {
      reporter: reporter("isReactiveStatic is correct"),
    });
  });

  test("closed functions are static if their arguments are static", (ctx) => {
    fc.assert(ClosedFunctionModel.property(), {
      reporter: reporter("isReactiveStatic is correct"),
    });
  });
});
