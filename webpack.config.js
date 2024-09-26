const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineCssPlugin = require("html-inline-css-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const devMode = process.env.NODE_ENV !== "production";
const path = require("path");

module.exports = {
    entry: [
        path.resolve(__dirname, "./src/app.js"),
        path.resolve(__dirname, "./src/app.css")
    ],
    devtool: false,
    output: {
        path: path.resolve(__dirname, "./dist")
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    devMode ? {loader: 'style-loader'} : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        }
                    },
                    {
                        loader: 'postcss-loader'
                    }
                ]
            }
        ]
    },
    devServer: {
        hot: true,
        open: true,
        port: 3000
    },
    plugins: [
        new CssMinimizerPlugin({
            minimizerOptions: {
                preset: [
                    "default",
                    {
                        discardComments: {removeAll: true},
                    },
                ],
            }
        }),
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "./src/app.ejs"),
            scriptLoading: "blocking",
            inject: true
        }),
        new HtmlInlineCssPlugin.default(),
        ...(function() {
            let productionPlugin = [];
            if (process.env.NODE_ENV === "production") {
                productionPlugin.push(new HtmlInlineScriptPlugin());
            }
            return productionPlugin
        })()
    ]
}
