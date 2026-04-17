import assert from "node:assert/strict";
import test from "node:test";
import { getSeededAdminCredentials } from "@platform/auth";
import { resetDatabaseForTests } from "@platform/database";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

test("POST /api/v1/auth/register/client creates a persisted client session", async () => {
  const app = await createApp();

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: "Maria da Silva",
      cpf: "529.982.247-25",
      email: "maria@example.com",
      phone: "11999991111",
      birthDate: "1990-01-10",
      password: "Senha123!"
    }
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().data.role, "client");
  assert.match(String(response.headers["set-cookie"]), /platform_access_token=/);
  assert.match(String(response.headers["set-cookie"]), /platform_refresh_token=/);

  await app.close();
});

test("verification flow advances to pending_review after otp confirmation and document upload", async () => {
  const app = await createApp();

  const register = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/business",
    payload: {
      businessName: "Pintura Orlando Pro",
      legalRepresentativeName: "Carlos Souza",
      legalRepresentativeCpf: "529.982.247-25",
      cnpj: "12.345.678/0001-95",
      email: "empresa@example.com",
      phone: "11988887777",
      password: "Senha123!"
    }
  });

  const cookies = register.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

  const emailRequest = await app.inject({
    method: "POST",
    url: "/api/v1/auth/verify-email/request",
    headers: { cookie: cookies }
  });
  const phoneRequest = await app.inject({
    method: "POST",
    url: "/api/v1/auth/verify-phone/request",
    headers: { cookie: cookies }
  });

  await app.inject({
    method: "POST",
    url: "/api/v1/auth/verify-email/confirm",
    headers: { cookie: cookies },
    payload: { code: emailRequest.json().data.devCode }
  });
  await app.inject({
    method: "POST",
    url: "/api/v1/auth/verify-phone/confirm",
    headers: { cookie: cookies },
    payload: { code: phoneRequest.json().data.devCode }
  });

  const uploaded = await app.inject({
    method: "POST",
    url: "/api/v1/auth/documents",
    headers: { cookie: cookies },
    payload: {
      documentType: "cnh",
      fileName: "cnh-carlos.pdf"
    }
  });

  assert.equal(uploaded.statusCode, 200);
  assert.equal(uploaded.json().data.account.verificationStatus, "pending_review");

  await app.close();
});

test("admin can approve a verification request", async () => {
  const app = await createApp();

  const register = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: "Joao Oliveira",
      cpf: "52998224725",
      email: "joao@example.com",
      phone: "11977776666",
      birthDate: "1989-05-05",
      password: "Senha123!"
    }
  });
  const userCookies = register.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const emailRequest = await app.inject({ method: "POST", url: "/api/v1/auth/verify-email/request", headers: { cookie: userCookies } });
  const phoneRequest = await app.inject({ method: "POST", url: "/api/v1/auth/verify-phone/request", headers: { cookie: userCookies } });
  await app.inject({ method: "POST", url: "/api/v1/auth/verify-email/confirm", headers: { cookie: userCookies }, payload: { code: emailRequest.json().data.devCode } });
  await app.inject({ method: "POST", url: "/api/v1/auth/verify-phone/confirm", headers: { cookie: userCookies }, payload: { code: phoneRequest.json().data.devCode } });
  const documentResponse = await app.inject({
    method: "POST",
    url: "/api/v1/auth/documents",
    headers: { cookie: userCookies },
    payload: { documentType: "selfie", fileName: "selfie-joao.jpg" }
  });

  const adminCredentials = getSeededAdminCredentials();
  const adminLogin = await app.inject({
    method: "POST",
    url: "/api/v1/auth/sessions",
    payload: adminCredentials
  });
  const adminCookies = adminLogin.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

  const approved = await app.inject({
    method: "POST",
    url: `/api/v1/admin/verifications/${documentResponse.json().data.verificationRequestId}/approve`,
    headers: { cookie: adminCookies },
    payload: { note: "Everything looks correct" }
  });

  assert.equal(approved.statusCode, 200);
  assert.equal(approved.json().data.account.verificationStatus, "approved");

  await app.close();
});