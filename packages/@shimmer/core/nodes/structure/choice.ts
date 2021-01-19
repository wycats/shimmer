import type { Bounds } from "../../../dom/bounds";
import type { Cursor } from "../../../dom/cursor";
import type { SimplestDocument } from "../../../dom/simplest";
import { isStatic } from "../../brands";
import { build, Reactive } from "../../reactive/cell";
import {
  Content,
  DynamicContent,
  StableDynamicContent,
  TemplateContent,
  UpdatableDynamicContent,
} from "../content";
import type { Block } from "./block";

console.log("CHOICE");

export type Choices = {
  [P in string]: VariantInfo<P, Reactive<unknown>>;
};

export interface VariantInfo<K extends string, V extends Reactive<unknown>> {
  readonly discriminant: K;
  readonly value: V;
}

export class Variant<C extends Choices, K extends keyof C> {
  constructor(readonly discriminant: K, readonly value: C[K]["value"]) {}

  match<U>(match: Match<C, () => U>): U {
    let { discriminant } = this;
    return match[discriminant]();
  }
}

export class Variants<C extends Choices> {
  static define<C extends Choices>(): Variants<C> {
    return new Variants();
  }

  of<K extends keyof C & string>(key: K, value: C[K]["value"]): Variant<C, K> {
    return new Variant(key, value);
  }
}

export type Match<C extends Choices, V> = {
  [P in keyof C]: V;
};

export function matchIsStatic(match: Match<Choices, Content>): boolean {
  for (let content of Object.values(match)) {
    if (!content.isStatic) {
      return false;
    }
  }

  return true;
}

export type Choice<C extends Choices> = Variant<C, keyof C>;

export interface ChoiceInfo<C extends Choices = Choices> {
  value: Reactive<Choice<C>>;
  match: Match<C, Block<[]>>;
}

export type ChoiceContent<C extends Choices = Choices> = TemplateContent<
  "choice",
  ChoiceInfo<C>
>;

interface ChoiceState<C extends Choices> {
  discriminant: keyof C;
  content: StableDynamicContent | null;
}

export function createMatch<C extends Choices>(
  reactive: Reactive<Choice<C>>,
  match: Match<C, Block<[]>>
): Content {
  return build(() => {
    if (isStatic(reactive)) {
      let { discriminant } = reactive.now;
      return match[discriminant].invoke([]);
    }

    let data: ChoiceInfo<C> = { value: reactive, match };
    return DynamicContent.of("choice", data, new UpdatableChoice(data));
  });
}

class UpdatableChoice<C extends Choices> extends UpdatableDynamicContent<
  ChoiceState<C>
> {
  #data: ChoiceInfo<C>;

  constructor(data: ChoiceInfo<C>) {
    super();
    this.#data = data;
  }

  isValid(state: ChoiceState<C>): boolean {
    let { discriminant: newDiscriminant } = this.#data.value.now;

    return state.discriminant === newDiscriminant;
  }

  poll(state: ChoiceState<C>): void {
    if (state.content) {
      state.content.poll();
    }
  }

  render(
    cursor: Cursor,
    dom: SimplestDocument
  ): { bounds: Bounds; state: ChoiceState<C> } {
    let { value, match } = this.#data;

    let { bounds, content } = initialize(value, match, cursor, dom);
    let { discriminant } = value.now;

    return {
      bounds,
      state: { discriminant, content },
    };
  }
}

function initialize<C extends Choices>(
  reactive: Reactive<Choice<C>>,
  match: Match<C, Block<[]>>,
  cursor: Cursor,
  dom: SimplestDocument
): { bounds: Bounds; content: StableDynamicContent | null } {
  let { discriminant } = reactive.now;
  let choice = match[discriminant];
  let result = choice.invoke([]).render(cursor, dom);

  if (result instanceof StableDynamicContent) {
    return { bounds: result, content: result };
  } else {
    return { bounds: result, content: null };
  }
}
