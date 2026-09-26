const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Runs a Web Animations API animation on an element. Skipped when the user
 * prefers reduced motion or the browser (or jsdom) does not support it.
 */
export function animate (
  el: Element | null,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions
) {
  if (!el || typeof el.animate !== 'function' || prefersReducedMotion()) return
  el.animate(keyframes, options)
}

/** Briefly highlights the on-screen key for a keyboard press. */
export function flashKey (key: string) {
  animate(
    document.querySelector(`[data-k="${key}"]`),
    [{ transform: 'scale(0.93)', filter: 'brightness(1.3)' }, { transform: 'none', filter: 'none' }],
    { duration: 180, easing: 'ease-out' }
  )
}
