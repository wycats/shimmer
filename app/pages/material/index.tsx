import { App, Owner, Services, withRealm } from "@shimmer/core";
import { def } from "@shimmer/dsl";
import { NavBar } from "../nav";
import { page, PageHooks, RenderOptions, StaticOptions } from "../page";
import Button from "./button";
import Text from "./text";

interface MaterialState {}

export class MaterialPage implements PageHooks<MaterialState> {
  construct(_owner: Owner<Services>): MaterialState {
    return {};
  }
  render(
    _state: MaterialState,
    { owner }: StaticOptions,
    { cursor }: RenderOptions
  ): App {
    let doc = owner.service("doc");

    return withRealm(owner, () => doc.render(<Template />, cursor));
  }
}

export const Main = page(() => new MaterialPage());

const Template = def(() => {
  return (
    <>
      <NavBar />
      <div class="material">
        <Material />
      </div>
    </>
  );
});

const Material = def(() => (
  <>
    <Text label="Favorite food" />
    <Button text="Eat" />
  </>
));
