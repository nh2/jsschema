/* Copyright (c) 2011 Niklas Hambuechen and Andras Slemmer.
   MIT licensed. */

// *jsschema* is a simple way to specify the structure of JavaScript objects. It is inspired by Google [protobuffers](http://code.google.com/apis/protocolbuffers/).
//
// Its main use is allowing JavaScript and backend programmers to specify the structure of the data they are exchanging (e.g. via JSON).
//
// After having specified a schema, you can use it to find out if a given object matches its structure.
/* Times of malformed objects, begone! */

// A schema looks like this:
/*
student = schema(function() {
	this.name = required("string");
	this.age = optional("number");
	this.fiends = repeated(this);
});
*/

// You can validate objects on schemas with:
//
// - `valid` tells if the object matches the schema.
// - If the object matches the schema, `check` returns the object. Throws an error otherwise.
/* jsschema.valid (schema, object) */
/* jsschema.check (schema, object) */

// ## Example

// `klaus` is a valid student, because all his fields match the schema.
//
// `olaf` is not, because he lacks the `friends` field.
//
// `unknown` is not a student, because the `required` field `name` is null.
/*
klaus = {
	name: "Klaus Baudelaire",
	age: 15,
	friends: []
};

olaf = {
	name: "Count Olaf",
	age: 42
};

unknown = {
	name: null,
	age: null,
	friends: []
};

jsschema.valid (student, klaus)  // === true
jsschema.valid (student, olaf)  // === false
jsschema.valid (student, unknown)  // === false
*/

// ## API

// ### Qualifiers
// - `required`: the given type or schema must be present and not be `null` or `undefined`
// - `optional`: the given type or schema must either match or be `null` `undefined`
// - `repeated`: must be an array of given type or schema
//
// ### Matching arbitray objects
// If you want all objects to match, use
// - `optional("object")` to match any object
// - `required("object")` to match any object that is not `null` or `undefined`
/*
wrapper = schema(function() {
	this.typeName = required("string");
	this.content = required("object");
});

wrapperObject = {
	typeName: "custom js object",
	content: { a: 1, b: { x: "hello" } }
};

jsschema.valid (wrapper, wrapperObject)  // === true
*/


// ## Schemas in CoffeeScript
// If you use coffee-script, schemas can be declared in an even more elegant way:
/*
student = schema ->
	@name    = required "string"
	@age     = optional "number"
	@friends = repeated this
	return
*/
// A caveat is that you need the `return` because otherwise CoffeeScript returns the last value (`@friends` in this example). See the `schema class` below for the best way.

// In both CoffeeScript and JavaScript, you can refer to other schemas.
//
// You can also create recursive schemas (e.g. a teacher having a teacher as affair) by using `this`.
/*
teacher = schema ->
	@pupils = repeated student
	@affair = optional this
	return
*/
// CoffeeScripts class syntax does the same thing, but looks even nicer allows you to create recursive schemas by name instead of using `this`. It also needs no `return`. This is the best way to use *jsschema* with CoffeeScript.
//
// *(Note that although it is called `class`, CoffeeScript's class construct is neither evil nor magic: It compiles to a standard object, just with easier name access.)*
/*
schema class teacher
	@pupils = repeated student
	@affair = optional teacher
*/

// ## License
// *jsschema* is [MIT-Licensed](http://www.opensource.org/licenses/mit-license.php).

// ## Source Code

