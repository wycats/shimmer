import {
  AttributeModifier,
  createAttr,
  createElement,
  ElementContent,
} from "@shimmer/core";
import { isStaticReactive } from "@shimmer/reactive";
import fc from "fast-check";
import { arbitraryReactive } from "../utils";
import { AbstractRenderModel } from "./abstract";
import { FragmentModel } from "./basic-content";

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

export class ElementModel extends AbstractRenderModel<ElementContent> {
  static arbitrary = fc.memo((n) => {
    let body = FragmentModel.optional();
    let attrs = fc.option(fc.array(AttrModel.arbitrary()), { freq: 5 });

    return fc
      .tuple(domNameArb, attrs, body)
      .map(([tag, attrsModel, bodyModel]) => {
        let body = bodyModel === null ? bodyModel : bodyModel.rendered;
        let attrs =
          attrsModel === null ? attrsModel : attrsModel.map((a) => a.rendered);

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

  readonly type = "element";
}

export class AttrModel extends AbstractRenderModel<AttributeModifier> {
  static arbitrary: fc.Memo<AttrModel> = fc.memo(() => {
    return fc
      .tuple(domNameArb, arbitraryReactive(fc.option(fc.string())))
      .map(([name, value]) => {
        return new AttrModel(createAttr(name, value), isStaticReactive(value));
      });
  });

  readonly type = "attr";
}
