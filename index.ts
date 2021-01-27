let url = new URL(location.href);
let page = url.searchParams.get("page");

if (page === "tests") {
  import("./packages/tests/index");
} else {
  throw new Error(`unimplemented demos`);
  // import("./app/index");
}

export {};
