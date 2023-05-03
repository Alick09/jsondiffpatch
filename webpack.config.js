const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    mode: "production",
    target: "web",
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        globalObject: "this",
        library: "ag-jsondiffpatch",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
};