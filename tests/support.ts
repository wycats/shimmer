import { HTMLSerializer, voidMap } from "simple-dom";
import { DomNode, opaqueToSimple } from "../src/index";

const SERIALIZER = new HTMLSerializer(voidMap);

export function toHTML(node: DomNode): string {
  let simple = opaqueToSimple(node);
  return SERIALIZER.serialize(simple);
}
