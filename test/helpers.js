// Make sure that `jsschema.test.helpers` contains these helpers.
helpers = {};
jsschema.test = {};
jsschema.test.helpers = helpers;
// In CommonJS, also just export them.
if (this.exports) exports.helpers = helpers;


helpers.throwsLogged = function(test, block) {
	try {
		block();
	} catch (e) {
		console.log("  + " + e);
		test.throws(block);
	}
};


helpers.valid_schema_fn = function (test, schema) {
	return function(valid_expected_object) {
		test.ok(jsschema.check(schema, valid_expected_object));
		test.strictEqual(jsschema.valid(schema, valid_expected_object), true);
	};
};


helpers.invalid_schema_fn = function (test, schema) {
	return function(invalid_expected_object) {
		helpers.throwsLogged(test, function() { jsschema.check(schema, invalid_expected_object); });
		test.strictEqual(jsschema.valid(schema, invalid_expected_object), false);
	};
};
