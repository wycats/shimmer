import {
  CommentContent,
  Content,
  createComment,
  createMatch,
  createText,
  TextContent,
} from "@shimmer/core";
import { isStaticReactive } from "@shimmer/reactive";
import fc from "fast-check";
import { ArbitraryChoice, arbitraryReactive, Prop } from "../utils";
import { AbstractRenderModel } from "./abstract";

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

export class ChoiceContentModel extends AbstractRenderModel<Content> {
  static arbitrary = fc.memo(() => {
    const maybeStatic = arbitraryReactive(fc.constant("content"));

    return fc
      .tuple(maybeStatic, ArbitraryChoice.arbitrary())
      .chain(([maybeStatic, choice]) => {
        let matcher = Object.fromEntries(
          choice.options.map((o) => [o, () => createText(maybeStatic)])
        );

        return choice.choice().map((c) => {
          return new ChoiceContentModel(
            createMatch(c, matcher),
            c.isStatic() && isStaticReactive(maybeStatic)
          );
        });
      });
  });

  static property(): Prop<ChoiceContentModel> {
    let arbitrary = ChoiceContentModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  }

  readonly type: string = "choice";
}
