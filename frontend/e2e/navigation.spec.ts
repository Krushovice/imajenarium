import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header shows logo on landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Book Imaginarium/ }).first()).toBeVisible();
  });

  test("guest nav links visible", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Новости" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Открытия" })).toBeVisible();
  });

  test("logo links back to home", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("link", { name: /Book Imaginarium/ }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("Открытия nav link goes to discover", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: "Открытия" }).click();
    await expect(page).toHaveURL("/discover");
  });

  test("Новости nav link goes to feed", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: "Новости" }).click();
    await expect(page).toHaveURL("/feed");
  });

  test("feed page loads", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL("/feed");
    await expect(page.locator("body")).toBeVisible();
  });

  test("social page loads", async ({ page }) => {
    await page.goto("/social");
    await expect(page).toHaveURL("/social");
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page accessible from header", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: /Войти/ }).click();
    await expect(page).toHaveURL("/auth/login");
  });

  test("register page accessible from landing CTA", async ({ page }) => {
    await page.goto("/");
    // Header "Начать" is hidden; use the hero CTA link instead
    await page.getByRole("link", { name: /Начать погружение/ }).click();
    await expect(page).toHaveURL("/auth/register");
  });
});

test.describe("Page titles and meta", () => {
  test("landing page has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Book Imaginarium/);
  });

  test("login page has correct title", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveTitle(/Book Imaginarium/);
  });
});
