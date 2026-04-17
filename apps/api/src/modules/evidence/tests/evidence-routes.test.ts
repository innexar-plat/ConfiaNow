import assert from "node:assert/strict";
import test from "node:test";
import { resetDatabaseForTests } from "@platform/database";
import { createApp } from "../../../app";

test.beforeEach(async () => {
  await resetDatabaseForTests();
});

async function registerClient(app: Awaited<ReturnType<typeof createApp>>, suffix: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register/client",
    payload: {
      fullName: `Cliente Evidencia ${suffix}`,
      cpf: suffix === "A" ? "529.982.247-25" : "111.444.777-35",
      email: `cliente-evidencia-${suffix.toLowerCase()}@example.com`,
      phone: suffix === "A" ? "11996661111" : "11996662222",
      birthDate: "1990-08-10",
      password: "Senha123!"
    }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function login(app: Awaited<ReturnType<typeof createApp>>, email: string, password: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/sessions",
    payload: { email, password }
  });

  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

test("file lifecycle and evidence linking works for authenticated user", async () => {
  const app = await createApp();
  const clientCookies = await registerClient(app, "A");

  const verificationStatus = await app.inject({
    method: "GET",
    url: "/api/v1/auth/verification-status",
    headers: { cookie: clientCookies }
  });

  assert.equal(verificationStatus.statusCode, 200);
  const verificationRequestId = verificationStatus.json().data.verificationRequestId as string;

  const uploadDocument = await app.inject({
    method: "POST",
    url: "/api/v1/auth/documents",
    headers: { cookie: clientCookies },
    payload: {
      documentType: "identity_document",
      fileName: "rg-frente.pdf"
    }
  });

  assert.equal(uploadDocument.statusCode, 200);
  const documentId = uploadDocument.json().data.documents[0].id as string;

  const file = await app.inject({
    method: "POST",
    url: "/api/v1/files",
    headers: { cookie: clientCookies },
    payload: {
      originalName: "contrato-pintura.pdf",
      mimeType: "application/pdf",
      sizeBytes: 20480,
      storageUrl: "https://files.platform.local/contrato-pintura.pdf",
      checksumSha256: "abc123"
    }
  });

  assert.equal(file.statusCode, 201);
  const fileId = file.json().data.id as string;

  const getFile = await app.inject({
    method: "GET",
    url: `/api/v1/files/${fileId}`,
    headers: { cookie: clientCookies }
  });

  assert.equal(getFile.statusCode, 200);
  assert.equal(getFile.json().data.versions.length, 1);

  const link = await app.inject({
    method: "POST",
    url: "/api/v1/evidence-links",
    headers: { cookie: clientCookies },
    payload: {
      fileId,
      targetType: "VERIFICATION_REQUEST",
      targetId: verificationRequestId,
      description: "Comprovante solicitado para validacao"
    }
  });

  assert.equal(link.statusCode, 201);

  const myDocuments = await app.inject({
    method: "GET",
    url: "/api/v1/me/documents",
    headers: { cookie: clientCookies }
  });

  assert.equal(myDocuments.statusCode, 200);
  assert.equal(myDocuments.json().data.length >= 1, true);

  const resubmit = await app.inject({
    method: "POST",
    url: `/api/v1/me/documents/${documentId}/resubmit`,
    headers: { cookie: clientCookies },
    payload: {
      originalName: "rg-frente-atualizado.pdf",
      mimeType: "application/pdf",
      sizeBytes: 30720,
      storageUrl: "https://files.platform.local/rg-frente-atualizado.pdf"
    }
  });

  assert.equal(resubmit.statusCode, 200);
  assert.equal(resubmit.json().data.versionNumber, 2);

  const deleted = await app.inject({
    method: "DELETE",
    url: `/api/v1/files/${fileId}`,
    headers: { cookie: clientCookies }
  });

  assert.equal(deleted.statusCode, 200);
  assert.equal(deleted.json().data.success, true);

  await app.close();
});

test("user cannot read file from another account", async () => {
  const app = await createApp();
  const ownerCookies = await registerClient(app, "A");
  const anotherCookies = await registerClient(app, "B");

  const file = await app.inject({
    method: "POST",
    url: "/api/v1/files",
    headers: { cookie: ownerCookies },
    payload: {
      originalName: "private-file.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      storageUrl: "https://files.platform.local/private-file.pdf"
    }
  });

  const fileId = file.json().data.id as string;

  const forbidden = await app.inject({
    method: "GET",
    url: `/api/v1/files/${fileId}`,
    headers: { cookie: anotherCookies }
  });

  assert.equal(forbidden.statusCode, 403);

  const adminCookies = await login(app, "admin@plataforma.local", "Admin12345!");

  const allowedForAdmin = await app.inject({
    method: "GET",
    url: `/api/v1/files/${fileId}`,
    headers: { cookie: adminCookies }
  });

  assert.equal(allowedForAdmin.statusCode, 200);

  await app.close();
});
