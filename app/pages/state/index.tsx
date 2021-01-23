import { App, Owner, Services, withRealm } from "@shimmer/core";
import { def } from "@shimmer/dsl";
import { NavBar } from "../nav";
import { page, PageHooks, RenderOptions, StaticOptions } from "../page";
import Counter from "./counter";

interface CounterState {}

export class CounterPage implements PageHooks<CounterState> {
  construct(_owner: Owner<Services>): CounterState {
    return {};
  }
  render(
    _state: CounterState,
    { owner }: StaticOptions,
    { cursor }: RenderOptions
  ): App {
    return withRealm(owner, () =>
      owner.service("doc").render(<Template />, cursor)
    );
  }
}

export const Main = page(() => new CounterPage());

const Template = def(() => (
  <>
    <NavBar />
    <div class="fallback">
      <Counter />
    </div>
  </>
));
