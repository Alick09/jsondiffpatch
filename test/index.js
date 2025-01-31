// import {DiffPatcher, lcs} from "ag-jsondiffpatch";
// import examples from "./examples/diffpatch.js";
const lib = require("../dist/index.js");
const examples = require("./examples/diffpatch.js");
const chai = require("chai");
const {DiffPatcher, lcs, clone} = lib;
const expect = chai.expect;


const isArray =
  typeof Array.isArray === "function"
      ? Array.isArray
      : a => typeof a === "object" && a instanceof Array;

const valueDescription = value => {
    if (value === null) {
        return "null";
    }
    if (typeof value === "boolean") {
        return value.toString();
    }
    if (value instanceof Date) {
        return "Date";
    }
    if (value instanceof RegExp) {
        return "RegExp";
    }
    if (isArray(value)) {
        return "array";
    }
    if (typeof value === "string") {
        if (value.length >= 60) {
            return "large text";
        }
    }
    return typeof value;
};

// Object.keys polyfill
const objectKeys =
  typeof Object.keys === "function"
      ? obj => Object.keys(obj)
      : obj => {
          const keys = [];
          for (const key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                  keys.push(key);
              }
          }
          return keys;
      };

// Array.prototype.forEach polyfill
const arrayForEach =
  typeof Array.prototype.forEach === "function"
      ? (array, fn) => array.forEach(fn)
      : (array, fn) => {
          for (let index = 0, length = array.length; index < length; index++) {
              fn(array[index], index, array);
          }
      };

