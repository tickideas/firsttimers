import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn.js';
import type { ButtonHTMLAttributes } from 'react';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-600',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400',
        ghost: 'bg-transparent text-slate-900 hover:bg-slate-100'
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-6'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export const Button = ({ className, variant, size, ...props }: ButtonProps) => (
  <button className={cn(buttonStyles({ variant, size }), className)} {...props} />
);
