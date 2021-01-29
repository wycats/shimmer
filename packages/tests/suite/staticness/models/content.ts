import fc from "fast-check";
import type { Prop } from "../utils";
import { FragmentModel, LeafModel } from "./basic-content";
import { ElementModel } from "./element";

type AnyContentModel = LeafModel | FragmentModel | ElementModel;

const CONTENT_MIX = fc.memo(() =>
  fc.oneof(
    FragmentModel.arbitrary(),
    ElementModel.arbitrary(),
    LeafModel.arbitrary(),
    LeafModel.arbitrary()
  )
);

export const ContentModel = {
  arbitrary: (): fc.Arbitrary<AnyContentModel> => {
    return CONTENT_MIX(5);
  },

  property: (): Prop<AnyContentModel> => {
    let arbitrary = ContentModel.arbitrary();

    return fc.property(arbitrary, (model) => model.check());
  },
};
