function SchemaBody (bodyRaw, typeArgs) {
    this.bodyRaw = bodyRaw;
    this.typeArgs = typeArgs;
}

function RecordBody (bodyRaw, typeArgs) {
    this.bodyRaw = bodyRaw;
    this.typeArgs = typeArgs;
}

function BuiltinType (type, typeArgs) {
    this.type = type;
    this.typeArgs = typeArgs;
}

// builtins
function Repeated () {
    return new BuiltinType ("Repeated", arguments);
}

function Optional () {
    return new BuiltinType ("Optional", arguments);
}

function Map () {
    return new BuiltinType ("Map", arguments);
}

function schema (schemaBody) {
    return function () {
	    return new SchemaBody (schemaBody, arguments);
    };
}

function record (recordBody) {
    return function () {
	    return new RecordBody (recordBody, arguments);
    };
}


function DummyType (id) {
    this.id = id;
}

// TODO undefined/null checks
// types not bound
// e.g. validSchema (BinTree)
function validSchema (sch) {
    var bodyC = sch ().bodyRaw;
    var arity = bodyC.length;

    // make dummy type arguments
    var dummyTypes = [];
    for (var i = 0; i < arity; i++) {
	    dummyTypes[i] = new DummyType (i);
    }

    // create a schema instance with the dummies
    var body = {};
    bodyC.prototype.constructor.apply (body, dummyTypes);

    // for each constructor
    for (var constr in body) {

	    try {
	        checkStrict (body[constr]);
	    } catch (e) {
	        if (!(typeof e === "object")) throw e;
	        // not a simple type, is it a record?
	        for (var field in body[constr]) {
		        checkStrict (body[constr][field]);
	        }
	    }
    }

    return body;
}

function createRecord (recordBody) {
    return recordBody.bodyRaw.apply ({}, recordBody.typeArgs);
}

function createSchema (schemaBody) {
    var ret = {};
    schemaBody.bodyRaw.prototype.constructor.apply (ret, schemaBody.typeArgs);

    return ret;
}

// checks schema validity, allows additional fields to be present in the object
function check (schema, object) {
    throw TODO ("check");
    for (var constr in schema) {
	    
    }
}

function isUndefinedNull (obj) {
    return (obj === undefined || obj === null);
}

// also checks that only the fields specified in the schema are present in the object
// isUndefinedNull (object) checks should alawys occur except for Optional
function checkStrict (ty, object) {

    switch (typeof ty) {

    case "string":
	    switch (ty) {

	    case "number":
	    case "string":
	    case "boolean":
	    case "object":
	        if (isUndefinedNull (object)) throw UndefinedNullValue ();
	        break;
	    default:
	        throw InvalidType (ty);
	    }
	    if (typeof object !== ty) throw TypeMismatch (ty, typeof object);
	    break;

	    // DEBUG is this desirable?
	    // Type treated as Type()
    case "function":
	    ty = ty ();
	    // no break!

    case "object":

	    // is it a primitive (Optional, Repeated)?
	    if (ty instanceof BuiltinType) {
	        switch (ty.type) {
	        case "Optional":

		        if (ty.typeArgs.length !== 1) throw ArityMismatch (1);

		        // don't have to check anything if undefined or null
		        if (isUndefinedNull (object)) break;

		        checkStrict (ty.typeArgs[0], object);
		        break;

	        case "Repeated":
		        if (isUndefinedNull (object)) throw UndefinedNullValue ();

		        if (ty.typeArgs.length !== 1) throw ArityMismatch (1);
		        if (object.__proto__ !== [].__proto__)
		            throw Expected ("Array");

		        for (var i = 0; i < object.length; i++) {

		            checkStrict (ty.typeArgs[0], object[i]);
		        }

		        break;

            case "Map":
                if (isUndefinedNull (object)) throw UndefinedNullValue ();

                if (ty.typeArgs.length !== 1) throw ArityMismatch (1);
                if (typeof object !== "object") throw TypeMismatch ("object", typeof object);

                for (var key in object) {
                    checkStrict (ty.typeArgs[0], object[key]);
                }

                break;

	        default:

		        throw Internal ("Unhandled built-in type: '" + type + "'");
	        }

	        break;
	    }

	    // at this point we know that object must be of type "object" and cannot be null
	    if (isUndefinedNull (object)) throw UndefinedNullValue ();
	    if (typeof object !== "object") throw TypeMismatch ("object", typeof object);

	    // is it a record?
	    if (ty instanceof RecordBody) {
	        // check arity
	        if (ty.bodyRaw.length !== ty.typeArgs.length) {
		        throw ArityMismatch (ty.bodyRaw.length);
	        }

	        var record = createRecord (ty);

	        checkStrict (record, object);

	        break;
	    }

	    // is it a schema?
	    if (ty instanceof SchemaBody) {
	        // check arity
	        if (ty.bodyRaw.length !== ty.typeArgs.length) {
		        throw ArityMismatch (ty.bodyRaw.length);
	        }

	        // create schema
	        var schema = createSchema (ty);
	        
	        if (isUndefinedNull (object.constr)) throw UndefinedNull ("constr");
	        
	        var validConstrs = Object.keys (schema);
	        if (isUndefinedNull (schema[object.constr])) throw InvalidConstrField (object.constr, validConstrs);
	        if (isUndefinedNull (object[object.constr])) throw UndefinedNull (object.constr);

	        // .constr + [constr]
	        var gotFields = Object.keys (object);
	        if (gotFields.length !== 2) throw ExpectedFields (["constr", object.constr], gotFields);

	        checkStrict (schema[object.constr], object[object.constr]);

	        break;
	    }

	    // TODO no tuples for now
	    // // is it a tuple?
	    // if (ty.__proto__ == [].__proto__) {
	    //     throw TODO ("checkStrict::Array");
	    // }

	    // must be a simple object then
		
	    var expFields = Object.keys (ty);
	    var gotFields = Object.keys (object);

	    if (expFields.length !== gotFields.length) throw ExpectedFields (expFields, gotFields);

	    for (var field in ty) {
	        if (isUndefinedNull (object[field])) throw UndefinedNull (field);
	        checkStrict (ty[field], object[field]);
	    }

	    break;

    case "undefined":
        
        var e = new Error ("[checkStrict] \"undefined\" type. Hint: recursive simple record?");
        e.errorId = "UndefinedType";
        throw e;

    default:

	    throw InvalidType (ty);
    }
}

