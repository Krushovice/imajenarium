import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("renders title and subtitle", async ({ page }) => {
    await expect(page.getByText("Book Imaginarium").first()).toBeVisible();
    await expect(page.getByText("Войди в свой литературный мир")).toBeVisible();
  });

  test("email and password fields visible", async ({ page }) => {
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
  });

  test("submit button visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Войти/ })).toBeVisible();
  });

  test("password toggle shows and hides password", async ({ page }) => {
    const passwordInput = page.locator("input#password");
    await passwordInput.fill("secret123");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = page.locator("div").filter({ has: passwordInput }).last().getByRole("button");
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("social login buttons visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Telegram/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/ })).toBeVisible();
  });

  test("link to register page works", async ({ page }) => {
    await page.getByRole("link", { name: /Зарегистрироваться/ }).click();
    await expect(page).toHaveURL("/auth/register");
  });

  test("form fills and submits without crash", async ({ page }) => {
    await page.locator("input#email").fill("test@example.com");
    await page.locator("input#password").fill("password123");
    await page.getByRole("button", { name: /Войти/ }).click();
    await expect(page.getByText(/Входим/)).toBeVisible();
  });
});

test.describe("Register Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/register");
  });

  test("renders title and subtitle", async ({ page }) => {
    await expect(page.getByText("Book Imaginarium").first()).toBeVisible();
    await expect(page.getByText("Создай свой литературный мир")).toBeVisible();
  });

  test("all form fields visible", async ({ page }) => {
    await expect(page.locator("input#name")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#confirm")).toBeVisible();
  });

  test("submit button visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Создать аккаунт/ })).toBeVisible();
  });

  test("link to login page works", async ({ page }) => {
    await page.getByRole("link", { name: /Войти/ }).click();
    await expect(page).toHaveURL("/auth/login");
  });

  test("password mismatch shows error", async ({ page }) => {
    await page.locator("input#name").fill("Test User");
    await page.locator("input#email").fill("test@example.com");
    await page.locator("input#password").fill("password123");
    await page.locator("input#confirm").fill("different456");
    await page.getByRole("button", { name: /Создать аккаунт/ }).click();
    await expect(page.getByText("Пароли не совпадают")).toBeVisible();
  });

  test("valid form submits and shows loading", async ({ page }) => {
    await page.locator("input#name").fill("Test User");
    await page.locator("input#email").fill("test@example.com");
    await page.locator("input#password").fill("password123");
    await page.locator("input#confirm").fill("password123");
    await page.getByRole("button", { name: /Создать аккаунт/ }).click();
    await expect(page.getByText(/Создаём/)).toBeVisible();
  });
});

test.describe("Onboarding Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/onboarding");
  });

  test("step 1: mood selection visible", async ({ page }) => {
    await expect(page.getByText("Как ты сейчас себя чувствуешь?")).toBeVisible();
    await expect(page.getByText("Задумчивое")).toBeVisible();
    await expect(page.getByText("Авантюрное")).toBeVisible();
    await expect(page.getByText("Романтичное")).toBeVisible();
    await expect(page.getByText("Меланхоличное")).toBeVisible();
    await expect(page.getByText("Любопытное")).toBeVisible();
  });

  test("mood buttons are initially not selected", async ({ page }) => {
    // Next button should be disabled before selecting a mood
    const nextButton = page.getByRole("button", { name: /Далее/ });
    await expect(nextButton).toBeDisabled();
  });

  test("step 1 → step 2 navigation", async ({ page }) => {
    await page.getByText("Задумчивое").click();
    await page.getByRole("button", { name: /Далее/ }).click();
    await expect(page.getByText("Какая атмосфера тебя притягивает?")).toBeVisible({ timeout: 8000 });
  });

  test("step 2: atmosphere multi-select", async ({ page }) => {
    await page.getByText("Задумчивое").click();
    await page.getByRole("button", { name: /Далее/ }).click();
    await expect(page.getByText("Тёмное, мрачное")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Уютное, тёплое")).toBeVisible();
    await page.getByText("Тёмное, мрачное").click();
    await page.getByText("Уютное, тёплое").click();
    await expect(page.getByRole("button", { name: /Далее/ }).last()).toBeEnabled();
  });

  test("step 3: book inputs visible", async ({ page }) => {
    await page.getByText("Задумчивое").click();
    await page.getByRole("button", { name: /Далее/ }).click();
    await page.getByText("Тёмное, мрачное").click();
    await page.getByRole("button", { name: /Далее/ }).last().click();
    await expect(page.getByText("Назови книги, которые тебя зацепили")).toBeVisible({ timeout: 8000 });
  });

  test("progress indicator shows correct step", async ({ page }) => {
    await expect(page.getByText("Шаг 1 из 4")).toBeVisible();
    await page.getByText("Задумчивое").click();
    await page.getByRole("button", { name: /Далее/ }).click();
    await expect(page.getByText("Шаг 2 из 4")).toBeVisible({ timeout: 8000 });
  });
});
