/** Preset names for `props.animation.preset` on `rich_text` nodes. */
export const RICH_TEXT_ANIMATION_PRESETS = ['none', 'fade', 'slide', 'scale', 'fadeIn', 'fadeInUp', 'slideUp'];

/**
 * @param {{ preset?: string; duration?: number; delay?: number }} animation - from node.props.animation
 * @returns {{ className: string; style: Record<string, string|number> }}
 */
export function getRichTextAnimationStyle(animation = {}) {
  const rawPreset = animation?.preset || 'none';
  const preset =
    rawPreset === 'fadeIn'
      ? 'fade'
      : rawPreset === 'fadeInUp' || rawPreset === 'slideUp'
        ? 'slide'
        : rawPreset;
  if (!preset || preset === 'none') {
    return { className: '', style: {} };
  }

  const duration = typeof animation.duration === 'number' && Number.isFinite(animation.duration) ? animation.duration : 0.6;
  const delay = typeof animation.delay === 'number' && Number.isFinite(animation.delay) ? animation.delay : 0;

  return {
    className: `live-rich-text--anim live-rich-text--anim-${preset}`,
    style: {
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      animationFillMode: 'both',
    },
  };
}
