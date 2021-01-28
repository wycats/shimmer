import fc from "fast-check";
import { module } from "../../context";
import { CellModel, ReactiveModel } from "./reactive-props";
import { reporter } from "./utils";

module("staticness (reactive)", (test) => {
  test("cells are static if they are static", () => {
    fc.assert(CellModel.property(fc.string()), {
      reporter: reporter("isReactiveStatic is correct"),
    });
  });

  test("closed functions are static if their arguments are static", () => {
    fc.assert(ReactiveModel.property(fc.string())(5), {
      reporter: reporter("isReactiveStatic is correct"),
    });
  });
});
