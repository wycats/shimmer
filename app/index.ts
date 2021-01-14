import type { App, Cursor } from "../src/index";
import type { Owner } from "../src/owner";
import "./pages/patch-example.js";
import { Router, RoutesWithOwner } from "./router/router";

function route(owner: Owner): RoutesWithOwner {
  return async function route(url: string, cursor: Cursor): Promise<App> {
    switch (url) {
      case "index": {
        let page = await import("./pages/index.js");
        return page.Main.render(cursor, owner);
      }
      case "tutorial": {
        let page = await import("./pages/tutorial.js");
        return page.Main.render(cursor, owner);
      }

      default:
        let page = await import("./pages/fallback.js");
        return page.Main.render(cursor);
    }
  };
}

Router.startForBrowser(route);
