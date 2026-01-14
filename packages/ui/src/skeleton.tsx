'use client';

import { cn } from '@countin/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-slate-200', className)}
      {...props}
    />
  );
}

export { Skeleton };
