import { shallowEqual } from "stash";
import { test, expect } from "vitest";

test("compares primitives correctly", () => {
  expect(shallowEqual(1, 1)).toBe(true);
  expect(shallowEqual("a", "a")).toBe(true);
  expect(shallowEqual(true, true)).toBe(true);
  expect(shallowEqual(null, null)).toBe(true);
  expect(shallowEqual(undefined, undefined)).toBe(true);
  expect(shallowEqual(NaN, NaN)).toBe(true);
  expect(shallowEqual(0, -0)).toBe(false);
  expect(shallowEqual(0, NaN)).toBe(false);
  // @ts-expect-error Wrong type
  expect(shallowEqual(0, false)).toBe(false);
  // @ts-expect-error Wrong type
  expect(shallowEqual(1, true)).toBe(false);
  // @ts-expect-error Wrong type
  expect(shallowEqual("true", true)).toBe(false);
});

test("compares arrays shallowly", () => {
  expect(shallowEqual([1, 2], [1, 2])).toBe(true);
  expect(shallowEqual([1, 2], [2, 1])).toBe(false);
  expect(shallowEqual([1, { a: 1 }], [1, { a: 1 }])).toBe(true);
  expect(shallowEqual([1, { a: 1 }], [1, { a: 2 }])).toBe(false);
  expect(shallowEqual([1], [1, 2])).toBe(false);
});

test("compares objects shallowly (order-insensitive keys)", () => {
  expect(shallowEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  expect(shallowEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
  expect(shallowEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
});

test("returns false for mismatched types", () => {
  expect(shallowEqual([], {})).toBe(false);
  expect(shallowEqual({}, null)).toBe(false);
  expect(shallowEqual([], null)).toBe(false);
  expect(shallowEqual({}, [])).toBe(false);
});

test("handles nested structures correctly (shallow only)", () => {
  const obj = { nested: { val: 1 } };
  expect(shallowEqual(obj, { nested: { val: 1 } })).toBe(true);
  expect(shallowEqual([obj], [{ nested: { val: 1 } }])).toBe(true);
  expect(shallowEqual([obj], [{ nested: { val: 2 } }])).toBe(false);
});

test("handles reference equality", () => {
  const obj = { a: 1 };
  expect(shallowEqual(obj, obj)).toBe(true);

  const arr = [1, 2];
  expect(shallowEqual(arr, arr)).toBe(true);
});

test("handles functions by reference equality", () => {
  const fn1 = () => {};
  const fn2 = () => {};
  const fn3 = fn1;

  expect(shallowEqual(fn1, fn3)).toBe(true);
  expect(shallowEqual(fn1, fn2)).toBe(false);
  // @ts-expect-error Wrong type
  expect(shallowEqual(fn1, {})).toBe(false);
  // @ts-expect-error Wrong type
  expect(shallowEqual(fn1, 42)).toBe(false);
});

test("handles very deep mixed nested structures (shallowly)", () => {
  const fnA = () => "a";
  const fnB = () => "b";

  const deepObj1 = {
    num: 42,
    str: "hello",
    bool: true,
    nil: null,
    undef: undefined,
    nestedArray: [1, 2, { x: 3 }],
    nestedObj: {
      a: 1,
      b: [fnA, { c: "deep" }],
      c: fnA,
    },
    fn: fnA,
  };

  const deepObj2 = {
    num: 42,
    str: "hello",
    bool: true,
    nil: null,
    undef: undefined,
    nestedArray: [1, 2, { x: 3 }],
    nestedObj: {
      a: 1,
      b: [fnA, { c: "deep" }],
      c: fnA,
    },
    fn: fnA,
  };

  const deepObj3 = {
    ...deepObj2,
    fn: fnB,
  };

  const deepObj4 = {
    ...deepObj2,
    nestedObj: {
      ...deepObj2.nestedObj,
      b: [fnB, { c: "deep" }],
    },
  };

  expect(shallowEqual(deepObj1, deepObj1)).toBe(true);
  expect(shallowEqual(deepObj1, deepObj2)).toBe(true);
  expect(shallowEqual(deepObj1, deepObj3)).toBe(false);
  expect(shallowEqual(deepObj1, deepObj4)).toBe(false);

  const deepObj5 = {
    ...deepObj2,
    nestedObj: {
      ...deepObj2.nestedObj,
      c: fnB,
    },
  };
  expect(shallowEqual(deepObj2, deepObj5)).toBe(false);
});

test("additional edge cases", () => {
  expect(shallowEqual(null, {})).toBe(false);
  expect(shallowEqual([], {})).toBe(false);
  const sym1 = Symbol("foo");
  const sym2 = Symbol("foo");
  expect(shallowEqual(sym1, sym1)).toBe(true);
  // @ts-expect-error Wrong type
  expect(shallowEqual(sym1, sym2)).toBe(false);
  const date1 = new Date(2025, 2, 25);
  const date2 = new Date(2025, 2, 25);
  expect(shallowEqual(date1, date1)).toBe(true);
  expect(shallowEqual(date1, date2)).toBe(false);
  const regex1 = /test/;
  const regex2 = /test/;
  expect(shallowEqual(regex1, regex1)).toBe(true);
  expect(shallowEqual(regex1, regex2)).toBe(false);
});
