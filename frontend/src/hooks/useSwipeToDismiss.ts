import { useRef, type TouchEvent as ReactTouchEvent } from 'react';

// Movement (px) before a downward pointer gesture counts as a swipe rather
// than a jitter or a tap.
const SWIPE_SLOP = 8;
// A drag past this distance, or a quick flick faster than this velocity,
// dismisses on release.
const SWIPE_DISMISS_OFFSET = 120;
const SWIPE_DISMISS_VELOCITY = 0.5; // px per ms
const SWIPE_SPRING_BACK = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
const SWIPE_DISMISS_TRANSITION =
  'transform 0.25s ease-out, opacity 0.25s ease-out';
const OVERLAY_DISMISS_TRANSITION = 'opacity 0.25s ease-out';
const OVERLAY_SPRING_BACK = 'opacity 0.2s ease-out';

interface SwipeHandlers {
  onTouchStart: (event: ReactTouchEvent<HTMLElement>) => void;
}

interface UseSwipeToDismissOptions {
  /** When false, no handlers are returned and the gesture is inert. */
  enabled: boolean;
  /** Called once the user swipes far/fast enough to dismiss. */
  onDismiss: () => void;
}

// A downward pull is only a dismiss when nothing between the pointer and the
// dragged element is scrolled away from its top — otherwise it's a scroll.
const isScrolledToTop = (
  target: EventTarget | null,
  root: HTMLElement
): boolean => {
  let el = target instanceof HTMLElement ? target : null;
  while (el != null && el !== root) {
    if (el.scrollTop > 0) return false;
    el = el.parentElement;
  }
  return true;
};

/**
 * Swipe-down-to-dismiss gesture, intended for full-screen-ish dialogs on touch.
 *
 * Spread the returned handler onto the element that should follow the finger
 * (typically the dialog content). On the first touch we attach non-passive
 * `touchmove`/`touchend` listeners to that element's own node and drive the
 * drag imperatively, so dragging never re-renders the caller.
 *
 * It only engages on a downward pull that starts at the top of the scrollable
 * region, and once engaged it calls `preventDefault()` on the move so the
 * browser doesn't hand the gesture to native scrolling (which otherwise fires
 * `pointercancel`/steals the drag). React's synthetic touch handlers are
 * passive and cannot `preventDefault`, which is why the listeners are native.
 * When the gesture isn't ours (upward, or not at the top) we bail immediately
 * and leave native scrolling untouched.
 *
 * Centering is left to the element's own layout; the handler adds a
 * `translateY` offset on top, so the two compose rather than fight.
 *
 * Returns `undefined` when `enabled` is false so the handler can be spread
 * directly (`<El {...swipe} />`) with no effect.
 */
