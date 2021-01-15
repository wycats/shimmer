import type { App, Cursor } from "../src/index";
import type { Owner } from "../src/owner";
import "./pages/patch-example.js";
import { Router, RoutesWithOwner } from "./router/router";
import type { UrlDetails } from "./router/url-bar";

function route(owner: Owner): RoutesWithOwner {
  return async function route(url: UrlDetails, cursor: Cursor): Promise<App> {
    switch (url.path) {
      case "/index": {
        let page = await import("./pages/index.js");
        return page.Main(owner)(cursor);
      }
      case "/tutorial": {
        switch (url.params["part"]) {
          case "1":
          case undefined: {
            let page = await import("./pages/tutorial/part1.js");
            return page.Main(owner)(cursor);
          }
          case "2": {
            let page = await import("./pages/tutorial/part2.js");
            return page.Main(owner)(cursor);
          }
          case "3": {
            let page = await import("./pages/tutorial/part3.js");
            return page.Main(owner)(cursor);
          }
          case "4": {
            let page = await import("./pages/tutorial/part4.js");
            return page.Main(owner)(cursor);
          }
          case "5": {
            let page = await import("./pages/tutorial/part5.js");
            return page.Main(owner)(cursor);
          }
          default: {
            let page = await import("./pages/error.js");
            return page.Main(owner)(cursor);
          }
        }
      }

      case "/state": {
        let page = await import("./pages/state/index.js");
        return page.Main(owner)(cursor);
      }

      default:
        let page = await import("./pages/fallback.js");
        return page.Main(owner)(cursor);
    }
  };
}

Router.startForBrowser(route);
