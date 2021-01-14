import setGlobalContext, {
  Destroyable,
  Destructor,
} from "@glimmer/global-context";
import { GLIMMER } from "./glimmer";

setGlobalContext({
  scheduleRevalidate() {
    GLIMMER.revalidate();
  },

  getProp(_obj: unknown, _prop: string) {},
  setProp(_obj: unknown, _prop: string, _value: unknown) {},
  getPath(_obj: unknown, _path: string) {},
  setPath(_obj: unknown, _path: string, _value: unknown) {},

  toBool(value) {
    return Boolean(value);
  },

  toIterator() {
    return null;
  },

  warnIfStyleNotTrusted() {},

  async scheduleDestroy<T extends Destroyable>(
    destroyable: T,
    destructor: Destructor<T>
  ) {
    await Promise.resolve();
    destructor(destroyable);
  },

  async scheduleDestroyed(fn: () => void) {
    await Promise.resolve();
    fn();
  },
});
