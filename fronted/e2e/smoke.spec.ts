import { expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3100";

test("los health checks responden", async ({ request }) => {
    const live = await request.get(`${API_URL}/health/live`);
    expect(live.ok()).toBeTruthy();
    expect(await live.json()).toMatchObject({ status: "ok" });

    const ready = await request.get(`${API_URL}/health/ready`);
    expect(ready.ok()).toBeTruthy();
    expect(await ready.json()).toMatchObject({ status: "ok", db: "up" });
});

test("registro por API, login por UI y dashboard", async ({ page, request }) => {
    const suffix = Date.now().toString().slice(-8);
    const email = `e2e_${suffix}@example.com`;
    const password = "Abcdef1!";
    const phone = `9${suffix}`;

    const registered = await request.post(`${API_URL}/auth/register`, {
        data: {
            name: "E2E User",
            birthDate: "1990-01-01",
            phone,
            country: "PE",
            email,
            password,
        },
    });
    expect(registered.ok()).toBeTruthy();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /hola,/i })).toBeVisible({ timeout: 15_000 });

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
});
