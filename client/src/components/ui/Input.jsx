import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ className, label, error, icon: Icon, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-[0.625rem] font-black tracking-[0.2em] uppercase text-tech-muted ml-1 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tech-muted group-focus-within:text-tech-cyan transition-colors duration-200 pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={twMerge(
          clsx(
            'w-full h-12 bg-tech-primary/50 border border-tech-surface rounded-xl px-4 text-tech-text placeholder:text-tech-muted/40',
            'transition-all duration-200 outline-none',
            'focus:border-tech-cyan focus:ring-2 focus:ring-tech-cyan/20',
            'file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[0.625rem] file:font-black file:tracking-[0.2em] file:uppercase file:bg-tech-cyan file:text-white file:cursor-pointer',
            Icon && 'pl-12',
            error && 'border-tech-danger focus:border-tech-danger focus:ring-tech-danger/20',
          ),
          className,
        )}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-tech-danger flex items-center gap-1">
        {error}
      </p>
    )}
  </div>
));

Input.displayName = 'Input';
export default Input;
