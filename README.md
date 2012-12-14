jsschema
========

[jsschema](https://github.com/nh2/jsschema/) is a simple way to specify the structure of JavaScript objects.

It is inspired by [protobuffers](http://code.google.com/apis/protocolbuffers/) and allows JavaScript and backend programmers to specify the structure of the data they are exchanging (e.g. via JSON).

After writing a schema, you can use it to find out if a given object matches its structure.

Times of malformed objects, begone!


Schemas
-------

A schema looks like this:

```javascript
student = schema(function() {
    this.name = required("string");
    this.age = optional("number");
    this.fiends = repeated(this);
});
```

You can validate objects on schemas with:

- `valid` tells if the object matches the schema.
- If the object matches the schema, `check` returns the object. Throws an error otherwise.

```javascript
jsschema.valid(schema, object)
jsschema.check(schema, object)
```


Example
-------

- `klaus` is a valid student, because all his fields match the schema.
- `olaf` is not, because he lacks the `friends` field.
- `unknown` is not a student, because the `required` field `name` is null.

```javascript
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

jsschema.valid(student, klaus)   // === true
jsschema.valid(student, olaf)    // === false
jsschema.valid(student, unknown) // === false
```


API
---

### Qualifiers
- `required`: the given type or schema must be present and not be `null` or `undefined`
- `optional`: the given type or schema must either match or be `null` `undefined`
- `repeated`: must be an array of given type or schema

### Matching arbitray objects
If you want all objects to match, use
- `optional("object")` to match any object
- `required("object")` to match any object that is not `null` or `undefined`

```javascript
wrapper = schema(function() {
    this.typeName = required("string");
    this.content = required("object");
});

wrapperObject = {
    typeName: "custom js object",
    content: { a: 1, b: { x: "hello" } }
};

jsschema.valid(wrapper, wrapperObject) // === true
```


Schemas in CoffeeScript
-----------------------

If you use coffee-script, schemas can be declared in an even more elegant way:

```coffee-script
student = schema ->
    @name = required "string"
    @age = optional "number"
    @friends = repeated this
    return
```

A caveat is that you need the `return` because otherwise CoffeeScript returns the last value (`@friends` in this example). See the `schema class` below for the best way.

In both CoffeeScript and JavaScript, you can refer to other schemas.

You can also create recursive schemas (e.g. a teacher having a teacher as affair) by using `this`.

```coffee-script
teacher = schema ->
    @pupils = repeated student
    @affair = optional this
    return
```

CoffeeScripts class syntax does the same thing, but looks even nicer allows you to create recursive schemas by name instead of using `this`. It also needs no `return`. This is the best way to use *jsschema* with CoffeeScript.

(Note that although it is called `class`, CoffeeScript's class construct is neither evil nor magic: It compiles to a standard object, just with easier name access.)*

```coffee-script
schema class teacher
    @pupils = repeated student
    @affair = optional teacher
```


FAQ
---

* Can jsschema check polymorphic structures?

Almost, we are working on that! (Polymorphic structures are things like things like [a] - a list of things where the list elements must have the same type/structure, but you don't actually have to say which one.)


License
-------

*jsschema* is [MIT-Licensed](http://www.opensource.org/licenses/mit-license.php).
