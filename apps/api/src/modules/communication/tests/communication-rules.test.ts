import assert from "node:assert/strict";
import test from "node:test";
import { containsForbiddenMessagePattern } from "@platform/communication";

test("forbidden patterns are blocked in conversation messages", () => {
  assert.equal(containsForbiddenMessagePattern("Envia sua chave pix para adiantar"), true);
  assert.equal(containsForbiddenMessagePattern("Vamos manter toda negociacao no chat oficial"), false);
});