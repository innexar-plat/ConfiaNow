import assert from "node:assert/strict";
import test from "node:test";
import { isValidCnpj, isValidCpf } from "@platform/auth";

test("CPF validator accepts a valid document", () => {
  assert.equal(isValidCpf("529.982.247-25"), true);
});

test("CPF validator rejects an invalid document", () => {
  assert.equal(isValidCpf("111.111.111-11"), false);
});

test("CNPJ validator accepts a valid document", () => {
  assert.equal(isValidCnpj("45.723.174/0001-10"), true);
});

test("CNPJ validator rejects an invalid document", () => {
  assert.equal(isValidCnpj("11.111.111/1111-11"), false);
});