describe("DiffPatcher", () => {
    arrayForEach(objectKeys(examples), groupName => {
        const group = examples[groupName];
        describe(groupName, () => {
            arrayForEach(group, example => {
                if (!example) {
                    return;
                }
                const name =
          example.name ||
          `${valueDescription(example.left)} -> ${valueDescription(
              example.right
          )}`;
                describe(name, () => {
                    before(function() {
                        this.instance = new DiffPatcher(example.options);
                    });
                    if (example.error) {
                        it(`diff should fail with: ${example.error}`, function() {
                            const instance = this.instance;
                            expect(() => {
                                instance.diff(example.left, example.right);
                            }).to.throw(example.error);
                        });
                        return;
                    }
                    
                    it("can diff", function() {
                        const delta = this.instance.diff(example.left, example.right);
                        expect(delta).to.deep.equal(example.delta);
                    });
                    it("can diff backwards", function() {
                        const reverse = this.instance.diff(example.right, example.left);
                        expect(reverse).to.deep.equal(example.reverse);
                    });
                    if (!example.noPatch) {
                        it("can patch", function() {
                            const right = this.instance.patch(
                                clone(example.left),
                                example.delta
                            );
                            expect(right).to.deep.equal(example.right);
                        });
                        it("can reverse delta", function() {
                            let reverse = this.instance.reverse(example.delta);
                            if (example.exactReverse !== false) {
                                expect(reverse).to.deep.equal(example.reverse);
                            } else {
                                // reversed delta and the swapped-diff delta are
                                // not always equal, to verify they're equivalent,
                                // patch and compare the results
                                expect(
                                    this.instance.patch(
                                        clone(example.right),
                                        reverse
                                    )
                                ).to.deep.equal(example.left);
                                reverse = this.instance.diff(example.right, example.left);
                                expect(
                                    this.instance.patch(
                                        clone(example.right),
                                        reverse
                                    )
                                ).to.deep.equal(example.left);
                            }
                        });
                        it("can unpatch", function() {
                            const left = this.instance.unpatch(
                                clone(example.right),
                                example.delta
                            );
                            expect(left).to.deep.equal(example.left);
                        });
                    }
                });
            });
        });
    });

    describe(".clone", () => {
        it("clones complex objects", () => {
            const obj = {
                name: "a string",
                nested: {
                    attributes: [
                        {name: "one", value: 345, since: new Date(1934, 1, 1)},
                    ],
                    another: "property",
                    enabled: true,
                    nested2: {
                        name: "another string",
                    },
                },
            };
            const cloned = clone(obj);
            expect(cloned).to.deep.equal(obj);
        });
        it("clones RegExp", () => {
            const obj = {
                pattern: /expr/gim,
            };
            const cloned = clone(obj);
            expect(cloned).to.deep.equal({
                pattern: /expr/gim,
            });
        });
    });

    describe("using cloneDiffValues", () => {
        before(function() {
            this.instance = new DiffPatcher({
                cloneDiffValues: true,
            });
        });
        it("ensures deltas don't reference original objects", function() {
            const left = {
                oldProp: {
                    value: 3,
                },
            };
            const right = {
                newProp: {
                    value: 5,
                },
            };
            const delta = this.instance.diff(left, right);
            left.oldProp.value = 1;
            right.newProp.value = 8;
            expect(delta).to.deep.equal({
                oldProp: [{value: 3}, 0, 0],
                newProp: [{value: 5}],
            });
        });
    });

    describe("plugins", () => {
        before(function() {
            this.instance = new DiffPatcher();
        });

        describe("getting pipe filter list", () => {
            it("returns builtin filters", function() {
                expect(this.instance.processor.pipes.diff.list()).to.deep.equal([
                    "collectChildren",
                    "trivial",
                    "dates",
                    "texts",
                    "objects",
                    "arrays",
                ]);
            });
        });

        describe("supporting numeric deltas", () => {
            const NUMERIC_DIFFERENCE = -8;

            it("diff", function() {
                // a constant to identify the custom delta type
                function numericDiffFilter(context) {
                    if (
                        typeof context.left === "number" &&
                        typeof context.right === "number"
                    ) {
                        // store number delta, eg. useful for distributed counters
                        context
                            .setResult([0, context.right - context.left, NUMERIC_DIFFERENCE])
                            .exit();
                    }
                }
                // a filterName is useful if I want to allow other filters to
                // be inserted before/after this one
                numericDiffFilter.filterName = "numeric";

                // insert new filter, right before trivial one
                this.instance.processor.pipes.diff.before("trivial", numericDiffFilter);

                const delta = this.instance.diff(
                    {population: 400},
                    {population: 403}
                );
                expect(delta).to.deep.equal({population: [0, 3, NUMERIC_DIFFERENCE]});
            });

            it("patch", function() {
                function numericPatchFilter(context) {
                    if (
                        context.delta &&
            Array.isArray(context.delta) &&
            context.delta[2] === NUMERIC_DIFFERENCE
                    ) {
                        context.setResult(context.left + context.delta[1]).exit();
                    }
                }
                numericPatchFilter.filterName = "numeric";
                this.instance.processor.pipes.patch.before(
                    "trivial",
                    numericPatchFilter
                );

                const delta = {population: [0, 3, NUMERIC_DIFFERENCE]};
                const right = this.instance.patch({population: 600}, delta);
                expect(right).to.deep.equal({population: 603});
            });

            it("unpatch", function() {
                function numericReverseFilter(context) {
                    if (context.nested) {
                        return;
                    }
                    if (
                        context.delta &&
            Array.isArray(context.delta) &&
            context.delta[2] === NUMERIC_DIFFERENCE
                    ) {
                        context
                            .setResult([0, -context.delta[1], NUMERIC_DIFFERENCE])
                            .exit();
                    }
                }
                numericReverseFilter.filterName = "numeric";
                this.instance.processor.pipes.reverse.after(
                    "trivial",
                    numericReverseFilter
                );

                const delta = {population: [0, 3, NUMERIC_DIFFERENCE]};
                const reverseDelta = this.instance.reverse(delta);
                expect(reverseDelta).to.deep.equal({
                    population: [0, -3, NUMERIC_DIFFERENCE],
                });
                const right = {population: 703};
                this.instance.unpatch(right, delta);
                expect(right).to.deep.equal({population: 700});
            });
        });

        describe("removing and replacing pipe filters", () => {
            it("removes specified filter", function() {
                expect(this.instance.processor.pipes.diff.list()).to.deep.equal([
                    "collectChildren",
                    "numeric",
                    "trivial",
                    "dates",
                    "texts",
                    "objects",
                    "arrays",
                ]);
                this.instance.processor.pipes.diff.remove("dates");
                expect(this.instance.processor.pipes.diff.list()).to.deep.equal([
                    "collectChildren",
                    "numeric",
                    "trivial",
                    "texts",
                    "objects",
                    "arrays",
                ]);
            });

            it("replaces specified filter", function() {
                function fooFilter(context) {
                    context.setResult(["foo"]).exit();
                }
                fooFilter.filterName = "foo";
                expect(this.instance.processor.pipes.diff.list()).to.deep.equal([
                    "collectChildren",
                    "numeric",
                    "trivial",
                    "texts",
                    "objects",
                    "arrays",
                ]);
                this.instance.processor.pipes.diff.replace("trivial", fooFilter);
                expect(this.instance.processor.pipes.diff.list()).to.deep.equal([
                    "collectChildren",
                    "numeric",
                    "foo",
                    "texts",
                    "objects",
                    "arrays",
                ]);
            });
        });
    });
});

describe("lcs", () => {
    it("should lcs arrays ", () => {
        expect(lcs.get([], [])).to.deep.equal({
            sequence: [],
            indices1: [],
            indices2: [],
        });

        expect(lcs.get([1], [2])).to.deep.equal({
            sequence: [],
            indices1: [],
            indices2: [],
        });

        // indices1 and indices2 show where the sequence
        // elements are located in the original arrays
        expect(lcs.get([ 1 ], [ -9, 1 ])).to.deep.equal({
            sequence: [1],
            indices1: [0],
            indices2: [1],
        });

        // indices1 and indices2 show where the sequence
        // elements are located in the original arrays
        expect(lcs.get([ 1, 9, 3, 4, 5 ], [ -9, 1, 34, 3, 2, 1, 5, 93 ]))
            .to.deep.equal({
                sequence: [1, 3, 5],
                indices1: [0, 2, 4],
                indices2: [1, 3, 6],
            });
    });

    it("should compute diff for large array", () => {
        const ARRAY_LENGTH = 3000; // js stack is about 50k
        function randomArray() {
            const result = [];
            for (let i = 0; i < ARRAY_LENGTH; i++) {
                if (Math.random() > 0.5) {
                    result.push("A");
                } else {
                    result.push("B");
                }
            }
            return result;
        }

        lcs.get(randomArray(), randomArray());
    });
});
