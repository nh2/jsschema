fs = require 'fs'
path = require 'path'
{print} = require 'sys'
{spawn, exec} = require 'child_process'

SRC_DIR = '.'

build = (watch, callback) ->
	if typeof watch is 'function'
		callback = watch
		watch = false

	options = ['-c', '-o', 'lib', SRC_DIR]
	options.unshift '-w' if watch

	coffee = spawn 'coffee', options
	coffee.stdout.on 'data', (data) -> print data.toString()
	coffee.stderr.on 'data', (data) -> print data.toString()
	coffee.on 'exit', (status) -> callback?() if status is 0

task 'docs', 'Generate annotated source code with Docco', ->
	if not path.existsSync SRC_DIR
		console.error "directory #{SRC_DIR}/ not found"
		process.exit 1
	fs.readdir SRC_DIR, (err, contents) ->
		files = ("#{SRC_DIR}/#{file}" for file in contents when /\.(coffee|js)$/.test file)
		docco = spawn 'docco', files
		docco.stdout.on 'data', (data) -> print data.toString()
		docco.stderr.on 'data', (data) -> print data.toString()
		docco.on 'exit', (status) -> callback?() if status is 0

task 'build', 'Compile CoffeeScript source files', ->
	build()

task 'watch', 'Recompile CoffeeScript source files when modified', ->
	build true

task 'test', 'Run the test suite', ->
	build ->
		require.paths.unshift __dirname + "/lib"
		reporter = require('nodeunit').reporters.default
		process.chdir __dirname
		reporter.run ['test/test.js', 'test/test-coffee-script.coffee']


