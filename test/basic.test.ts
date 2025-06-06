import { test, expect } from "vitest";
import { hello } from "stash";

test("it works", () => {
  expect(hello("Max")).toEqual("Hello Max");
});
