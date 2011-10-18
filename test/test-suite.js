(function(exports) {

	var schema = jsschema.schema;
	var required = jsschema.required;
	var optional = jsschema.optional;
	var repeated = jsschema.repeated;

	// `helpers.js` must be included by the by the test executing the suite.
	var helpers = jsschema.test.helpers;

	var throwsLogged = helpers.throwsLogged;
	var valid_schema_fn = helpers.valid_schema_fn;
	var invalid_schema_fn = helpers.invalid_schema_fn;

	var student = schema(function() {
		this.name = required("string");
		this.age = required("number");

		this.parent = optional(this);

		this.goodBirthdays = repeated("number");
		this.friends = repeated(this);
	});

	var peter = {
		name: "Peter",
		age: 14,
		parent: null,
		goodBirthdays: [],
		friends: []
	};

	var john = {
		name: "John",
		parent: null,
		goodBirthdays: [],
		friends: []
	};

	var jack = {
		name: "Jack",
		age: "10",
		parent: null,
		goodBirthdays: [],
		friends: []
	};

	var jim = {
		name: "Jim",
		age: 10,
		parent: null,
		goodBirthdays: [],
		friends: [{ name: "Joseph" }]
	};

	var jake = {
		name: "Jim",
		age: 10,
		parent: null,
		goodBirthdays: [],
		friends: {}
	};


	exports['normal case'] = function(test) {
		expect_valid = valid_schema_fn(test, student);
		expect_valid(peter);
		test.done();
	};

	exports['field missing: age'] = function(test) {
		expect_invalid = invalid_schema_fn(test, student);
		expect_invalid(john);
		test.done();
	};

	exports['wrong type: age'] = function(test) {
		expect_invalid = invalid_schema_fn(test, student);
		expect_invalid(jack);
		test.done();
	};

	exports['repeated field has entry with wrong structure: friends'] = function(test) {
		expect_invalid = invalid_schema_fn(test, student);
		expect_invalid(jake);
		test.done();
	};

	exports['repeated field is not an array: friends'] = function(test) {
		expect_invalid = invalid_schema_fn(test, student);
		expect_invalid(jim);
		test.done();
	};

	exports['non-objects never match a schema'] = function(test) {
		expect_invalid = invalid_schema_fn(test, student);
		expect_invalid("asdf");
		expect_invalid(1);
		expect_invalid(1.2);
		test.done();
	};


	var teacher = schema(function() {
		this.fav = optional(student);
		this.affair = optional(this);
	});

	var mrGarrison = {
		fav: peter
	}

	var someOtherTeacher = {
		fav: peter,
		affair: mrGarrison
	}

	exports['recursive type optional field not set'] = function(test) {
		expect_valid = valid_schema_fn(test, teacher);
		expect_valid(mrGarrison);
		test.done();
	};

	exports['recursive type optional field set'] = function(test) {
		expect_valid = valid_schema_fn(test, teacher);
		expect_valid(someOtherTeacher);
		test.done();
	};


	// generated by coffee-script's "class"
	schema(CSteacher = (function() {
		function CSteacher() {}
		CSteacher.fav = optional(student);
		CSteacher.affair = optional(CSteacher);
		return CSteacher;
	})());

	var CSmrGarrison = {
		fav: peter
	}

	var CSsomeOtherTeacher = {
		fav: peter,
		affair: mrGarrison
	}

	exports['(coffe-script class generated) recursive type optional field not set'] = function(test) {
		expect_valid = valid_schema_fn(test, CSteacher);
		expect_valid(CSmrGarrison);
		test.done();
	};

	exports['(coffe-script class generated) recursive type optional field set'] = function(test) {
		expect_valid = valid_schema_fn(test, CSteacher);
		expect_valid(CSsomeOtherTeacher);
		test.done();
	};


	exports['recursive required fields are forbidden'] = function(test) {
		throwsLogged(test, function() {
			requiredRecursiveSchema = schema(function() {
				this.other = required(this);
			});
		});
		test.done();
	};


	var arbitraryDataContainer = schema(function() {
		this.name = required("string");
		this.data = optional("object");
	});

	var arbitraryDataContainerUndefined = {
		name: "arbitraryDataContainerUndefined",
		data: undefined
	}

	var arbitraryDataContainerNull = {
		name: "arbitraryDataContainerNull",
		data: null
	}

	var arbitraryDataContainerEmptyObject = {
		name: "arbitraryDataContainerEmptyObject",
		data: {}
	}

	var arbitraryDataContainerTeacherObject = {
		name: "arbitraryDataContainerTeacherObject",
		data: mrGarrison
	}

	exports['optional("object") allows any value'] = function(test) {

		expect_valid = valid_schema_fn(test, arbitraryDataContainer);

		expect_valid(arbitraryDataContainerUndefined);
		expect_valid(arbitraryDataContainerNull);
		expect_valid(arbitraryDataContainerEmptyObject);
		expect_valid(arbitraryDataContainerTeacherObject);

		test.done();
	};


	var notNullDataContainer = schema(function() {
		this.name = required("string");
		this.data = required("object");
	});

	exports['required("object") allows any but undefined and null values'] = function(test) {

		expect_valid = valid_schema_fn(test, notNullDataContainer);
		expect_invalid = invalid_schema_fn(test, notNullDataContainer);

		expect_valid(arbitraryDataContainerEmptyObject);
		expect_valid(arbitraryDataContainerTeacherObject);
		expect_invalid(arbitraryDataContainerUndefined);
		expect_invalid(arbitraryDataContainerNull);

		test.done();
	};

})(typeof exports === 'undefined' ? (jsschema.tests = {}) : exports);
