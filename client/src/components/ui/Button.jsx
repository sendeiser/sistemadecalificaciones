import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary:
    'bg-tech-cyan text-white hover:bg-tech-cyan/90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg',
  ghost:
    'bg-transparent text-tech-muted hover:bg-tech-surface/50 active:bg-tech-cyan active:text-white disabled:opacity-50',
  danger:
    'bg-tech-danger text-white hover:bg-tech-danger/90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100',
};

const sizes = {
  sm: 'h-10 px-4 text-[0.625rem] font-black tracking-[0.2em] uppercase',
  md: 'h-12 px-8 text-[0.625rem] font-black tracking-[0.2em] uppercase',
  lg: 'h-14 px-10 text-[0.75rem] font-black tracking-[0.2em] uppercase',
};

const Button = forwardRef(({ className, variant = 'primary', size = 'md', children, shine, ...props }, ref) => (
  <button
    ref={ref}
    className={twMerge(
      clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 select-none cursor-pointer relative overflow-hidden',
        variants[variant],
        sizes[size],
      ),
      className,
    )}
    {...props}
  >
    {shine && variant === 'primary' && (
      <span className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    )}
    {children}
  </button>
));

Button.displayName = 'Button';
export default Button;