export const useSwipeToDismiss = ({
  enabled,
  onDismiss,
}: UseSwipeToDismissOptions): SwipeHandlers | undefined => {
  const cleanupRef = useRef<(() => void) | null>(null);

  if (!enabled) return undefined;

  const onTouchStart = (event: ReactTouchEvent<HTMLElement>): void => {
    // Single-finger gestures only; a pinch/second finger is never a dismiss.
    if (event.touches.length !== 1) return;
    // A stray touchstart mid-gesture: tear down the previous one first.
    cleanupRef.current?.();

    const card = event.currentTarget;
    const startTouch = event.touches[0];
    const startX = startTouch.clientX;
    const startY = startTouch.clientY;
    const startTime = event.timeStamp;
    const overlays: HTMLElement[] = [];
    let decided = false;
    let dragging = false;

    const cleanup = (): void => {
      card.removeEventListener('touchmove', onMove);
      card.removeEventListener('touchend', onEnd);
      card.removeEventListener('touchcancel', onCancel);
      cleanupRef.current = null;
    };

    const onMove = (moveEvent: TouchEvent): void => {
      const touch = moveEvent.touches[0];
      if (touch == null) return;
      const dy = touch.clientY - startY;
      const dx = touch.clientX - startX;

      if (!decided) {
        if (Math.abs(dy) < SWIPE_SLOP && Math.abs(dx) < SWIPE_SLOP) return;
        decided = true;
        // Ours only when it's a downward, mostly-vertical pull that starts at
        // the top of the scroll region; anything else stays a native scroll.
        if (
          dy > SWIPE_SLOP &&
          dy > Math.abs(dx) &&
          isScrolledToTop(moveEvent.target, card)
        ) {
          dragging = true;
          card.style.transition = 'none';
          overlays.push(
            ...Array.from(
              document.querySelectorAll<HTMLElement>(
                '[data-slot="dialog-overlay"]'
              )
            )
          );
          overlays.forEach((overlay) => (overlay.style.transition = 'none'));
        } else {
          // Not our gesture — release so native scrolling proceeds normally.
          cleanup();
          return;
        }
      }

      if (!dragging) return;
      // Claim the gesture: without this the browser starts scrolling and fires
      // pointercancel, springing the card back.
      moveEvent.preventDefault();
      const offset = Math.max(0, dy - SWIPE_SLOP);
      card.style.transform = `translateY(${offset}px)`;
      // Fade the backdrop out as the card travels toward the bottom of the
      // viewport, so it's gone by the time a full swipe would clear the screen.
      const opacity = String(1 - Math.min(offset / window.innerHeight, 1));
      overlays.forEach((overlay) => (overlay.style.opacity = opacity));
    };

    const onEnd = (endEvent: TouchEvent): void => {
      cleanup();
      if (!dragging) return;
      const touch = endEvent.changedTouches[0];
      const dy = touch != null ? touch.clientY - startY : 0;
      const dt = endEvent.timeStamp - startTime;
      const velocity = dt > 0 ? dy / dt : 0;

      if (dy > SWIPE_DISMISS_OFFSET || velocity > SWIPE_DISMISS_VELOCITY) {
        card.style.animation = 'none';
        card.style.transition = SWIPE_DISMISS_TRANSITION;
        card.style.transform = `translateY(${window.innerHeight}px)`;
        card.style.opacity = '0';
        // Finish fading the backdrop out alongside the card. `animation: none`
        // keeps its own close animation from restarting it at full opacity.
        overlays.forEach((overlay) => {
          overlay.style.animation = 'none';
          overlay.style.transition = OVERLAY_DISMISS_TRANSITION;
          overlay.style.opacity = '0';
        });
        const finish = (transitionEvent: TransitionEvent): void => {
          if (transitionEvent.propertyName !== 'transform') return;
          card.removeEventListener('transitionend', finish);
          onDismiss();
        };
        card.addEventListener('transitionend', finish);
      } else {
        card.style.transition = SWIPE_SPRING_BACK;
        card.style.transform = 'translateY(0px)';
        overlays.forEach((overlay) => {
          overlay.style.transition = OVERLAY_SPRING_BACK;
          overlay.style.opacity = '';
        });
        const clear = (): void => {
          card.style.transition = '';
          card.style.transform = '';
          overlays.forEach((overlay) => {
            overlay.style.transition = '';
          });
          card.removeEventListener('transitionend', clear);
        };
        card.addEventListener('transitionend', clear);
      }
    };

    const onCancel = (): void => {
      cleanup();
      if (!dragging) return;
      card.style.transition = SWIPE_SPRING_BACK;
      card.style.transform = 'translateY(0px)';
      overlays.forEach((overlay) => {
        overlay.style.transition = OVERLAY_SPRING_BACK;
        overlay.style.opacity = '';
      });
    };

    card.addEventListener('touchmove', onMove, { passive: false });
    card.addEventListener('touchend', onEnd, { passive: false });
    card.addEventListener('touchcancel', onCancel, { passive: false });
    cleanupRef.current = cleanup;
  };

  return { onTouchStart };
};
