const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const shimJS = path.resolve(__dirname, "src", "emptyshim.js");
function shim(regExp) {
  return new webpack.NormalModuleReplacementPlugin(regExp, shimJS);
}

const ENTRY = process.env.RENDER == "true"
  ? "./src/render/DashboardRenderApp"
  : "./src/DashboardApp";

const IS_PRODUCTION = process.argv.indexOf('--mode=production') > -1;
const mode = IS_PRODUCTION ? "production" : "development";
const devtool = IS_PRODUCTION ? false : "inline-source-map";
const minimize = IS_PRODUCTION ? true : false;
const publicPath = IS_PRODUCTION ? "/static/jupyter_dashboard/" : "http://localhost:3063/";

module.exports = {
  entry: ENTRY,
  mode: mode,
  devServer: {
    port: 3063,
    client: { overlay: false },
    historyApiFallback: true,
    https: false,
    server: 'http',
    proxy: {
      /*
      '/api/jupyter': {
        target: JUPYTER_HOST,
        ws: true,
        secure: false,
        changeOrigin: true,
      },
      */
      '/build/pypi': {
        target: 'https://datalayer-assets.s3.us-west-2.amazonaws.com/pypi',
        pathRewrite: { '^/build/pypi': '' },
        ws: false,
        secure: false,
        changeOrigin: true,
      },
      '/services.js': {
        target: 'https://datalayer-assets.s3.us-west-2.amazonaws.com/services.js',
        pathRewrite: { '^/services.js': '' },
        ws: false,
        secure: false,
        changeOrigin: true,
      },
      '/plotly.js': {
        target: 'https://cdn.plot.ly',
        pathRewrite: { '^/plotly.js': 'plotly-2.25.2.min.js' },
        ws: false,
        secure: false,
        changeOrigin: true,
      },
    }
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 2000, // Seems to stabilise HMR file change detection
    ignored: "/node_modules/"
  },
  devtool,
  optimization: {
    minimize,
//    usedExports: true,
  },
  output: {
    publicPath,
//    filename: '[name].[contenthash].jupyter-dashboard.js',
    filename: '[name].jupyter-dashboard.js',
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      path: "path-browserify",
      stream: "stream-browserify",
    },
  },
  module: {
    rules: [
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
              },
            ],
            "@babel/preset-typescript",
          ],
          cacheDirectory: true
        },
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-react"],
          cacheDirectory: true
        }
      },
      {
        test: /\.css?$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        // In .css files, svg is loaded as a data URI.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.css$/,
        use: {
          loader: 'svg-url-loader',
          options: { encoding: 'none', limit: 10000 }
        }
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.tsx$/,
        use: [
          '@svgr/webpack'
        ],
      },
      {
        // In .ts and .tsx files (both of which compile to .js), svg files
        // must be loaded as a raw string instead of data URIs.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.js$/,
        use: {
          loader: 'raw-loader'
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif|ttf|woff|woff2|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [{ loader: 'url-loader', options: { limit: 10000 } }],
      },
     ]
  },
  plugins: [
    !IS_PRODUCTION ?
      new webpack.ProvidePlugin({
        process: 'process/browser'
      })
    :
      new webpack.ProvidePlugin({
        process: 'process/browser'
      }),
      new BundleAnalyzerPlugin({
          analyzerMode: IS_PRODUCTION ? "static" : "disabled", // server, static, json, disabled.
          openAnalyzer: false,
          generateStatsFile: false,
        }),
    shim(/@fortawesome/),
    shim(/moment/),
    shim(/react-jvectormap/),
    shim(/react-slick/),
    shim(/react-tagsinput/),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
