/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry : './src/index.tsx',
    mode:'development',
    output : {
        path : path.resolve(__dirname , 'dist'),
        filename: 'datalayer-editor-css.js'
    },
	resolve: {
		extensions: [".ts", ".tsx", ".js"]
	},
    module : {
        rules : [
            {
                loader: 'babel-loader',
				test: /\.ts(x?)?$/
			},
            {
                test : /\.css$/,
                exclude: /node_modules/,
                use: [
                    'style-loader',
                    {
                      loader: 'css-loader',
                      options: {
                        modules: true,
                        esModule: true
                      },
                     },
                ],
            },
            {
                // in css files, svg is loaded as a url formatted string
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                issuer: /\.css$/ ,
                use: {
                  loader: 'svg-url-loader',
                  options: { encoding: 'none', limit: 10000 }
                }
            },
            {
                // in js, jsx, ts, and tsx files svg is loaded as a raw string
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                issuer:  /\.(js|jsx|ts|tsx)$/,
                use: {
                    loader: 'raw-loader'
                }
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                use: 'url-loader?limit=10000&mimetype=application/font-woff'
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                use: 'url-loader?limit=10000&mimetype=application/font-woff'
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                use: 'url-loader?limit=10000&mimetype=application/octet-stream'
            },
            {
                test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
                use: 'url-loader?limit=10000&mimetype=application/octet-stream'
            },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, use: 'file-loader' },
          ]
    },
    plugins : [
        new HtmlWebpackPlugin ({
            template : 'public/index.html'
        })
    ]
}
