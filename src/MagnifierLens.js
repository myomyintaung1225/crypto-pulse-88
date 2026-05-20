import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Touch-friendly magnifier lens.
 * Activate by adding `data-magnify` to any element.
 *
 * Behavior:
 * - Hold finger on a `data-magnify` element => show a bubble above the finger.
 * - Bubble renders a scaled clone of the touched element's content.
 * - Lightweight: single global pointer handler + one overlay.
 */
export default function MagnifierLens({
  enabled = true,
  zoom = 2.1,
  lensSize = 120,
  offsetY = 18
}) {
  const lensRef = useRef(null);
  const [state, setState] = useState({
    visible: false,
    x: 0,
    y: 0,
    html: '',
    fontScale: zoom,
    originW: 0,
    originH: 0
  });

  const cssText = useMemo(() => {
    const size = lensSize;
    return `
      .magnifier-lens__bubble{
        width:${size}px; height:${size}px;
        border-radius: 999px;
        overflow:hidden;
        position:absolute;
        transform: translate(-50%, -100%);
        pointer-events:none;
        background: rgba(10,10,10,0.15);
        border: 1px solid rgba(255,255,255,0.35);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .magnifier-lens__content{
        position:absolute;
        left:0; top:0;
        transform-origin: top left;
        will-change: transform;
        filter: none;
      }
      .magnifier-lens__content *{
        -webkit-text-size-adjust: 100%;
      }
    `;
  }, [lensSize]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    const bubbleSize = lensSize;
    const cleanupFns = [];

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const getTargetEl = (el) => {
      if (!el) return null;
      if (el.nodeType !== 1) return null;
      if (el.closest) return el.closest('[data-magnify]');
      return null;
    };

    const updateForPoint = (pointerX, pointerY, targetEl) => {
      const rect = targetEl.getBoundingClientRect();
      // Finger position relative to target
      const relX = pointerX - rect.left;
      const relY = pointerY - rect.top;

      // Bubble position: above finger
      const x = pointerX;
      const y = pointerY - offsetY;

      // Prepare scaled clone
      // We render HTML and translate/scales so that relX/relY aligns under lens center.
      const zoomFactor = zoom;
      const contentScale = zoomFactor;

      // Translate so that (relX, relY) in original becomes centered inside lens.
      // content top-left after scaling will be:
      //   contentLeft = (lensCenterX / zoom) - relX
      const lensCenter = bubbleSize / 2;
      const contentTranslateX = (lensCenter / contentScale) - relX;
      const contentTranslateY = (lensCenter / contentScale) - relY;

      // Cap to keep within bounds a bit (not strict)
      const originW = rect.width;
      const originH = rect.height;

      // Clone HTML
      const html = targetEl.cloneNode(true);
      // Remove attribute that would recursively activate
      html.removeAttribute('data-magnify');
      // Ensure it doesn't have an id that could collide
      html.removeAttribute('id');
      const markup = html.innerHTML;

      setState({
        visible: true,
        x: clamp(x, 8, window.innerWidth - 8),
        y: clamp(y, 8, window.innerHeight - 8),
        html: markup,
        fontScale: zoomFactor,
        originW,
        originH,
        // store translation/scaling in closure by writing to dataset via ref (below)
        _translateX: contentTranslateX,
        _translateY: contentTranslateY
      });

      const lens = lensRef.current;
      if (lens) {
        const content = lens.querySelector('.magnifier-lens__content');
        if (content) {
          content.style.transform = `translate(${contentTranslateX}px, ${contentTranslateY}px) scale(${contentScale})`;
        }
      }
    };

    const showAt = (e) => {
      const targetEl = getTargetEl(e.target);
      if (!targetEl) return;
      // Use touch hold to avoid flashing on scroll.
      // We'll immediately show only if it's already in hold state.
      // For simplicity + performance: show on first contact.
      updateForPoint(e.clientX, e.clientY, targetEl);
    };

    const move = (e) => {
      const targetEl = getTargetEl(e.target) || (lensRef.current ? lensRef.current.__activeTarget : null);
      if (!targetEl) return;
      updateForPoint(e.clientX, e.clientY, targetEl);
    };

    const hide = () => {
      setState((s) => ({ ...s, visible: false, html: '' }));
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse') return; // touch-first
      const targetEl = getTargetEl(e.target);
      if (!targetEl) return;

      // Capture active target for subsequent moves
      if (lensRef.current) lensRef.current.__activeTarget = targetEl;

      // Prevent thumb blocking content by allowing underlying touch to continue
      // but avoid text selection.
      e.preventDefault?.();
      showAt(e);
    };

    const onPointerMove = (e) => {
      if (state.visible === false) return;
      if (e.pointerType !== 'mouse') {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => move(e));
      }
    };

    const onPointerUp = () => {
      hide();
    };
    const onPointerCancel = () => hide();

    document.addEventListener('pointerdown', onPointerDown, { passive: false });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('pointercancel', onPointerCancel, { passive: true });

    cleanupFns.push(() => document.removeEventListener('pointerdown', onPointerDown));
    cleanupFns.push(() => document.removeEventListener('pointermove', onPointerMove));
    cleanupFns.push(() => document.removeEventListener('pointerup', onPointerUp));
    cleanupFns.push(() => document.removeEventListener('pointercancel', onPointerCancel));

    // Keep hidden on scroll/resize
    const onScroll = () => hide();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    cleanupFns.push(() => window.removeEventListener('scroll', onScroll));
    cleanupFns.push(() => window.removeEventListener('resize', onScroll));

    return () => {
      if (raf) cancelAnimationFrame(raf);
      cleanupFns.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, zoom, lensSize, offsetY, state.visible]);

  return (
    <>
      <style>{cssText}</style>
      <div
        ref={lensRef}
        className="magnifier-lens"
        style={{ position: 'fixed', left: 0, top: 0, zIndex: 99999, pointerEvents: 'none' }}
        aria-hidden
      >
        {state.visible && (
          <div
            className="magnifier-lens__bubble"
            style={{
              left: state.x,
              top: state.y
            }}
          >
            <div
              className="magnifier-lens__content"
              // This is the scaled clone content.
              // We set actual transform (translate/scale) in JS for pixel alignment.
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          </div>
        )}
      </div>
    </>
  );
}

