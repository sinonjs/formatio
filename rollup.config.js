"use strict";

var commonjs = require("rollup-plugin-commonjs");

module.exports = {
    input: "lib/formatio.js",
    plugins: [commonjs({ sourceMap: false })],
    output: {
        exports: "named",
        format: "umd",
        globals: {
            // map '@sinonjs/samsam' to 'samsam' global variable
            "@sinonjs/samsam": "samsam"
        },
        name: "formatio"
    },
    external: ["@sinonjs/samsam"]
};