(function(exports) {

	// Turn debugging on/off.
	SCHEMA_DEBUG = false;

	// Custom log function.
	schema_log = function() {
		if (SCHEMA_DEBUG) console.log.apply(this, arguments);
	}

    // a schema field
    function schemaField (q, ty) {
	this.qualifier = q;
	this.type = ty;
    }

    function checkField (field, object, fieldName) {

	    fieldName = typeof fieldName !== 'undefined' ? fieldName : "?";


	    // Handle the different qualifiers.
	    switch (field.qualifier) {

	    case "required":
		if (object === undefined || object === null)
		    throw new Error("required fieldName '" + fieldName + "' is " + object);
		if (isPrimitive(field.type)) {
		    // Check primitive fieldName's type.
		    if (typeof object !== field.type)
			throw primitiveTypeMismatchError("required", fieldName, object, field.type);
		} else {
		    // Schema fieldName: check structure recursively.
		    try {
			check(field.type, object);
		    } catch (e) {
			throw new Error("required fieldName '" + fieldName + "' substructure mismatch: { " + e + " }");
		    }
		}
		break;

	    case "optional":
		if (object === undefined || object === null) {
		    // FieldName is is optional and not present, all right, continue.
		    ;  // Nothing to do.
		    // FieldName is optional and present.
		} else if (isPrimitive(field.type)) {
		    // Check primitive fieldName's type.
		    if (typeof object !== field.type)
			throw primitiveTypeMismatchError("optional", fieldName, object, field.type);
		} else {
		    // Schema fieldName: check structure recursively.
		    try {
			check(field.type, object);
		    } catch (e) {
			throw new Error("optional fieldName '" + fieldName + "' substructure mismatch: { " + e + " }");
		    }
		}
		break;

	    case "repeated":
		// Object check: only allow arrays.
		if (object === undefined || object === null)
		    throw new Error("repeated fieldName '" + fieldName + "' is '" + object + "'");
		if (object.__proto__ !== [].__proto__)
		    throw new Error("repeated fieldName '" + fieldName + "' is not an array: '" + object + "'");

		// Is it an array of primitives or objects?
		if (isPrimitive(field.type)) {
		    for (var index in object) {
			// Check if the array entry has that primitive type
			if (typeof object[index] !== field.type)
			    throw primitiveTypeMismatchError("repeated", fieldName, object, field.type);
		    }
		} else {
		    for (var index in object) {
			// Repeated schema fieldName: check recursively if the array entry matches the subschema
			try {
			    check(field.type, object[index]);
			} catch (e) {
			    throw new Error("repeated fieldName '" + fieldName + "' substructure mismatch: { " + e + " }");
			}
		    }
		}
		break;

	    default:
		// If switch did not match, we got a bad input (but field impossible due to the `valid_schema()` check).
		throw new Error("jsschema: Illegal state: No qualifier matched");

	    }
	}

    // Qualifiers
    function required(type) {
	var ret = new schemaField ("required", type);
	return ret;
	
    }

    function optional(type) {
	return new schemaField ("optional", type);
    }

    function repeated(type) {
	return new schemaField ("repeated", type);
    }

	// Some examples of what the different qualifiers should match.
	/*
	required:
		"adsf" -> OK
		"" -> OK
		null -> BAD
		undefined -> BAD

	optional:
		"adsf" -> OK
		"" -> OK
		null -> OK
		undefined -> OK

	repeated:
		"adsf" -> BAD
		"" -> BAD
		null -> BAD
		undefined -> BAD
		[1,2,3] -> OK
		[] -> OK
	*/

    function isPrimitive(v) {
	return typeof v === "string";
    }

    // Schema creation function. Returns the schema if valid. Throws an error if the schema is malformed.
    function schema(schema_fn) {
	return valid_schema(new schema_fn());
    }


	// Returns the schema if valid. Throws an error otherwise.
	//
	// Uses duck-typing to note schemas as checked. Does **NOT** clean up the `_schema_checked` attributes on error or success. So don't call it, change the schema object, and call again!
	function valid_schema(schema) {
		if (typeof schema !== "object") {
			var help = "";
			if (typeof schema == "function") help = " It is a function, did you forget to use new?"
			throw new Error("schema '" + schema + "' is not an object." + help);
		}

		if (schema.__proto__['_schema_valid']) return schema;

		schema.__proto__['_schema_checking'] = true;

		for (var field in schema) {
			if (field.indexOf('_schema_') === 0) continue;

			// Make sure a qualifier is set.
			if (schema[field].qualifier != "required" &&
					schema[field].qualifier != "optional" &&
					schema[field].qualifier != "repeated")
				throw new Error("Invalid qualifier '" + schema[field].qualifier + "' on field '" + field + "'");

			// Check the type of the field.

			if (isPrimitive(schema[field].type)) {
				// Primitive fields cannot go wrong.
				;  // Nothing to do.
			} else {
				// Fields that are schemas have to be recursively. We watch out for loops!
				if (schema[field].type['_schema_checking']) {
					if (schema[field].qualifier == "required") {
						throw new Error("required fields can not be used recursively (think about it, it makes sense)");
					}
					schema_log("loop detected, already checked");
				} else {
					valid_schema(schema[field].type);
				}
			}
		}

		schema.__proto__['_schema_checked'] = true;
		delete schema.__proto__['_schema_valid'];

		return schema;
	}


	// Returns `true` if the object matches the schema, `false` otherwise.
	function valid(schema, object) {
		try {
			check(schema, object);
			return true;
		} catch (e) {
			return false;
		}
	}


    function validField(field, object, fieldName) {
		try {
		    checkField(field, object, fieldName);
			return true;
		} catch (e) {
			return false;
		}
	}


	// Extracted common error messages.
	function primitiveTypeMismatchError(qualifier, field, value, expectedType) {
		return qualifier + " field '" + field + "' type mismatch: '" + value + "' (type '" + typeof value + "') is not of schema type '" + expectedType + "'";
	}

	// Returns the object if it matches the schema. Throws an error otherwise.
	function check(schema, object) {

		for (var field in schema) {

			// Skip fields we use internally.
			if (field.indexOf('_schema_') === 0) continue;

		    //console.log (schema[field]());

		    checkField (schema[field], object[field], field);
		}

		return object;
	}

	// Public API
	exports.schema = schema;
	exports.required = required;
	exports.optional = optional;
	exports.repeated = repeated;
	exports.check = check;
	exports.valid = valid;
    exports.checkField = checkField;
    exports.validField = validField;

})(typeof exports === 'undefined' ? (this['jsschema'] = {}) : exports);

// ## TODO:
// - test coffee-script's extends
