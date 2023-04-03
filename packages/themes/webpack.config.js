const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const IS_PRODUCTION = process.argv.indexOf('--mode=production') > -1;
let mode = "development";
if (IS_PRODUCTION) {
  mode = "production";
}

let devtool = "inline-source-map";
if (IS_PRODUCTION) {
  devtool = false;
}

let minimize = false;
if (IS_PRODUCTION) {
  minimize = true;
}

let publicPath = "http://localhost:2043/";
if (IS_PRODUCTION) {
  publicPath = "./jupyter-react-themes.js/";
}

module.exports = {
  entry: "./src/Example",
  mode: mode,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 2000, // Seems to stabilise HMR file change detection
    ignored: "/node_modules/"
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    port: 2043,
    historyApiFallback: true,
  },
  devtool: devtool,
  optimization: {
    minimize: minimize,
  },
  output: {
    publicPath: publicPath,
    filename: 'jupyter-react-themes.js',
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: { 
      path: "path-browserify"
    },
  },
  module: {
    rules: [
      {
        test: /bootstrap\.tsx$/,
        loader: "bundle-loader",
        options: {
          lazy: true,
        },
      },
      {
        test: /\.tsx?$/,
        loader: "babel-loader",
        options: {
          plugins: [
            "@babel/plugin-proposal-class-properties",
          ],
          presets: [
            ["@babel/preset-react", {
                runtime: 'automatic',
                importSource: 'react'
              },
            ],
            "@babel/preset-typescript",
          ],
          cacheDirectory: true
        }
      },
      {
        test: /\.css?$/i,
        use: ['style-loader', 'css-loader'],
      },
     ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
