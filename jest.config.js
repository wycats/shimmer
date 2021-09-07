export default /** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */ ({
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts)$": [
      "@swc/jest",
      {
        module: {
          type: "commonjs",
        },
        jsc: {
          target: "es2020",
          parser: {
            syntax: "typescript",
            decorators: true,
          },
        },
      },
    ],
  },
});
