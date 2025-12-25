import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 shadow-sm',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25 shadow-md',
                destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/25',
                outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground shadow-none',
                link: 'text-primary underline-offset-4 hover:underline shadow-none',
            },
            size: {
                default: 'h-11 px-6 py-2', /* קצת יותר גבוה לכפתור מודרני */
                sm: 'h-9 rounded-full px-3',
                lg: 'h-12 rounded-full px-8 text-base',
                icon: 'h-11 w-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = 'Button';

export { Button, buttonVariants };