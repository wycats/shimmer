module.exports = {
  plugins: [
    "@snowpack/plugin-typescript",
    [
      "@snowpack/plugin-sass",
      {
        compilerOptions: {
          scss: true,
        },
      },
    ],
  ],
  mount: {
    app: "/",
    src: "/lib",
  },
};
