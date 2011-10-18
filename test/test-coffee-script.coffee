jsschema = require "../jsschema.js"

schema = jsschema.schema
required = jsschema.required
optional = jsschema.optional
repeated = jsschema.repeated


throwsLogged = (test, block) ->
  try
    block()
  catch e
    console.log "  - " + e
    test.throws block

valid_schema_fn = (test, schema) ->
  (valid_expected_object) ->
    test.ok jsschema.check(schema, valid_expected_object)
    test.strictEqual jsschema.valid(schema, valid_expected_object), true

invalid_schema_fn = (test, schema) ->
  (invalid_expected_object) ->
    throwsLogged test, ->
      jsschema.check schema, invalid_expected_object
    
    test.strictEqual jsschema.valid(schema, invalid_expected_object), false



student = schema ->
  @name          = required "string"
  @age           = required "number"
  @parent        = optional this
  @goodBirthdays = repeated "number"
  @friends       = repeated this
  return


teacher = schema ->
  @fav    = optional student
  @affair = optional this
  return


schema class teacherClass
  @fav    = optional student
  @affair = optional teacher


peter = 
  name: "Peter"
  age: 14
  parent: null
  goodBirthdays: []
  friends: []

mrGarrison =
	fav: peter


exports["normal case"] = (test) ->
  expect_valid = valid_schema_fn(test, student)
  expect_valid peter
  test.done()

exports["recursive and referring to other schema"] = (test) ->
  expect_valid = valid_schema_fn(test, teacher)
  expect_valid mrGarrison
  test.done()

exports["schema class"] = (test) ->
  expect_valid = valid_schema_fn(test, teacherClass)
  expect_valid mrGarrison
  test.done()
