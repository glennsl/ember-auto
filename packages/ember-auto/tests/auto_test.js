module("auto properties");

var get = Ember.get;


test("get dependent keys from the function unless provided explicitly", function() {
  expect(3);

  var p1 = Ember.auto(function () {});
  var p2 = Ember.auto(function (a, b, c) {});
  var p3 = Ember.auto("X", "Y", function (a, b, c) {});

  deepEqual(p1._dependentKeys, undefined);
  deepEqual(p2._dependentKeys, ["a", "b", "c"]);
  deepEqual(p3._dependentKeys, ["X", "Y"]);
});

test("the dependent key properties are injected into the function", function() {
  expect(2);

  var Person = Ember.Object.extend({
    full: Ember.auto(function(first, last) {
      return first + " " + last;
    })
  });

  var obj = Person.create({first: "Arthur", last: "Gunn"});
  equal(get(obj, "full"), "Arthur Gunn", "properties are injected as arguments");

  obj.set("first", "Attila the");
  equal(get(obj, "full"), "Attila the Gunn", "changed properties are injected as arguments");
});

test("arguments can be rearranged, skipped", function () {
  var Numbers, nums;
  expect(4);

  Numbers = Ember.Object.extend({
    a: 1, b: 2, c: 3, d: 4,

    list1: Ember.auto(function (a, b, c, d) {
      return [].slice.call(arguments);
    }),
    list2: Ember.auto(function (a, b) {
      return [].slice.call(arguments);
    }),
    list3: Ember.auto(function (c, d, b) {
      return [].slice.call(arguments);
    }),
    list4: Ember.auto(function () {
      return [].slice.call(arguments);
    })
  });
  nums = Numbers.create();

  deepEqual(get(nums, "list1"), [1, 2, 3, 4]);
  deepEqual(get(nums, "list2"), [1, 2], "works with fewer arguments");
  deepEqual(get(nums, "list3"), [3, 4, 2], "works with any order of arguments");
  deepEqual(get(nums, "list4"), [], "works with no arguments");
});

test("if dependent keys are specified, only their properties will be injected", function () {
  expect(3);

  var list = function (a, b, c, d) {
    return [].slice.call(arguments);
  };

  var nums = Ember.Object.extend({
    a: 1, b: 2, c: 3, d: 4,

    list1: Ember.auto("a", "b", "c", "d", list),
    list2: Ember.auto("a", "b", list),
    list3: Ember.auto("c", "d", "b", list)
  }).create();

  deepEqual(get(nums, "list1"), [1, 2, 3, 4]);
  deepEqual(get(nums, "list2"), [1, 2, undefined, undefined], "arguments that don't map to dependent keys are injected as undefined");
  deepEqual(get(nums, "list3"), [undefined, 2, 3, 4], "works with any order of dependent keys");
});

test("dependent keys can point to other properties", function () {
  expect(2);

  var nums = Ember.Object.extend({
    a: 1, b: 2, c: 3, d: 4,

    ab: Ember.computed("a", "b", function() {
      return [this.get("a"), this.get("b")];
    }),
    cd: Ember.auto("c", "d", function(c, d) {
      return [c, d];
    }),

    list1: Ember.auto("ab", "cd", function(ab, cd) {
      return ab.concat(cd);
    }),
    list2: Ember.auto("ab", "c", "d", function(ab, c, d) {
      return ab.concat(c, d);
    })
  }).create();

  deepEqual(get(nums, "list1"), [1, 2, 3, 4], "computed and auto properties");
  deepEqual(get(nums, "list2"), [1, 2, 3, 4], "computed and regular properties");
});

test("dependent keys can point to property paths with multiple steps", function () {
  expect(3);

  window.App = Ember.Object.create({
    currentElement: "Li"
  });

  var obj = Ember.Object.extend({
    elements: {
      "H":  { name: "Hydrogen", number: 1},
      "He": { name: "Helium",   number: 2},
      "Li": { name: "Lithium",  number: 3}
    },

    currentElement: Ember.auto("App.currentElement", function(currentElement) {
      return currentElement;
    }),
    lithium: Ember.auto("elements.Li.name", "elements.Li.number", function(name, number) {
      return name + ": "+ number;
    }),
    currentName: Ember.auto("elements", "App.currentElement", function(elements, currentElement) {
      return elements[currentElement].name;
    })
  }).create();

  deepEqual(get(obj, "currentElement"), "Li", "absolute paths");
  deepEqual(get(obj, "lithium"), "Lithium: 3", "long paths");
  deepEqual(get(obj, "currentName"), "Lithium", "mixed");
});

test("dependent keys can point to property paths with multiple steps", function () {
  expect(2);
  var obj = Ember.Object.extend({
    accounts: [
      { amount: 88 },
      { amount: 2600 },
      { amount: -3.141 },
      { amount: 2.013e3 },
    ],

    total1: Ember.auto("accounts.@each.amount", function(accounts) {
      return accounts.reduce(function(total, account) {
        return total + account.amount;
      }, 0);
    }),
    total2: Ember.auto("accounts.[]", function(accounts) {
      return accounts.reduce(function(total, account) {
        return total + account.amount;
      }, 0);
    })
  }).create();

  equal(get(obj, "total1"), 4697.859, ".@each");
  equal(get(obj, "total2"), 4697.859, ".[]");
});

