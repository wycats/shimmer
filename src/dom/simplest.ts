export interface DomDocument {
  createTextNode(text: string): DomText;
}

export interface DomText {
  nodeValue: string;
}

export type DomNode = DomText;
