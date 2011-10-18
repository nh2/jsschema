
SCHEMA_DEBUG = false;

schema_log = function() {
	if (SCHEMA_DEBUG) console.log.apply(this, arguments);
}


function required(type) {
	return {qualifier: "required", type: type};
}

function optional(type) {
	return {qualifier: "optional", type: type};
}

function repeated(type) {
	return {qualifier: "repeated", type: type};
}


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

ANY = new Object();
ANY_NOT_UNDEFINED = new Object();
ANY_NOT_NULL = new Object();


function isPrimitive(v) {
	return typeof v === "string";
}


function schema(schema_fn) {
	return valid_schema(new schema_fn());
}


// Uses duck-typing to note schemas as checked. Does NOT clean up the _schema_checked attributes on error or success. So don't call, change, call again!
function valid_schema(schema) {
	if (typeof schema !== "object") {
		var help = "";
		if (typeof schema == "function") help = " It is a function, did you forget to use new?"
		throw "schema '" + schema + "' is not an object." + help;
	}

	if (schema.__proto__['_schema_valid']) return schema;

	schema.__proto__['_schema_checking'] = true;

	for (var field in schema) {
		if (field.indexOf('_schema_') === 0) continue;

		// Handle the `ANY` schemas.
		if (schema[field] === ANY) continue;
		if (schema[field] === ANY_NOT_UNDEFINED) continue;
		if (schema[field] === ANY_NOT_NULL) continue;

		// check qualifier
		if (schema[field].qualifier != "required" &&
				schema[field].qualifier != "optional" &&
				schema[field].qualifier != "repeated")
			throw "Invalid qualifier '" + schema[field].qualifier + "'";

		// check type
		if (isPrimitive(schema[field].type)) {
			; // all right
		} else {
			// check recursively, but watch out for loops
			if (schema[field].type['_schema_checking']) {
				if (schema[field].qualifier == "required") {
					throw "required fields can not be used recursively (think about it, it makes sense)"
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


function valid(schema, object) {
	try {
		check(schema, object);
		return true;
	} catch (e) {
		return false;
	}
}


function primitiveTypeMismatchMsg(qualifier, field, value, expectedType) {
	return qualifier + " field '" + field + "' type mismatch: '" + value + "' (type '" + typeof value + "') is not of schema type '" + expectedType + "'";
}

function check(schema, object) {

	for (var field in schema) {

		if (field.indexOf('_schema_') === 0) continue;

		// The `ANY` schema accepts any object.
		if (schema[field] === ANY) continue;

		// The `ANY_NOT_UNDEFINED` accepts any object that is not undefined.
		if (schema[field] === ANY_NOT_UNDEFINED) {
			if (object[field] === undefined)
				throw "ANY_NOT_UNDEFINED field '" + field + "' of is " + object[field];
			continue;
		}

		// The `ANY_NOT_NULL` accepts any object that is neither undefined nor null.
		if (schema[field] === ANY_NOT_NULL) {
			if (object[field] === undefined || object[field] === null)
				throw "ANY_NOT_NULL field '" + field + "' of is " + object[field];
			continue;
		}

		switch (schema[field].qualifier) {

			case "required":
				if (object[field] === undefined || object[field] === null)
					throw "required field '" + field + "' is " + object[field];
				// check structure recursively
				if (isPrimitive(schema[field].type)) {
					// check primitive
					if (typeof object[field] !== schema[field].type)
						throw primitiveTypeMismatchMsg("required", field, object[field], schema[field].type);
				} else {
					try {
						check(schema[field].type, object[field]);
					} catch (e) {
						throw "required field '" + field + "' substructure mismatch: { " + e + " }"
					}
				}
				break;

			case "optional":
				if (object[field] === undefined || object[field] === null) {
					// it's optional and not there, all right, continue
				// it's optional and there
				} else if (isPrimitive(schema[field].type)) {
					// check primitive
					if (typeof object[field] !== schema[field].type)
						throw primitiveTypeMismatchMsg("optional", field, object[field], schema[field].type);
				} else {
					// check structure recursively
					try {
						check(schema[field].type, object[field]);
					} catch (e) {
						throw "optional field '" + field + "' substructure mismatch: { " + e + " }"
					}
				}
				break;

			case "repeated":
				// object check: only allow arrays
				if (object[field] === undefined || object[field] === null)
					throw "repeated field '" + field + "' is '" + object[field] + "'";
				if (object[field].__proto__ !== [].__proto__)
					throw "repeated field '" + field + "' is not an array: '" + object[field] + "'";

				// is it an array of primitives or objects?
				if (isPrimitive(schema[field].type)) {
					for (var index in object[field]) {
						// check if the array entry has that primitive type
						if (typeof object[field][index] !== schema[field].type)
							throw primitiveTypeMismatchMsg("repeated", field, object[field], schema[field].type);
					}
				} else {
					for (var index in object[field]) {
						// check recursively if the array entry hast that complex type
						try {
							check(schema[field].type, object[field][index]);
						} catch (e) {
							throw "repeated field '" + field + "' substructure mismatch: { " + e + " }"
						}
					}
				}
				break;

		}
		// if switch did not match: bad input (but this is checked by valid())
	}

	return object;
}

exports.schema = schema;
exports.required = required;
exports.optional = optional;
exports.repeated = repeated;
exports.check = check;
exports.valid = valid;
exports.ANY = ANY;
exports.ANY_NOT_UNDEFINED = ANY_NOT_UNDEFINED;
exports.ANY_NOT_NULL = ANY_NOT_NULL;


// TODO:
// test extends
