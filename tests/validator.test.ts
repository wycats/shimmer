import { Runtime } from "../src/index";
import { Update } from "../src/validation/validator";

describe("Validator", () => {
  const RUNTIME = Runtime.simple();

  test("validating a static variable", () => {
    let variable = RUNTIME.reactive((r) => r.static("hello world"));
    let { validator, value } = RUNTIME.validator(variable)();

    expect(value).toBe("hello world");
    expect(RUNTIME.poll(validator)).toMatchObject(Update.fresh("hello world"));
  });

  test("validating a cell", () => {
    let cell = RUNTIME.reactive((r) => r.cell("hello world"));
    let { validator, value } = RUNTIME.validator(cell)();

    expect(value).toBe("hello world");
    expect(RUNTIME.poll(validator)).toMatchObject(Update.fresh("hello world"));

    cell.update("goodbye world");

    expect(RUNTIME.poll(validator)).toMatchObject(
      Update.stale("goodbye world")
    );
    expect(RUNTIME.poll(validator)).toMatchObject(Update.fresh("hello world"));

    cell.update("goodbye cruel world");
    expect(RUNTIME.poll(validator)).toMatchObject(
      Update.stale("goodbye cruel world")
    );
  });
});
