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

    await page.goto("/tags");
    await expect(page.getByRole("heading", { name: /^etiquetas$/i })).toBeVisible();
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /^productos$/i })).toBeVisible();
    await page.goto("/reconciliation");
    await expect(page.getByRole("heading", { name: /conciliación bancaria/i })).toBeVisible();

    const cardName = `Tarjeta E2E ${suffix}`;
    const createdCard = await request.post(`${API_URL}/accounts`, {
        headers,
        data: {
            name: cardName,
            type: "CREDIT",
            creditLimit: 1000,
            billingCloseDay: 15,
            paymentDueDay: 5,
            overdraft: 0,
            tea: 24,
            desgravamenRate: 1,
            desgravamenMaxAmount: 10,
        },
    });
    expect(createdCard.ok()).toBeTruthy();
    const card = (await createdCard.json()) as { id: string };

    await page.goto(`/accounts/${card.id}`);
    await expect(page).toHaveURL(/\/accounts\/[0-9a-f-]+$/);
    await expect(page.locator(".cc-panel")).toBeVisible();
    await expect(page.locator(".cc-metrics")).toContainText("Deuda total");
    await expect(page.getByText("Compras pendientes de confirmar")).toBeHidden();

    const categoriesResponse = await request.get(`${API_URL}/category?type=EXPENSE&limit=50`, { headers });
    expect(categoriesResponse.ok()).toBeTruthy();
    const categories = (await categoriesResponse.json()) as { data: { id: string }[] };
    const categoryId = categories.data[0]?.id;
    expect(categoryId).toBeTruthy();

    const pendingName = `Compra pendiente ${suffix}`;
    const pendingTransaction = await request.post(`${API_URL}/transaction`, {
        headers,
        data: {
            name: pendingName,
            type: "EXPENSE",
            amount: 25,
            date: today,
            accountId: card.id,
            categoryId,
            isRecurrent: false,
        },
    });
    expect(pendingTransaction.ok()).toBeTruthy();
    const pending = (await pendingTransaction.json()) as { id: string };

    const notifications = await request.get(`${API_URL}/notifications`, { headers });
    expect(notifications.ok()).toBeTruthy();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /hola,/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Notificaciones" }).click();
    await page.getByRole("button", { name: /compras pendientes:/i }).click();

    await expect(page).toHaveURL(new RegExp(`/accounts/${card.id}#compras-pendientes$`));
    await expect(page.getByText("Compras pendientes de confirmar")).toBeVisible();

    const confirmed = await request.post(
        `${API_URL}/credit-card/${card.id}/pending/${pending.id}/confirm`,
        { headers, data: { amount: 25 } }
    );
    expect(confirmed.ok()).toBeTruthy();

    await page.goto(`/accounts/${card.id}`);
    await expect(page.locator(".cc-panel")).toBeVisible();
    const purchaseOption = page.locator(".cc-purchase-option").filter({ hasText: pendingName });
    await expect(purchaseOption).toBeVisible();
    await purchaseOption.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /vista previa/i }).click();

    const previewDialog = page.getByRole("dialog", { name: /vista previa del plan/i });
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog).toContainText("Cronograma");
    await previewDialog.getByRole("button", { name: /confirmar plan/i }).click();
    await expect(page.getByText(/a 6 cuotas/i)).toBeVisible({ timeout: 15_000 });

    await page.getByTitle("Revertir plan").click();
    const revertDialog = page.getByRole("dialog", { name: "Revertir plan de cuotas" });
    await expect(revertDialog).toBeVisible();
    await expect(revertDialog).toContainText("Solo se puede revertir");
    await revertDialog.getByRole("button", { name: "Revertir plan" }).click();
    await expect(page.getByText("Plan cancelado")).toBeVisible({ timeout: 15_000 });
});
