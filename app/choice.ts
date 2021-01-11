import { Reactive, VariantInfo, Variants } from "../src/index";

export type Bool = {
  true: VariantInfo<"true", Reactive<true>>;
  false: VariantInfo<"false", Reactive<false>>;
};

export const Bool = Variants.define<Bool>();
