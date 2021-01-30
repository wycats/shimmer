import { Content, createFragment } from "@shimmer/core";
import fc from "fast-check";
import { AbstractRenderModel } from "./abstract";
import { LeafModel } from "./basic-content";
import { ElementModel } from "./element";

const INTERIOR_FRAGMENT = fc.memo(() =>
  fc
    .array(
      fc.oneof(
        FragmentModel.arbitrary(),
        ElementModel.arbitrary(),
        LeafModel.arbitrary(),
        LeafModel.arbitrary()
      ),
      { minLength: 1, maxLength: 10 }
    )
    .map((list) => {
      let content = createFragment(list.map((c) => c.rendered));
      let expectedStatic = list.every((c) => c.expectedStatic);
      return new FragmentModel(content, expectedStatic);
    })
);

const LEAF_FRAGMENT = fc.memo(() => {
  return fc.array(LeafModel.arbitrary()).map((list) => {
    let content = createFragment(list.map((c) => c.rendered));
    let expectedStatic = list.every((c) => c.expectedStatic);
    return new FragmentModel(content, expectedStatic);
  });
});

export class FragmentModel extends AbstractRenderModel<Content> {
  static arbitrary: fc.Memo<FragmentModel> = fc.memo((n) =>
    n <= 1 ? LEAF_FRAGMENT() : INTERIOR_FRAGMENT()
  );

  static optional: fc.Memo<FragmentModel | null> = fc.memo((n) =>
    n <= 1 ? fc.option(LEAF_FRAGMENT()) : fc.option(INTERIOR_FRAGMENT())
  );

  readonly type = "fragment";
}
