# Import schema declaration functions on top-level.
{schema, required, optional, repeated} = jsschema

# `helpers.js` must be included by the by the test executing the suite.
{throwsLogged, valid_schema_fn, invalid_schema_fn} = jsschema.test.helpers


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
