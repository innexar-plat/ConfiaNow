import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSlug } from "@platform/profiles";

test("normalizeSlug removes accents and punctuation", () => {
  assert.equal(normalizeSlug(" Pintura Sao Joao Premium!!! "), "pintura-sao-joao-premium");
  assert.equal(normalizeSlug("Tinta & Cor - Orlando"), "tinta-cor-orlando");
});