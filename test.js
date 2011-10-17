jsschema = require('./jsschema.js');

schema = jsschema.schema;
required = jsschema.required;
optional = jsschema.optional;
repeated = jsschema.repeated;


throwsLogged = function(test, block) {
	try {
		block();
	} catch (e) {
		console.log("  - " + e);
		test.throws(block);
	}
}


valid_schema_fn = function (test, schema) {
	return function(valid_expected_object) {
		test.ok(jsschema.check(schema, valid_expected_object));
		test.strictEqual(jsschema.valid(schema, valid_expected_object), true);
	};
};

invalid_schema_fn = function (test, schema) {
	return function(invalid_expected_object) {
		throwsLogged(test, function() { jsschema.check(schema, invalid_expected_object); });
		test.strictEqual(jsschema.valid(schema, invalid_expected_object), false);
	};
};


student = schema(function() {
	this.name = required("string");
	this.age = required("number");

	this.parent = optional(this);

	this.goodBirthdays = repeated("number");
	this.friends = repeated(this);
});

peter = {
	name: "Peter",
	age: 14,
	parent: null,
	goodBirthdays: [],
	friends: []
};

john = {
	name: "John",
	parent: null,
	goodBirthdays: [],
	friends: []
};

jack = {
	name: "Jack",
	age: "10",
	parent: null,
	goodBirthdays: [],
	friends: []
};

jim = {
	name: "Jim",
	age: 10,
	parent: null,
	goodBirthdays: [],
	friends: [{ name: "Joseph" }]
};

jake = {
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


teacher = schema(function() {
	this.fav = optional(student);
	this.affair = optional(this);
});

mrGarrison = {
	fav: peter
}

someOtherTeacher = {
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

CSmrGarrison = {
	fav: peter
}

CSsomeOtherTeacher = {
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


arbitraryDataContainer = schema(function() {
	this.name = required("string");
	this.data = jsschema.ANY;
});

arbitraryDataContainerUndefined = {
	name: "arbitraryDataContainerUndefined",
	data: undefined
}

arbitraryDataContainerNull = {
	name: "arbitraryDataContainerNull",
	data: null
}

arbitraryDataContainerEmptyObject = {
	name: "arbitraryDataContainerEmptyObject",
	data: {}
}

arbitraryDataContainerTeacherObject = {
	name: "arbitraryDataContainerTeacherObject",
	data: mrGarrison
}

exports['jsschema.ANY allows any value'] = function(test) {

	expect_valid = valid_schema_fn(test, arbitraryDataContainer);

	expect_valid(arbitraryDataContainerUndefined);
	expect_valid(arbitraryDataContainerNull);
	expect_valid(arbitraryDataContainerEmptyObject);
	expect_valid(arbitraryDataContainerTeacherObject);

	test.done();
};


notUndefinedDataContainer = schema(function() {
	this.name = required("string");
	this.data = jsschema.ANY_NOT_UNDEFINED;
});

exports['jsschema.ANY_NOT_UNDEFINED allows any but undefined values'] = function(test) {

	expect_valid = valid_schema_fn(test, notUndefinedDataContainer);
	expect_invalid = invalid_schema_fn(test, notUndefinedDataContainer);

	expect_invalid(arbitraryDataContainerUndefined);
	expect_valid(arbitraryDataContainerNull);
	expect_valid(arbitraryDataContainerEmptyObject);
	expect_valid(arbitraryDataContainerTeacherObject);

	test.done();
};


notNullDataContainer = schema(function() {
	this.name = required("string");
	this.data = jsschema.ANY_NOT_NULL;
});

exports['jsschema.ANY_NOT_NULL allows any but undefined and null values'] = function(test) {

	expect_valid = valid_schema_fn(test, notNullDataContainer);
	expect_invalid = invalid_schema_fn(test, notNullDataContainer);

	expect_valid(arbitraryDataContainerEmptyObject);
	expect_valid(arbitraryDataContainerTeacherObject);
	expect_invalid(arbitraryDataContainerUndefined);
	expect_invalid(arbitraryDataContainerNull);

	test.done();
};
