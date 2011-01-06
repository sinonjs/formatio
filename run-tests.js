#!/usr/bin/env node

require.paths.unshift(__dirname + "/lib/");
require.paths.unshift(__dirname + "/deps/buster-util/lib/");

require("./test/buster-object-format-test.js");
