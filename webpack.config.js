const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",

  output: {
    path: path.resolve("dist"),
    filename: "mde-bundle.js",
  },

  externals: {
    jquery: "jQuery",
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: "babel-loader",
      },
    ],
  },
};
