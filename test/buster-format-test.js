if (typeof require != "undefined") {
    var testCase = require("buster-util/test-case");
    var buster = {
        assert: require("buster-assert"),
        format: require("buster-format")
    };
}

(function () {
    function F() {}

    var create = Object.create || function (object) {
        F.prototype = object;
        return new F();
    };

    testCase("AsciiFormatTest", {
        "should format strings with quotes": function () {
            buster.assert.equals('"A string"', buster.format.ascii("A string"));
        },

        "should format booleans without quotes": function () {
            buster.assert.equals("true", buster.format.ascii(true));
            buster.assert.equals("false", buster.format.ascii(false));
        },

        "should format null and undefined without quotes": function () {
            buster.assert.equals("null", buster.format.ascii(null));
            buster.assert.equals("undefined", buster.format.ascii(undefined));
        },

        "should format numbers without quotes": function () {
            buster.assert.equals("3", buster.format.ascii(3));
            buster.assert.equals("3987.56", buster.format.ascii(3987.56));
            buster.assert.equals("-980", buster.format.ascii(-980.0));
            buster.assert.equals("NaN", buster.format.ascii(NaN));
            buster.assert.equals("Infinity", buster.format.ascii(Infinity));
            buster.assert.equals("-Infinity", buster.format.ascii(-Infinity));
        },

        "should format regexp using toString": function () {
            buster.assert.equals("/[a-zA-Z0-9]+\\.?/", buster.format.ascii(/[a-zA-Z0-9]+\.?/));
        },

        "should format functions with name": function () {
            buster.assert.equals("function doIt() {}", buster.format.ascii(function doIt() {}));
        },

        "should format functions without name": function () {
            buster.assert.equals("function () {}", buster.format.ascii(function () {}));
        },

        "should format functions with display name": function () {
            function doIt() {}
            doIt.displayName = "ohHai";

            buster.assert.equals("function ohHai() {}", buster.format.ascii(doIt));
        },

        "should shorten functions with long bodies": function () {
            function doIt() {
                var i;
                function hey() {}
                for (; i < 10; i++) {
                }
            }

            buster.assert.equals("function doIt() {}", buster.format.ascii(doIt));
        },

        "should format functions with no name or display name": function () {
            function doIt() {}
            doIt.name = "";

            buster.assert.equals("function doIt() {}", buster.format.ascii(doIt));
        },

        "should format arrays": function () {
            function ohNo() { return "Oh yes!"; }

            var array = ["String", 123, /a-z/, null];

            var str = buster.format.ascii(array);
            buster.assert.equals('["String", 123, /a-z/, null]', str);

            str = buster.format.ascii([ohNo, array]);
            buster.assert.equals('[function ohNo() {}, ["String", 123, /a-z/, null]]', str);
        },

        "should not trip on circular arrays": function () {
            var array = ["String", 123, /a-z/];
            array.push(array);

            var str = buster.format.ascii(array);
            buster.assert.equals('["String", 123, /a-z/, [Circular]]', str);
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

            buster.assert.equals(expected, buster.format.ascii(object));
        },

        "should format short object on one line": function () {
            var object = {
                id: 42,
                hello: function () {},
                prop: "Some"
            };

            var expected = "{ hello: function () {}, id: 42, prop: \"Some\" }";
            buster.assert.equals(expected, buster.format.ascii(object));
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

            buster.assert.equals(expected, buster.format.ascii(object));
        },

        "should include constructor if known and not Object": function () {
            function Person(name) {
                this.name = name;
            }

            var person = new Person("Christian");

            buster.assert.equals("[Person] { name: \"Christian\" }", buster.format.ascii(person));
        },

        "should not include one letter constructors": function () {
            function F(name) {
                this.name = name;
            }

            var person = new F("Christian");

            buster.assert.equals("{ name: \"Christian\" }", buster.format.ascii(person));
        },

        "should include one letter constructors when configured to do so": function () {
            function C(name) {
                this.name = name;
            }

            var person = new C("Christian");
            var formatter = create(buster.format);
            formatter.excludeConstructors = [];

            buster.assert.equals("[C] { name: \"Christian\" }", formatter.ascii(person));
        },

        "should exclude constructors when configured to do so": function () {
            function Person(name) {
                this.name = name;
            }

            var person = new Person("Christian");
            var formatter = create(buster.format);
            formatter.excludeConstructors = ["Person"];

            buster.assert.equals("{ name: \"Christian\" }", formatter.ascii(person));
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

            buster.assert.equals("{ name: \"Christian\" }", formatter.ascii(person));
            buster.assert.equals("[Ninja] { name: \"Haruhachi\" }", formatter.ascii(ninja));
            buster.assert.equals("{ name: \"Mr. Garrison\" }", formatter.ascii(pervert));
        },

        "should not trip on circular formatting": function () {
            var object = {};
            object.foo = object;

            buster.assert.equals("{ foo: [Circular] }", buster.format.ascii(object));
        },

        "should not trip on indirect circular formatting": function () {
            var object = { someProp: {} };
            object.someProp.foo = object;

            buster.assert.equals("{ someProp: { foo: [Circular] } }", buster.format.ascii(object));
        },

        "should format nested array nicely": function () {
            var object = { people: ["Chris", "August"] };

            buster.assert.equals("{ people: [\"Chris\", \"August\"] }",
                         buster.format.ascii(object));
        }
    });

    if (typeof document != "undefined") {
        testCase("AsciiFormatDOMElementTest", {
            "should format dom element": function () {
                var element = document.createElement("div");

                buster.assert.equals("<div></div>", buster.format.ascii(element));
            },

            "should format dom element with attributes": function () {
                var element = document.createElement("div");
                element.className = "hey there";
                element.id = "ohyeah";
                var str = buster.format.ascii(element);

                buster.assert(/<div (.*)><\/div>/.test(str));
                buster.assert(/class="hey there"/.test(str));
                buster.assert(/id="ohyeah"/.test(str));
            },

            "should format dom element with content": function () {
                var element = document.createElement("div");
                element.innerHTML = "Oh hi!";

                buster.assert.equals("<div>Oh hi!</div>",
                             buster.format.ascii(element));
            },

            "should truncate dom element content": function () {
                var element = document.createElement("div");
                element.innerHTML = "Oh hi! I'm Christian, and this is a lot of content";

                buster.assert.equals("<div>Oh hi! I'm Christian[...]</div>",
                             buster.format.ascii(element));
            },

            "should include attributes and truncated content": function () {
                var element = document.createElement("div");
                element.id = "anid";
                element.lang = "en"
                element.innerHTML = "Oh hi! I'm Christian, and this is a lot of content";
                var str = buster.format.ascii(element);

                buster.assert(/<div (.*)>Oh hi! I'm Christian\[\.\.\.\]<\/div>/.test(str));
                buster.assert(/lang="en"/.test(str));
                buster.assert(/id="anid"/.test(str));
            }
        });
    }
}());