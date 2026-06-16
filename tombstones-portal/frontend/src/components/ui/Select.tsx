import { cn } from '@/lib/utils';

export function Select({
  value,
  onChange,
  children,
  className,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </select>
  );
}
