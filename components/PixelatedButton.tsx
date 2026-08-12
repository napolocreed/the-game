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
  const defaults = [
    has('bg') ? '' : 'bg-raised hover:bg-frame',
    has('text') ? '' : 'text-ink',
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
