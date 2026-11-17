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

    const headers = { Authorization: `Bearer ${token}` };

    const csv = await request.get(`${API_URL}/transaction/export`, { headers });
    expect(csv.ok()).toBeTruthy();
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain("Fecha;Hora;Nombre;Tipo");

    const pdf = await request.get(`${API_URL}/reports/monthly/export?months=3&format=pdf`, { headers });
    expect(pdf.ok()).toBeTruthy();
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 4).toString("utf8")).toBe("%PDF");

    const subscriptions = await request.get(`${API_URL}/recurring-payments/subscriptions`, { headers });
    expect(subscriptions.ok()).toBeTruthy();
    expect(await subscriptions.json()).toMatchObject({ subscriptions: [] });

    const debtorName = `E2E Deudor ${suffix}`;
    const createdContact = await request.post(`${API_URL}/contacts`, {
        headers,
        data: { name: debtorName },
    });
    expect(createdContact.ok()).toBeTruthy();
    const contact = (await createdContact.json()) as { id: string };

    const me = await request.get(`${API_URL}/user/me`, { headers });
    const meBody = (await me.json()) as { accounts?: { id: string }[] };
    const accountId = meBody.accounts?.[0]?.id;
    expect(accountId).toBeTruthy();

    const today = new Date().toISOString().slice(0, 10);
    const createdLoan = await request.post(`${API_URL}/loan`, {
        headers,
        data: {
            type: "RECEIVED",
            lender: debtorName,
            contactId: contact.id,
            date: today,
            startDate: today,
            amount: 500,
            accountId,
            description: "Deuda E2E",
        },
    });
    expect(createdLoan.ok()).toBeTruthy();

    await page.goto("/debts");
    await expect(page.getByText(debtorName, { exact: true })).toBeVisible();
    await page.getByText(debtorName, { exact: true }).click();
    await expect(page).toHaveURL(/\/debts\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: debtorName, exact: true })).toBeVisible();
    await expect(page.getByText("Deuda E2E", { exact: true })).toBeVisible();
    await expect(page.getByText(/yo debo/i).first()).toBeVisible();

    await page.goto("/subscriptions");
    await expect(page.getByRole("heading", { name: /hub de suscripciones/i })).toBeVisible();

    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: /^planificación$/i })).toBeVisible();
    await page.getByRole("tab", { name: /suscripciones/i }).click();
    await expect(page.getByRole("heading", { name: /hub de suscripciones/i })).toBeVisible();
    await page.getByRole("tab", { name: /presupuestos/i }).click();
    await expect(page.getByRole("heading", { name: /^presupuestos$/i })).toBeVisible();
    await page.getByRole("tab", { name: /previstos/i }).click();
    await expect(page.getByRole("heading", { name: /pagos futuros/i })).toBeVisible();
});
