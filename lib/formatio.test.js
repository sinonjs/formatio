"use strict";

var jsdom = require("jsdom-global")("", { url: "http://localhost" });
var assert = require("@sinonjs/referee").assert;
var refute = require("@sinonjs/referee").refute;
var formatio = require("./formatio");

var namesAnonymousFunctions = (function() {
    // eslint-disable-next-line no-empty-function
    var f = function() {};

    return f.name === "f";
})();

function range(size) {
    var array = [];

    for (var i = 0; i < size; i++) {
        array[i] = i;
    }

    return array;
}

function getObjectWithManyProperties(size) {
    var object = {};

    for (var i = 0; i < size; i++) {
        object[i.toString()] = i;
    }

    return object;
}

describe("formatio.ascii", function() {
    it("formats strings with quotes", function() {
        // eslint-disable-next-line quotes
        assert.equals(formatio.ascii("A string"), '"A string"');
    });

    it("formats 0-length strings in a special way", function() {
        assert.equals(formatio.ascii(""), "(empty string)");
    });

    it("formats booleans without quotes", function() {
        assert.equals(formatio.ascii(true), "true");
        assert.equals(formatio.ascii(false), "false");
    });

    it("formats null and undefined without quotes", function() {
        assert.equals(formatio.ascii(null), "null");
        assert.equals(formatio.ascii(undefined), "undefined");
    });

    it("formats numbers without quotes", function() {
        assert.equals(formatio.ascii(3), "3");
        assert.equals(formatio.ascii(3987.56), "3987.56");
        assert.equals(formatio.ascii(-980.0), "-980");
        assert.equals(formatio.ascii(NaN), "NaN");
        assert.equals(formatio.ascii(Infinity), "Infinity");
        assert.equals(formatio.ascii(-Infinity), "-Infinity");
        assert.equals(formatio.ascii(-0), "-0");
    });

    it("formats regexp using toString", function() {
        assert.equals(formatio.ascii(/[a-zA-Z0-9]+\.?/), "/[a-zA-Z0-9]+\\.?/");
    });

    it("formats functions with name", function() {
        // eslint-disable-next-line no-empty-function
        var fn = function doIt() {};
        assert.equals(formatio.ascii(fn), "function doIt() {}");
    });

    it("formats functions without name", function() {
        assert.equals(
            // eslint-disable-next-line no-empty-function
            formatio.ascii(function() {}),
            "function () {}"
        );
    });

    it("formats functions with display name", function() {
        // eslint-disable-next-line no-empty-function
        function doIt() {}
        doIt.displayName = "ohHai";

        assert.equals(formatio.ascii(doIt), "function ohHai() {}");
    });

    it("shortens functions with long bodies", function() {
        function doIt() {
            var i;
            // eslint-disable-next-line no-unused-vars, no-empty-function
            function hey() {}
            for (i = 0; i < 10; i++) {
                // eslint-disable-next-line no-console
                console.log(i);
            }
        }

        assert.equals(formatio.ascii(doIt), "function doIt() {}");
    });

    it("formats functions with no name or display name", function() {
        // eslint-disable-next-line no-empty-function
        function doIt() {}

        Object.defineProperty(doIt, "name", {
            value: "",
            writable: false
        });

        assert.equals(formatio.ascii(doIt), "function doIt() {}");
    });

    it("formats arrays", function() {
        function ohNo() {
            return "Oh yes!";
        }

        var array = ["String", 123, /a-z/, null];

        var str = formatio.ascii(array);
        // eslint-disable-next-line quotes
        assert.equals(str, '["String", 123, /a-z/, null]');

        str = formatio.ascii([ohNo, array]);
        assert.equals(
            str,
            // eslint-disable-next-line quotes
            '[function ohNo() {}, ["String", 123, /a-z/, null]]'
        );
    });

    it("does not trip on circular arrays", function() {
        var array = ["String", 123, /a-z/];
        array.push(array);

        var str = formatio.ascii(array);
        // eslint-disable-next-line quotes
        assert.equals(str, '["String", 123, /a-z/, [Circular]]');
    });

    describe("limit formatted array length", function() {
        it("should stop at given limit", function() {
            var configuredFormatio = formatio.configure({
                limitChildrenCount: 30
            });
            var str = configuredFormatio.ascii(range(300));

            refute.contains(str, "30");
            assert.contains(str, "29");
            assert.contains(str, "[... 270 more elements]");
        });

        it("should only format as many elements as exists", function() {
            var configuredFormatio = formatio.configure({
                limitChildrenCount: 30
            });
            var str = configuredFormatio.ascii(range(10));

            refute.contains(str, "10");
            assert.contains(str, "9");
            refute.contains(str, "undefined");
            refute.contains(str, "[...");
        });

        it("should format all array elements if no config is used", function() {
            var str = formatio.ascii(range(300));

            assert.contains(str, "100");
            assert.contains(str, "299]");
            refute.contains(str, "[...");
        });
    });

    describe("limit count of formatted object properties", function() {
        it("should stop at given limit", function() {
            var configured = formatio.configure({
                limitChildrenCount: 30
            });
            var str = configured.ascii(getObjectWithManyProperties(300));

            // returned formation may not be in the original order
            assert.equals(30 + 3, str.split("\n").length);
            assert.contains(str, "[... 270 more elements]");
        });

        it("should only format as many properties as exists", function() {
            var configured = formatio.configure({
                limitChildrenCount: 30
            });
            var str = configured.ascii(getObjectWithManyProperties(10));

            refute.contains(str, "10");
            assert.contains(str, "9");
            refute.contains(str, "undefined");
            refute.contains(str, "[...");
        });

        it("should format all properties if no config is used", function() {
            var str = formatio.ascii(getObjectWithManyProperties(300));

            assert.equals(300 + 2, str.split("\n").length);
        });
    });

    it("formats object", function() {
        var object = {
            id: 42,
            // eslint-disable-next-line no-empty-function
            hello: function() {},
            prop: "Some",
            more: "properties",
            please: "Gimme some more",
            "oh hi": 42,
            seriously: "many properties"
        };
        object[Symbol("key")] = Symbol("value");

        var expectedFunctionString = namesAnonymousFunctions
            ? "hello: function hello() {}"
            : "hello: function () {}";

        var expected =
            "{\n  " +
            expectedFunctionString +
            ",\n  id: 42,\n  " +
            // eslint-disable-next-line quotes
            'more: "properties",\n  "oh hi": 42,\n  please: ' +
            // eslint-disable-next-line quotes
            '"Gimme some more",\n  prop: "Some",\n' +
            // eslint-disable-next-line quotes
            '  seriously: "many properties",\n' +
            "  Symbol(key): Symbol(value)\n}";

        assert.equals(formatio.ascii(object), expected);
    });

    it("formats short object on one line", function() {
        var object = {
            id: 42,
            // eslint-disable-next-line no-empty-function
            hello: function() {},
            prop: "Some"
        };

        var expectedFunctionString = namesAnonymousFunctions
            ? "hello: function hello() {}"
            : "hello: function () {}";

        var expected =
            // eslint-disable-next-line quotes
            "{ " + expectedFunctionString + ', id: 42, prop: "Some" }';
        assert.equals(formatio.ascii(object), expected);
    });

    it("formats object with a non-function toString", function() {
        var object = { toString: 42 };
        assert.equals(formatio.ascii(object), "{ toString: 42 }");
    });

    it("formats nested object", function() {
        var object = {
            id: 42,
            // eslint-disable-next-line no-empty-function
            hello: function() {},
            prop: "Some",
            obj: {
                num: 23,
                string: "Here you go you little mister"
            }
        };

        var expectedFunctionString = namesAnonymousFunctions
            ? "hello: function hello() {}"
            : "hello: function () {}";

        var expected =
            "{\n  " +
            expectedFunctionString +
            ",\n  id: 42,\n  obj" +
            // eslint-disable-next-line quotes
            ': { num: 23, string: "Here you go you little mister"' +
            // eslint-disable-next-line quotes
            ' },\n  prop: "Some"\n}';

        assert.equals(formatio.ascii(object), expected);
    });

    it("includes constructor if known and not Object", function() {
        function Person(name) {
            this.name = name;
        }

        var person = new Person("Christian");

        // eslint-disable-next-line quotes
        assert.equals(formatio.ascii(person), '[Person] { name: "Christian" }');
    });

    it("does not include one letter constructors", function() {
        function F(name) {
            this.name = name;
        }

        var person = new F("Christian");

        // eslint-disable-next-line quotes
        assert.equals(formatio.ascii(person), '{ name: "Christian" }');
    });

    it("includes one letter constructors when configured so", function() {
        function C(name) {
            this.name = name;
        }

        var person = new C("Christian");
        var formatter = formatio.configure({ excludeConstructors: [] });

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(person), '[C] { name: "Christian" }');
    });

    it("excludes constructors when configured to do so", function() {
        function Person(name) {
            this.name = name;
        }

        var person = new Person("Christian");
        var formatter = formatio.configure({ excludeConstructors: ["Person"] });

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(person), '{ name: "Christian" }');
    });

    it("excludes constructors by pattern when configured so", function() {
        function Person(name) {
            this.name = name;
        }
        function Ninja(name) {
            this.name = name;
        }
        function Pervert(name) {
            this.name = name;
        }

        var person = new Person("Christian");
        var ninja = new Ninja("Haruhachi");
        var pervert = new Pervert("Mr. Garrison");
        var formatter = formatio.configure({ excludeConstructors: [/^Per/] });

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(person), '{ name: "Christian" }');

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(ninja), '[Ninja] { name: "Haruhachi" }');

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(pervert), '{ name: "Mr. Garrison" }');
    });

    it("excludes constructors when run on other objects", function() {
        function Person(name) {
            this.name = name;
        }

        var person = new Person("Christian");
        var formatter = { ascii: formatio.ascii };
        formatter.excludeConstructors = ["Person"];

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(person), '{ name: "Christian" }');
    });

    it("excludes default constructors when run on other objects", function() {
        var person = { name: "Christian" };
        var formatter = { ascii: formatio.ascii };

        // eslint-disable-next-line quotes
        assert.equals(formatter.ascii(person), '{ name: "Christian" }');
    });

    it("does not trip on circular formatting", function() {
        var object = {};
        object.foo = object;

        assert.equals(formatio.ascii(object), "{ foo: [Circular] }");
    });

    it("does not trip on indirect circular formatting", function() {
        var object = { someProp: {} };
        object.someProp.foo = object;

        assert.equals(
            formatio.ascii(object),
            "{ someProp: { foo: [Circular] } }"
        );
    });

    it("formats nested array nicely", function() {
        var object = { people: ["Chris", "August"] };

        assert.equals(
            formatio.ascii(object),
            // eslint-disable-next-line quotes
            '{ people: ["Chris", "August"] }'
        );
    });

    it("does not rely on object's hasOwnProperty", function() {
        // Create object with no "own" properties to get past
        //  Object.keys test and no .hasOwnProperty() function
        //  eslint-disable-next-line no-empty-function
        var Obj = function() {};
        Obj.prototype = { hasOwnProperty: undefined };
        var object = new Obj();

        assert.equals(formatio.ascii(object), "{  }");
    });

    it("handles cyclic structures", function() {
        var obj = {};
        obj.list1 = [obj];
        obj.list2 = [obj];
        obj.list3 = [{ prop: obj }];

        refute.exception(function() {
            formatio.ascii(obj);
        });
    });

    it("formats symbol", function() {
        assert.equals(formatio.ascii(Symbol("value")), "Symbol(value)");
    });

    describe("sets", function() {
        it("formats sets", function() {
            var set = new Set();

            set.add(2);
            set.add({
                id: 42,
                prop: "Some"
            });

            // eslint-disable-next-line quotes
            var expected = 'Set {2, { id: 42, prop: "Some" }}';
            assert.equals(formatio.ascii(set), expected);
        });

        it("limits the number of set members", function() {
            var fmt = formatio.configure({ limitChildrenCount: 30 });
            var set = new Set();

            for (var i = 0; i < 300; i++) {
                set.add(i);
            }

            var str = fmt.ascii(set);

            refute.contains(str, "30");
            assert.contains(str, "29");
            assert.contains(str, "[... 270 more elements]");
        });
    });

    describe("maps", function() {
        it("formats maps", function() {
            var map = new Map();

            map.set(42, "foo");
            map.set("sinon", "bar");
            map.set({ foo: "bar" }, "baz");

            assert.equals(
                formatio.ascii(map),
                // eslint-disable-next-line quotes
                'Map [[42, "foo"], ["sinon", "bar"], [{ foo: "bar" }, "baz"]]'
            );
        });

        it("limits the number of map members", function() {
            var fmt = formatio.configure({ limitChildrenCount: 30 });
            var map = new Map();

            for (var i = 0; i < 300; i++) {
                map.set(i, "some value");
            }

            var str = fmt.ascii(map);

            refute.contains(str, "30");
            assert.contains(str, "29");
            assert.contains(str, "[... 270 more elements]");
        });
    });

    describe("unquoted strings", function() {
        beforeEach(function() {
            this.formatter = formatio.configure({ quoteStrings: false });
        });

        it("does not quote strings", function() {
            assert.equals(this.formatter.ascii("Hey there"), "Hey there");
        });

        it("quotes string properties", function() {
            var obj = { hey: "Mister" };
            // eslint-disable-next-line quotes
            assert.equals(this.formatter.ascii(obj), '{ hey: "Mister" }');
        });
    });

    describe("numbers", function() {
        it("formats object with 0", function() {
            var str = formatio.ascii({ me: 0 });
            refute.match(str, "-0");
        });

        it("formats object with -0", function() {
            var str = formatio.ascii({ me: -0 });
            assert.match(str, "-0");
        });
    });

    describe("DOM elements", function() {
        it("formats dom element", function() {
            var element = document.createElement("div");

            assert.equals(formatio.ascii(element), "<div></div>");
        });

        it("formats dom element with attributes", function() {
            var element = document.createElement("div");
            element.className = "hey there";
            element.id = "ohyeah";
            var str = formatio.ascii(element);

            assert.match(str, /<div (.*)><\/div>/);
            assert.match(str, /class="hey there"/);
            assert.match(str, /id="ohyeah"/);
        });

        it("formats dom element with content", function() {
            var element = document.createElement("div");
            element.innerHTML = "Oh hi!";

            assert.equals(formatio.ascii(element), "<div>Oh hi!</div>");
        });

        it("truncates dom element content", function() {
            var element = document.createElement("div");
            element.innerHTML =
                "Oh hi! I'm Christian, and this is a lot of content";

            assert.equals(
                formatio.ascii(element),
                "<div>Oh hi! I'm Christian[...]</div>"
            );
        });

        it("includes attributes and truncated content", function() {
            var element = document.createElement("div");
            element.id = "anid";
            element.lang = "en";
            element.innerHTML =
                "Oh hi! I'm Christian, and this is a lot of content";
            var str = formatio.ascii(element);

            assert.match(
                str,
                /<div (.*)>Oh hi! I'm Christian\[\.\.\.\]<\/div>/
            );
            assert.match(str, /lang="en"/);
            assert.match(str, /id="anid"/);
        });

        it("strips out if attribute contenteditable is set to inherit", function() {
            var element = document.createElement("div");
            element.setAttribute("contenteditable", "inherit");
            assert.equals(formatio.ascii(element), "<div></div>");
        });

        it("strips out attribute that have no value", function() {
            var element = document.createElement("div");
            element.setAttribute("id", "");
            assert.equals(formatio.ascii(element), "<div></div>");
        });

        it("formats document object as toString", function() {
            var str;
            refute.exception(function() {
                str = formatio.ascii(document);
            });

            assert.equals(str, "[object HTMLDocument]");
        });

        it("formats window object as toString", function() {
            var str;
            refute.exception(function() {
                str = formatio.ascii(window);
            });

            assert.equals(str, "[object Window]");
        });
    });

    describe("global object", function() {
        if (typeof global === "undefined") {
            return;
        }

        it("formats global object as toString", function() {
            var str;
            refute.exception(function() {
                str = formatio.ascii(global);
            });

            assert.equals(str, "[object global]");
        });
    });

    describe("BigInt", function() {
        before(function() {
            if (typeof BigInt === "undefined") {
                this.skip();
            }
        });

        // Note: We cannot use 0n, 1n, -1n here because not all
        // browsers and node versions support BigInt at the moment
        // and this will result in a SyntaxError

        it("formats 0n", function() {
            // eslint-disable-next-line
            assert.equals(formatio.ascii(BigInt("0")), "0");
        });

        it("formats positive values", function() {
            // eslint-disable-next-line
            assert.equals(formatio.ascii(BigInt("1")), "1");
        });

        it("formats negative values", function() {
            // eslint-disable-next-line
            assert.equals(formatio.ascii(BigInt("-1")), "-1");
        });
    });

    describe("arguments", function() {
        it("excludes the values method", function() {
            var str = formatio.ascii(arguments);

            assert.equals(str, "{  }");
        });
    });
});

describe("formatio.constructorName", function() {
    before(function() {
        jsdom();
        delete require.cache[require.resolve("./formatio")];
        formatio = require("./formatio");
    });

    it("should return the constructors name", function() {
        assert.equals(formatio.constructorName([]), "Array");
    });
});
