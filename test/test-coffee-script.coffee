jsschema = require "../jsschema.js"
require "./helpers.js"

coffeeTestSuite = require "./coffee-test-suite.coffee"

for testCase in coffeeTestSuite
	exports[testCase] = coffeeTestSuite[testCase]
