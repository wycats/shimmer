import {
  CommentContent,
  Content,
  createComment,
  createFragment,
  createText,
  TextContent,
} from "@shimmer/core";
import { isStaticReactive } from "@shimmer/reactive";
import fc from "fast-check";
import { arbitraryReactive, Prop } from "../utils";
import { AbstractRenderModel } from "./abstract";
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

export class LeafModel extends AbstractRenderModel<
  CommentContent | TextContent
> {
  static text(): Prop<LeafModel> {
    return LeafModel.property("text");
  }

  static comment(): Prop<LeafModel> {
    return LeafModel.property("comment");
  }

  static arbitrary(type?: "text" | "comment"): fc.Arbitrary<LeafModel> {
    if (type === undefined) {
      return fc.oneof(
        LeafModel.arbitrary("text"),
        LeafModel.arbitrary("comment")
      );
    }

    return arbitraryReactive(fc.string()).map((reactive) => {
      let comment =
        type === "text" ? createText(reactive) : createComment(reactive);
      return new LeafModel(comment, isStaticReactive(reactive));
    });
  }

  static property(type: "text" | "comment"): Prop<LeafModel> {
    let arbitrary = LeafModel.arbitrary(type);

    return fc.property(arbitrary, (model) => model.check());
  }

  readonly type = "leaf";
}
