import { DomNode } from "../src/dom/simplest";
import { SimpleNode } from "@simple-dom/interface";
import { HTMLSerializer, voidMap } from "simple-dom";

const SERIALIZER = new HTMLSerializer(voidMap);

export function toHTML(node: DomNode): string {
  let simple = node as SimpleNode;
  return SERIALIZER.serialize(simple);
}
