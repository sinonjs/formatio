if (typeof require != "undefined") {
    require.paths.unshift(__dirname + "/../lib/");
    require.paths.unshift(__dirname + "/../deps/buster-util/lib/");
    var testCase = require("test_case").testCase;
    var assert = require("assert");
    var buster = { format: require("object-format") };
}

(function () {
    function F() {}

    var create = Object.create || function (object) {
        F.prototype = object;
        return new F();
    };

    testCase("AsciiFormatTest", {
        "should format strings with quotes": function () {
            assert.equal('"A string"', buster.format.ascii("A string"));
        },

        "should format booleans without quotes": function () {
            assert.equal("true", buster.format.ascii(true));
            assert.equal("false", buster.format.ascii(false));
        },

        "should format null and undefined without quotes": function () {
            assert.equal("null", buster.format.ascii(null));
            assert.equal("undefined", buster.format.ascii(undefined));
        },

        "should format numbers without quotes": function () {
            assert.equal("3", buster.format.ascii(3));
            assert.equal("3987.56", buster.format.ascii(3987.56));
            assert.equal("-980", buster.format.ascii(-980.0));
            assert.equal("NaN", buster.format.ascii(NaN));
            assert.equal("Infinity", buster.format.ascii(Infinity));
            assert.equal("-Infinity", buster.format.ascii(-Infinity));
        },

        "should format regexp using toString": function () {
            assert.equal("/[a-zA-Z0-9]+\\.?/", buster.format.ascii(/[a-zA-Z0-9]+\.?/));
        },

        "should format functions with name": function () {
            assert.equal("function doIt() {}", buster.format.ascii(function doIt() {}));
        },

        "should format functions without name": function () {
            assert.equal("function () {}", buster.format.ascii(function () {}));
        },

        "should format functions with display name": function () {
            function doIt() {}
            doIt.displayName = "ohHai";

            assert.equal("function ohHai() {}", buster.format.ascii(doIt));
        },

        "should shorten functions with long bodies": function () {
            function doIt() {
                var i;
                function hey() {}
                for (; i < 10; i++) {
                }
            }

            assert.equal("function doIt() {}", buster.format.ascii(doIt));
        },

        "should format functions with no name or display name": function () {
            function doIt() {}
            doIt.name = "";

            assert.equal("function doIt() {}", buster.format.ascii(doIt));
        },

        "should format arrays": function () {
            function ohNo() { return "Oh yes!"; }

            var array = ["String", 123, /a-z/, null];

            var str = buster.format.ascii(array);
            assert.equal('["String", 123, /a-z/, null]', str);

            str = buster.format.ascii([ohNo, array]);
            assert.equal('[function ohNo() {}, ["String", 123, /a-z/, null]]', str);
        },

        "should not trip on circular arrays": function () {
            var array = ["String", 123, /a-z/];
            array.push(array);

            var str = buster.format.ascii(array);
            assert.equal('["String", 123, /a-z/, [Circular]]', str);
        },

        "should format object": function () {
            var object = {
                id: 42,
                hello: function () {},
                prop: "Some",
                more: "properties",
                please: "Gimme some more",
                "oh hi": 42,
                seriously: "many properties"
            };

            var expected = "{\n  hello: function () {},\n  id: 42,\n  " +
                "more: \"properties\",\n  \"oh hi\": 42,\n  please: " +
                "\"Gimme some more\",\n  prop: \"Some\"," +
                "\n  seriously: \"many properties\"\n}";

            assert.equal(expected, buster.format.ascii(object));
        },

        "should format short object on one line": function () {
            var object = {
                id: 42,
                hello: function () {},
                prop: "Some"
            };

            var expected = "{ hello: function () {}, id: 42, prop: \"Some\" }";
            assert.equal(expected, buster.format.ascii(object));
        },

        "should format nested object": function () {
            var object = {
                id: 42,
                hello: function () {},
                prop: "Some",
                obj: {
                    num: 23,
                    string: "Here you go you little mister"
                }
            };

            var expected = "{\n  hello: function () {},\n  id: 42,\n  obj" +
                ": { num: 23, string: \"Here you go you little mister\"" +
                " },\n  prop: \"Some\"\n}";

            assert.equal(expected, buster.format.ascii(object));
        },

        "should include constructor if known and not Object": function () {
            function Person(name) {
                this.name = name;
            }

            var person = new Person("Christian");

            assert.equal("[Person] { name: \"Christian\" }", buster.format.ascii(person));
        },

        "should not include one letter constructors": function () {
            function F(name) {
                this.name = name;
            }

            var person = new F("Christian");

            assert.equal("{ name: \"Christian\" }", buster.format.ascii(person));
        },

        "should include one letter constructors when configured to do so": function () {
            function C(name) {
                this.name = name;
            }

            var person = new C("Christian");
            var formatter = create(buster.format);
            formatter.excludeConstructors = [];

            assert.equal("[C] { name: \"Christian\" }", formatter.ascii(person));
        },

        "should exclude constructors when configured to do so": function () {
            function Person(name) {
                this.name = name;
            }

            var person = new Person("Christian");
            var formatter = create(buster.format);
            formatter.excludeConstructors = ["Person"];

            assert.equal("{ name: \"Christian\" }", formatter.ascii(person));
        },

        "should exclude constructors by pattern when configured to do so": function () {
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
            var formatter = create(buster.format);
            formatter.excludeConstructors = [/^Per/];

            assert.equal("{ name: \"Christian\" }", formatter.ascii(person));
            assert.equal("[Ninja] { name: \"Haruhachi\" }", formatter.ascii(ninja));
            assert.equal("{ name: \"Mr. Garrison\" }", formatter.ascii(pervert));
        },

        "should not trip on circular formatting": function () {
            var object = {};
            object.foo = object;

            assert.equal("{ foo: [Circular] }", buster.format.ascii(object));
        },

        "should not trip on indirect circular formatting": function () {
            var object = { someProp: {} };
            object.someProp.foo = object;

            assert.equal("{ someProp: { foo: [Circular] } }", buster.format.ascii(object));
        },

        "should format nested array nicely": function () {
            var object = { people: ["Chris", "August"] };

            assert.equal("{ people: [\"Chris\", \"August\"] }",
                         buster.format.ascii(object));
        }
    });

    if (typeof document != "undefined") {
        testCase("AsciiFormatDOMElementTest", {
            "should format dom element": function () {
                var element = document.createElement("div");

                assert.equal("<div></div>", buster.format.ascii(element));
            },

            "should format dom element with attributes": function () {
                var element = document.createElement("div");
                element.className = "hey there";
                element.id = "ohyeah";
                var str = buster.format.ascii(element);

                assert.ok(/<div (.*)><\/div>/.test(str));
                assert.ok(/class="hey there"/.test(str));
                assert.ok(/id="ohyeah"/.test(str));
            },

            "should format dom element with content": function () {
                var element = document.createElement("div");
                element.innerHTML = "Oh hi!";

                assert.equal("<div>Oh hi!</div>",
                             buster.format.ascii(element));
            },

            "should truncate dom element content": function () {
                var element = document.createElement("div");
                element.innerHTML = "Oh hi! I'm Christian, and this is a lot of content";

                assert.equal("<div>Oh hi! I'm Christian [...]</div>",
                             buster.format.ascii(element));
            },

            "should include attributes and truncated content": function () {
                var element = document.createElement("div");
                element.id = "anid";
                element.lang = "en"
                element.innerHTML = "Oh hi! I'm Christian, and this is a lot of content";
                var str = buster.format.ascii(element);

                assert.ok(/<div (.*)>Oh hi! I'm Christian \[\.\.\.\]<\/div>/.test(str));
                assert.ok(/lang="en"/.test(str));
                assert.ok(/id="anid"/.test(str));
            }
        });
    }
}());