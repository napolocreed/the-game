import React from 'react';

interface PixelatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isIconOnly?: boolean;
}

/**
 * Callers routinely override the colour of this button ("I have an urge" is
 * green, "Delete" is red). Tailwind resolves two utilities of the same
 * property by their order in the generated stylesheet, not by their order in
 * the class string, so shipping an unconditional `bg-raised` here would
 * silently win over some callers and lose to others. Dropping each default
 * only when the caller supplies its own makes the override deterministic
 * without pulling in a class-merging dependency.
 */
const PixelatedButton: React.FC<PixelatedButtonProps> = ({ children, className = '', isIconOnly = false, ...props }) => {
  const paddingClasses = isIconOnly
    ? 'p-3 md:px-4 md:py-2'
    : 'px-4 py-2';

  const has = (prefix: string) => new RegExp(`(^|\\s)(hover:|active:|disabled:)?${prefix}-`).test(className);
  // `text-` is the one prefix that is not a colour namespace: `text-xs` and
  // `text-center` live there too, and treating them as a colour override drops
  // `text-ink` and leaves the label inheriting whatever the page happens to be.
  const NON_COLOUR_TEXT = /^(xs|sm|base|lg|\d?xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|opacity)$/;
  const hasTextColour = className
    .split(/\s+/)
    .some(c => {
      const m = /^(?:hover:|active:|disabled:)?text-(.+)$/.exec(c);
      if (!m) return false;
      // Arbitrary values are a colour only when they look like one.
      if (m[1].startsWith('[')) return /^\[(#|rgb|hsl|var\()/.test(m[1]);
      return !NON_COLOUR_TEXT.test(m[1]);
    });
  const defaults = [
    has('bg') ? '' : 'bg-raised hover:bg-frame',
    hasTextColour ? '' : 'text-ink',
    has('border') ? '' : 'border-frame',
    has('shadow') ? '' : 'shadow-hard-sm hover:shadow-hard-xs',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={`
        ${paddingClasses}
        border-4
        ${defaults}
        hover:translate-x-0.5 hover:translate-y-0.5
        active:shadow-none active:translate-x-1 active:translate-y-1
        disabled:bg-frame-dim disabled:text-ink-faint disabled:border-frame-dim
        disabled:shadow-hard-sm
        disabled:cursor-not-allowed
        disabled:hover:translate-x-0 disabled:hover:translate-y-0
        transition-all duration-100 ease-in-out
        flex items-center justify-center
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default PixelatedButton;
