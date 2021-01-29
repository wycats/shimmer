import type { Content, Modifier } from "@shimmer/core";
import { displayContent } from "@shimmer/debug";
import type { IntoPrintableRecord } from "../../../types";
import type { PrintableScenario } from "../utils";

export abstract class AbstractRenderModel<R extends Content | Modifier>
  implements PrintableScenario {
  constructor(readonly rendered: R, readonly expectedStatic: boolean) {}

  abstract readonly type: string;

  get record(): IntoPrintableRecord {
    return {
      type: this.type,
      element: displayContent(this.rendered),
      expected: this.expectedStatic ? "static" : "dynamic",
    };
  }

  check() {
    if (this.expectedStatic) {
      return this.rendered.isStatic;
    } else {
      return !this.rendered.isStatic;
    }
  }
}
