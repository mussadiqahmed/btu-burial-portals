import { cn } from '@/lib/utils';
import { PORTAL_LOGO } from '@/lib/brand';

type PortalLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 36,
  md: 56,
  lg: 72,
};

export function PortalLogo({ size = 'md', className }: PortalLogoProps) {
  const px = sizes[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PORTAL_LOGO}
      alt="B.T.U Burial Society"
      width={px}
      height={px}
      className={cn('rounded-xl object-contain bg-white/95 p-0.5', className)}
    />
  );
}
