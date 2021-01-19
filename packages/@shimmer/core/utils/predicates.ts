export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export type ObjectLiteral = object & {
  __proto__: null | ObjectConstructor["prototype"];
};

export function isObjectLiteral(value: unknown): value is ObjectLiteral {
  if (isObject(value) === false) {
    return false;
  }

  let proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
}
