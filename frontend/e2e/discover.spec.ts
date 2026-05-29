import { test, expect } from "@playwright/test";

test.describe("Discover Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discover");
  });

  test("page loads with search input", async ({ page }) => {
    await expect(page.getByPlaceholder(/хочу что-то мрачное/i)).toBeVisible();
  });

  test("mood chips visible", async ({ page }) => {
    // Scope to rounded-full chip buttons to avoid matching example prompt text
    const chip = (label: string) =>
      page.locator("button.rounded-full").filter({ hasText: label });
    await expect(chip("Меланхоличное")).toBeVisible();
    await expect(chip("Напряжённое")).toBeVisible();
    await expect(chip("Романтичное")).toBeVisible();
    await expect(chip("Философское")).toBeVisible();
    await expect(chip("Эпическое")).toBeVisible();
    await expect(chip("Сюрреальное")).toBeVisible();
  });

  test("example prompts visible", async ({ page }) => {
    await expect(page.getByText(/хочу что-то мрачное с атмосферой/i)).toBeVisible();
    await expect(page.getByText(/как Дюна, но про любовь/i)).toBeVisible();
  });

  test("clicking mood chip fills search and shows results", async ({ page }) => {
    await page.getByText("Меланхоличное").click();
    const input = page.getByPlaceholder(/хочу что-то мрачное/i);
    await expect(input).not.toBeEmpty();
    await expect(page.getByText("Кафка на пляже")).toBeVisible({ timeout: 5000 });
  });

  test("typing prompt and pressing Enter shows results", async ({ page }) => {
    const input = page.getByPlaceholder(/хочу что-то мрачное/i);
    await input.fill("мрачное философское с атмосферой Кафки");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Кафка на пляже")).toBeVisible({ timeout: 5000 });
  });

  test("clicking example prompt shows results", async ({ page }) => {
    await page.getByText("как Дюна, но про любовь и потерю").click();
    await expect(page.getByText("Кафка на пляже")).toBeVisible({ timeout: 5000 });
  });

  test("results show match score and emotion tags", async ({ page }) => {
    await page.getByText("Меланхоличное").click();
    await expect(page.getByText("97%")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("сюрреализм").first()).toBeVisible();
    await expect(page.getByText("меланхолия").first()).toBeVisible();
  });

  test("clear search resets state", async ({ page }) => {
    const input = page.getByPlaceholder(/хочу что-то мрачное/i);
    await input.fill("философское");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Кафка на пляже")).toBeVisible({ timeout: 5000 });
    // X clear button appears when query is set
    await page.locator('button').filter({ has: page.locator('svg') }).nth(0).click();
    await expect(page.getByText(/хочу что-то мрачное с атмосферой/i)).toBeVisible({ timeout: 3000 });
  });
});
