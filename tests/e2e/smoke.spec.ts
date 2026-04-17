import { expect, test } from "@playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://localhost:3333";

test.describe("release smoke", () => {
  test("API publica responde health, config e trust badges", async ({ request }) => {
    const liveResponse = await request.get(`${apiBaseUrl}/api/v1/health/live`);
    expect(liveResponse.ok()).toBeTruthy();
    await expect(liveResponse.json()).resolves.toMatchObject({ status: "ok" });

    const configResponse = await request.get(`${apiBaseUrl}/api/v1/config/public`);
    expect(configResponse.ok()).toBeTruthy();
    await expect(configResponse.json()).resolves.toMatchObject({
      data: {
        name: expect.any(String),
        slug: expect.any(String),
        supportEmail: expect.any(String)
      }
    });

    const trustResponse = await request.get(`${apiBaseUrl}/api/v1/trust/badges`);
    expect(trustResponse.ok()).toBeTruthy();
    const trustPayload = await trustResponse.json();
    expect(Array.isArray(trustPayload.data)).toBeTruthy();
    expect(trustPayload.data.length).toBeGreaterThan(0);
  });

  test("web publica renderiza busca, trust badges e signin", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Busca publica")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buscar" })).toBeVisible();

    await page.goto("/trust/badges");
    await expect(page.getByText("Bronze")).toBeVisible();
    await expect(page.getByText("Prata")).toBeVisible();
    await expect(page.getByText("Ouro")).toBeVisible();

    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: /Entrar em/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta de cliente" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta de negocio" })).toBeVisible();
  });

  test("admin demo navega pelo core administrativo", async ({ page }) => {
    await page.goto("/signin");

    const consentButton = page.getByRole("button", { name: "Entendi" });
    if (await consentButton.isVisible()) {
      await consentButton.click();
    }

    await page.getByRole("link", { name: "Entrar como Administrador demo" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Dashboard inicial do Core Platform")).toBeVisible();

    await page.getByRole("link", { name: "Abrir settings administrativos" }).click();
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByText("Admin core")).toBeVisible();

    await page.getByRole("link", { name: "Abrir dashboard de analytics" }).click();
    await expect(page).toHaveURL(/\/admin\/analytics/);
    await expect(page.getByText("Admin analytics")).toBeVisible();

    await page.goto("/admin/pages");
    await expect(page.getByText("Admin — Growth CMS")).toBeVisible();

    await page.goto("/admin/integrations");
    await expect(page.getByText("Admin - Integrations")).toBeVisible();
  });
});