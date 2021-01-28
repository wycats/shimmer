import {
  AttributeModifier,
  CommentContent,
  Content,
  createAttr,
  createComment,
  createElement,
  createFragment,
  createText,
  ElementContent,
  TextContent,
} from "@shimmer/core";
import { isStaticReactive } from "@shimmer/reactive";
import type { Arbitrary } from "fast-check";
import * as fc from "fast-check";
import { displayContent } from "../../../@shimmer/debug/index";
import { module } from "../../context";
import type { IntoPrintableRecord } from "../../types";
import { arbitraryReactive, PrintableScenario, Prop, reporter } from "./utils";

module("staticness (content)", (test) => {
  test("text nodes are static if their input is static", () => {
    fc.assert(TextModel.property(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
    });
  });

  test("comment nodes are static if their input is static", () => {
    fc.assert(CommentModel.property(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
    });
  });

  test("content nodes are static if their input is static", () => {
    fc.assert(ContentModel.property(), {
      verbose: true,
      reporter: reporter("correct isStatic"),
    });
  });
});

type AnyContentModel = TextModel | CommentModel | FragmentModel | ElementModel;

function chr(string: string): number {
  return string.charCodeAt(0);
}

function single(char: string): fc.Arbitrary<string> {
  let num = chr(char);
  return fc.integer(num, num).map((i) => String.fromCharCode(i));
}

function range(start: string, end: string): fc.Arbitrary<string> {
  return fc.integer(chr(start), chr(end)).map((i) => String.fromCharCode(i));
}

// https://www.w3.org/TR/xml/#NT-NameStartChar
function tagStart(): fc.Arbitrary<string> {
  // TODO: [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
  return range("A", "Z");
}

function tagChar() {
  return fc.oneof(
    tagStart(),
    single("-"),
    single("."),
    range("0", "9"),
    single("\xb7")
  );
}

// https://www.w3.org/TR/xml/#NT-Name
const domNameArb = fc
  .tuple(tagStart(), fc.array(tagChar(), { minLength: 1, maxLength: 10 }))
  .map(([f, rest]) => {
    return `${f}${rest.join("")}`;
  });

class ElementModel implements PrintableScenario {
  static arbitrary(): Arbitrary<ElementModel> {
    return domNameArb.map((t) => {
      let el = createElement({ tag: t, modifiers: [], body: null });
      return new ElementModel(el, true);
    });
  }

  static property(): Prop<CommentModel> {
    let arbitrary = CommentModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  }

  constructor(
    readonly content: ElementContent,
    readonly expectedStatic: boolean
  ) {}

  get record(): IntoPrintableRecord {
    return {
      element: displayContent(this.content),
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }

  check(): boolean {
    if (this.expectedStatic) {
      return this.content.isStatic;
    } else {
      return !this.content.isStatic;
    }
  }
}

class AttrModel {
  constructor(
    readonly content: AttributeModifier,
    readonly expectedStatic: boolean
  ) {}

  get record(): IntoPrintableRecord {
    return {
      attr: displayContent(this.content),
    };
  }
}

class FragmentModel implements PrintableScenario {
  constructor(readonly content: Content, readonly expectedStatic: boolean) {}

  get record(): IntoPrintableRecord {
    return {
      comment: displayContent(this.content),
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }

  check() {
    if (this.expectedStatic) {
      return this.content.isStatic;
    } else {
      return !this.content.isStatic;
    }
  }
}

class CommentModel implements PrintableScenario {
  static arbitrary(): Arbitrary<CommentModel> {
    return arbitraryReactive(fc.string()).map((reactive) => {
      let comment = createComment(reactive);
      return new CommentModel(comment, isStaticReactive(reactive));
    });
  }

  static property(): Prop<CommentModel> {
    let arbitrary = CommentModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  }

  constructor(
    readonly content: CommentContent,
    readonly expectedStatic: boolean
  ) {}

  get record(): IntoPrintableRecord {
    return {
      comment: displayContent(this.content),
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }

  check(): boolean {
    if (this.expectedStatic) {
      return this.content.isStatic;
    } else {
      return !this.content.isStatic;
    }
  }
}

class TextModel implements PrintableScenario {
  static arbitrary(): Arbitrary<TextModel> {
    return arbitraryReactive(fc.string()).map((reactive) => {
      let text = createText(reactive);
      return new TextModel(text, isStaticReactive(reactive));
    });
  }

  static property(): Prop<TextModel> {
    let arbitrary = TextModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  }

  constructor(
    readonly content: TextContent,
    readonly expectedStatic: boolean
  ) {}

  get record(): IntoPrintableRecord {
    return {
      text: displayContent(this.content),
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }

  check(): boolean {
    if (this.expectedStatic) {
      return this.content.isStatic;
    } else {
      return !this.content.isStatic;
    }
  }
}

const leaf = fc.oneof(CommentModel.arbitrary(), TextModel.arbitrary());

const ContentModel = {
  arbitrary: (): Arbitrary<AnyContentModel> => {
    const leaves: fc.Memo<AnyContentModel> = fc.memo(() => {
      return fc.array(leaf).map((list) => {
        let content = createFragment(list.map((c) => c.content));
        let expectedStatic = list.every((c) => c.expectedStatic);
        return new FragmentModel(content, expectedStatic);
      });
    });

    const frag: fc.Memo<AnyContentModel> = fc.memo((n) => {
      if (n <= 1) {
        return leaves();
      } else {
        return fc.array(tree(), { minLength: 1, maxLength: 10 }).map((list) => {
          let content = createFragment(list.map((c) => c.content));
          let expectedStatic = list.every((c) => c.expectedStatic);
          return new FragmentModel(content, expectedStatic);
        });
      }
    });

    const attr: fc.Memo<AttrModel> = fc.memo(() => {
      return fc
        .tuple(domNameArb, arbitraryReactive(fc.option(fc.string())))
        .map(([name, value]) => {
          return new AttrModel(
            createAttr(name, value),
            isStaticReactive(value)
          );
        });
    });

    const element: fc.Memo<ElementModel> = fc.memo((n) => {
      let body = n <= 1 ? leaves() : fc.option(tree(), { freq: 5 });
      let attrs = fc.option(fc.array(attr()), { freq: 5 });

      return fc
        .tuple(domNameArb, attrs, body)
        .map(([tag, attrsModel, bodyModel]) => {
          let body = bodyModel === null ? bodyModel : bodyModel.content;
          let attrs =
            attrsModel === null ? attrsModel : attrsModel.map((a) => a.content);

          let isStatic = true;
          if (body !== null && !body.isStatic) {
            isStatic = false;
          }

          if (attrs !== null && attrs.some((a) => !a.isStatic)) {
            isStatic = false;
          }

          let el = createElement({ tag, modifiers: attrs, body });
          return new ElementModel(el, isStatic);
        });
    });

    const tree = fc.memo(() => fc.oneof(frag(), element(), leaf, leaf));

    return tree(5);
  },

  property: (): Prop<TextModel | CommentModel | FragmentModel> => {
    let arbitrary = ContentModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  },
};
