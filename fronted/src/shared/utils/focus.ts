const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getClientRects().length > 0
    );
}

export function trapTabKey(event: KeyboardEvent, container: HTMLElement | null) {
    if (event.key !== "Tab" || !container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
            event.preventDefault();
            last.focus();
        }
        return;
    }

    if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
    }
}

export function focusFirstElement(container: HTMLElement | null) {
    if (!container) return;
    const first = getFocusableElements(container)[0];
    (first ?? container).focus();
}
