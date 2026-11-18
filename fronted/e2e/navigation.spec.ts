import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3100";

async function registerAndLogin(page: Page, request: APIRequestContext) {
    const suffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
    const email = `nav_${suffix}@example.com`;
    const password = "Abcdef1!";
    const phone = `9${suffix}`;

    const registered = await request.post(`${API_URL}/auth/register`, {
        data: {
            name: "E2E Navigation",
            birthDate: "1990-01-01",
            phone,
            country: "PE",
            email,
            password,
        },
    });
    expect(registered.ok()).toBeTruthy();

    const body = (await registered.json()) as { user?: { sub?: string } };
    const userId = body.user?.sub;

    await page.goto("/login");
    if (userId) {
        // Evita que el tutorial de bienvenida se abra encima de la navegación
        await page.evaluate(
            (id) => localStorage.setItem(`finance-onboarding-v1-${id}`, "done"),
            userId
        );
    }
    await page.getByLabel("Email").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /hola,/i })).toBeVisible({ timeout: 15_000 });
}

test("la navegación principal abre cada sección y marca el enlace activo", async ({ page, request }) => {
    await registerAndLogin(page, request);

    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    const sections: Array<[string, string]> = [
        ["Transacciones", "/transactions"],
        ["Cuentas", "/accounts"],
        ["Deudas", "/debts"],
        ["Planificación", "/planning"],
        ["Reportes", "/reports"],
        ["Productos", "/products"],
        ["Categorías", "/categories"],
    ];

    for (const [label, path] of sections) {
        const link = nav.getByRole("link", { name: label, exact: true });
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(link).toHaveClass(/active/);
    }

    const home = nav.getByRole("link", { name: "Inicio", exact: true });
    await home.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(home).toHaveClass(/active/);
});

test.describe("móvil", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("el menú se cierra con Escape y 'Más' refleja la sección activa", async ({ page, request }) => {
        await registerAndLogin(page, request);

        const more = page.getByRole("button", { name: /más opciones/i });
        const menu = page.getByRole("navigation", { name: "Menú de navegación" });

        await more.click();
        await expect(menu).toBeVisible();

        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();

        await more.click();
        await menu.getByRole("link", { name: "Cuentas", exact: true }).click();

        await expect(page).toHaveURL(/\/accounts$/);
        await expect(menu).toBeHidden();
        await expect(more).toHaveClass(/is-active/);
    });
});

test("el skip link lleva el foco al contenido principal", async ({ page, request }) => {
    await registerAndLogin(page, request);

    // Recarga para partir de un foco inicial limpio
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /hola,/i })).toBeVisible();

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(skip).toBeFocused();

    await skip.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
});

test("el modal de nueva transacción es un diálogo con nombre accesible", async ({ page, request }) => {
    await registerAndLogin(page, request);

    await page.locator('button.fab[aria-label="Nueva transacción"]').click();
    const dialog = page.getByRole("dialog", { name: "Nueva transacción" });
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
});
