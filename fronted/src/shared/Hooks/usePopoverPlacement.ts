import { useEffect, useState, type RefObject } from "react";

export interface PopoverPlacement {
  /** El panel se abre hacia arriba del disparador */
  up: boolean;
  /** El panel se alinea por su borde derecho (en vez del izquierdo) */
  alignRight: boolean;
}

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const GAP = 8;

const toBox = (rect: DOMRect): Box => ({
  top: rect.top,
  bottom: rect.bottom,
  left: rect.left,
  right: rect.right,
});

/** Área visible donde el panel puede desplegarse */
function getBounds(anchor: HTMLElement): Box {
  // Dentro de un modal, la card es el límite visible
  const modal = anchor.closest<HTMLElement>(".modal-content");
  if (modal) return toBox(modal.getBoundingClientRect());

  // Si algún ancestro recorta el contenido, usamos ese límite
  let node = anchor.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if (style.overflowX !== "visible" || style.overflowY !== "visible") {
      return toBox(node.getBoundingClientRect());
    }
    node = node.parentElement;
  }

  return { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
}

/**
 * Calcula hacia dónde debe abrirse un panel flotante (menú, popover)
 * para no salirse del área visible. Se recalcula cada vez que se abre.
 */
export function usePopoverPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>
): PopoverPlacement {
  const [placement, setPlacement] = useState<PopoverPlacement>({ up: false, alignRight: false });

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;

      const trigger = anchor.getBoundingClientRect();
      const bounds = getBounds(anchor);
      const { width, height } = panel.getBoundingClientRect();

      const spaceBelow = bounds.bottom - trigger.bottom;
      const spaceAbove = trigger.top - bounds.top;
      const up = height + GAP > spaceBelow && spaceAbove > spaceBelow;

      const fitsLeftAligned = trigger.left + width <= bounds.right - GAP;
      const roomToRight = bounds.right - trigger.left;
      const roomToLeft = trigger.right - bounds.left;
      const alignRight = !fitsLeftAligned && roomToLeft > roomToRight;

      setPlacement((prev) =>
        prev.up === up && prev.alignRight === alignRight ? prev : { up, alignRight }
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [open, anchorRef, panelRef]);

  return placement;
}
