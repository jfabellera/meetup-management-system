import { cn } from '@/lib/utils';

function AspectRatio({
  ratio = 1,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { ratio?: number }): React.JSX.Element {
  return (
    <div
      data-slot="aspect-ratio"
      className="relative w-full"
      style={{ paddingBottom: `${100 / ratio}%` }}
    >
      <div className={cn('absolute inset-0', className)} {...props}>
        {children}
      </div>
    </div>
  );
}

export { AspectRatio };
