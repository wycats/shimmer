import { SimpleNode, SimpleText } from "@simple-dom/interface";

export interface DomDocument {
  createTextNode(text: string): SimplestText;
}

declare const DOM_TYPE: unique symbol;
declare const DOM_TS_TYPE: unique symbol;

export interface SimplestNode {
  nodeType: number;
}

export interface DomNodeInterface extends SimplestNode {
  [DOM_TYPE]: string;
  [DOM_TS_TYPE]: unknown;
}

export interface DomText extends DomNodeInterface {
  [DOM_TYPE]: "text";
  [DOM_TS_TYPE]: SimplestText;
}

export interface SimplestText extends SimplestNode {
  nodeValue: string;
}

export type DomNode = DomText;

export function opaqueToSimplest(node: DomText): SimplestText;
export function opaqueToSimplest(node: DomNode): SimplestNode;
export function opaqueToSimplest(node: unknown): unknown {
  return node;
}

export function opaqueToSimple(node: DomText): SimpleText;
export function opaqueToSimple(node: DomNode): SimpleNode;
export function opaqueToSimple(node: unknown): unknown {
  return node;
}
