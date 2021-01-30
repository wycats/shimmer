import * as fc from "fast-check";
import { module } from "../../context";
import { ChoiceContentModel, ContentModel, LeafModel } from "./models";
import { reporter } from "./utils";

module("staticness (content)", (test) => {
  test("text nodes are static if their input is static", () => {
    fc.assert(LeafModel.text(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
    });
  });

  test("comment nodes are static if their input is static", () => {
    fc.assert(LeafModel.comment(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
    });
  });

  test("choice nodes are static if their input is static", () => {
    fc.assert(ChoiceContentModel.property(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
      seed: 620501370,
      path: "2:13",
    });
  });

  test("content nodes are static if their input is static", () => {
    fc.assert(ContentModel.property(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
    });
  });
});