var BinTree = schema (function (a) {
    this.Leaf = a;
    this.Branch = { leftBranch : BinTree (a),
		            rightBranch : BinTree (a)
		          };
});

var SimpleRecord = {
    hello : Map (Optional ("string"))
}

var List = schema (function (a) {
    this.Empty = {};
    this.Cons = { head : a,
		          tail : List (a)
		        };
});

var Maybe = schema (function (a) {
    this.Nothing = {};
    this.Just = { fromJust : a
		        };
});

var Either = schema (function (a, b) {
    this.Left = a;
    this.Right = b;
});

var Pair = record (function (a, b) {
    return { fst : a,
	         snd : b
	       };
});

function ArityMismatch (typeNum) {
    var e = new Error ("[" + arguments.callee.caller.name + "] Expecting " + typeNum + " arguments");
    e.errorId = "ArityMismatch";
    return e; 
}

function InvalidType (type) {
    var e = new Error ("[" + arguments.callee.caller.name + "] Invalid type: '" + type + "'");
    e.errorId = "InvalidType";
    return e; 
}

function TypeMismatch (typeExpected, typeGot) {
    var e = new Error ("[" + arguments.callee.caller.name +
		               "] Type mismatch: expected '" + typeExpected +
		               "', got '" + typeGot + "'");
    e.errorId = "TypeMismatch";
    return e; 
}

function TODO (what) {
    var e = new Error ("[" + arguments.callee.caller.name + "] TODO: " + what);
    e.errorId = "TODO";
    return e; 
}

function UndefinedNull (field) {
    var e = new Error ("[" + arguments.callee.caller.name + "] '" + field + "' field is undefined/null");
    e.errorId = "UndefinedNull";
    return e; 
}

function UndefinedNullValue () {
    var e = new Error ("[checkStrict] Undefined/null value");
    e.errorId = "UndefinedNullValue";
    return e;
}

function InvalidConstrField (constr, validConstrs) {
    var e = new Error ("[checkStrict] Invalid constr field '" + constr +
		               "', expected one of " + validConstrs);
    e.errorId = "InvalidConstrField";
    return e;
}

function Expected (expected) {
    var e = new Error ("[" + arguments.callee.caller.name + "] '" + expected + "' expected");
    e.errorId = "Expected";
    return e; 
}

function ExpectedFields (expFields, gotFields) {
    var e = new Error ("Expected fields: (" + expFields + "), got (" + gotFields + ")");
    e.errorId = "ExpectedFields";
    return e;
}

function Internal (what) {
    var e = new Error ("[" + arguments.callee.caller.name + "] INTERNAL: " + what);
    e.errorId = "Internal";
    return e; 
}

