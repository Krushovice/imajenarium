import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("hero section renders key elements", async ({ page }) => {
    await expect(page.getByText("Imaginarium").first()).toBeVisible();
    await expect(page.getByText("Персональный литературный мир").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Начать погружение/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Открыть мир книг/ })).toBeVisible();
  });

  test("emotion badges visible in hero", async ({ page }) => {
    await expect(page.getByText("меланхолия").first()).toBeVisible();
    await expect(page.getByText("философия").first()).toBeVisible();
    await expect(page.getByText("романтика").first()).toBeVisible();
    await expect(page.getByText("тайна").first()).toBeVisible();
  });

  test("CTA links to register page", async ({ page }) => {
    await page.getByRole("link", { name: /Начать погружение/ }).click();
    await expect(page).toHaveURL("/auth/register");
  });

  test('"Открыть мир книг" links to discover', async ({ page }) => {
    const link = page.getByRole("link", { name: /Открыть мир книг/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/discover", { timeout: 10000 });
  });

  test("Literary DNA preview section visible", async ({ page }) => {
    await expect(page.getByText("Literary DNA").first()).toBeVisible();
    await expect(page.getByText("Живой профиль").first()).toBeVisible();
    await expect(page.getByText("Твой Literary DNA")).toBeVisible();
    await expect(page.getByText("Философия", { exact: true })).toBeVisible();
    await expect(page.getByText("Меланхолия", { exact: true })).toBeVisible();
  });

  test("How It Works section has 4 steps", async ({ page }) => {
    await expect(page.getByText("Как работает магия")).toBeVisible();
    await expect(page.getByText("Читаешь")).toBeVisible();
    await expect(page.getByText("AI анализирует")).toBeVisible();
    await expect(page.getByText("DNA обновляется")).toBeVisible();
    await expect(page.getByText("Рекомендует")).toBeVisible();
  });

  test("stats section shows numbers", async ({ page }) => {
    await expect(page.getByText("12 400+")).toBeVisible();
    await expect(page.getByText("85 000+")).toBeVisible();
    await expect(page.getByText("1.2М+")).toBeVisible();
    await expect(page.getByText("Читателей")).toBeVisible();
  });

  test("final CTA section present", async ({ page }) => {
    await expect(page.getByText("Твой литературный мир")).toBeVisible();
    const createLink = page.getByRole("link", { name: /Создать аккаунт/ });
    await expect(createLink).toBeVisible();
    // Two "Войти" links exist (header + CTA) — check last one in CTA section
    await expect(page.getByRole("link", { name: /^Войти$/ }).last()).toBeVisible();
  });

  test("final CTA login link goes to /auth/login", async ({ page }) => {
    await page.getByRole("link", { name: /^Войти$/ }).last().click();
    await expect(page).toHaveURL("/auth/login");
  });
});
