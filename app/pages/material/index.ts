import type { App, Owner, Services } from "@shimmer/core";
import { def, fragment, html } from "@shimmer/dsl";
import { Nav } from "../nav";
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

    return doc.render(Template(undefined, owner.$), cursor);
  }
}

export const Main = page(() => new MaterialPage());

const Template = def(({ $ }) => {
  return fragment($(Nav), html.div.material($(Material)));
});

const Material = def(({ $ }) => {
  return fragment($(Text), $(Button));
});
