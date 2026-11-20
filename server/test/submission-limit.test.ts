import { expect, it } from "vitest";
import { createSubmissionLimit } from "../src/shared/http/submission-limit.js";

it("keeps a sliding quota and frees expired clients without evicting live entries", () => {
  const allowed = createSubmissionLimit(1000, 2, 2);
  expect(allowed("a", 0)).toBe(true);
  expect(allowed("a", 100)).toBe(true);
  expect(allowed("a", 200)).toBe(false);
  expect(allowed("b", 300)).toBe(true);
  expect(allowed("c", 400)).toBe(false);
  expect(allowed("a", 1000)).toBe(true);
  expect(allowed("c", 1050)).toBe(false);
  expect(allowed("c", 2000)).toBe(true);
});
