var Simple = {
    someField : "number",
    otherField : "string"
};
var Tuple = record (function (a, b) {
    return {
        fst : a,
        snd : b
    };
});
var Rec = record (function () {
    return {
        hey : Optional (Rec)
    };
});
var ListNumbers = schema (function () {
    this.Nil = {};
    this.Cons = {
        head : "int",
        tail : ListNumbers(),
        simple : Simple
    };
});
