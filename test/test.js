jsschema = require('../jsschema.js');
require('./helpers.js');

var testSuite = require('./test-suite.js');

for (var testCase in testSuite) {
	exports[testCase] = testSuite[testCase];
}
