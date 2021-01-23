let url = new URL(location.href);
let page = url.searchParams.get("page");

console.log(page);

if (page === "tests") {
  import("./packages/tests/test");
} else {
  throw new Error(`unimplemented demos`);
  // import("./app/index");
}

export {};
