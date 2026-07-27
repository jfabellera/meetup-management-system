import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';
import { FiClock } from 'react-icons/fi';
import { useHoldCountdown } from '../../hooks/useHoldCountdown';

export const HoldCountdown = ({
  holdExpiresAt,
  className,
}: {
  holdExpiresAt: string;
  className?: string;
}): ReactNode => {
  const countdown = useHoldCountdown(holdExpiresAt);
  if (countdown == null) return null;
  const { expired, urgent, minutes, seconds } = countdown;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
        expired || urgent
          ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        className
      )}
    >
      <FiClock className="mt-0.5 size-4 shrink-0" />
      {expired ? (
        <span>
          Time is up, and your spot has been released to others. If there's
          still room, you're welcome to try again.
        </span>
      ) : (
        <span>
          Your spot is reserved for{' '}
          <span className="font-mono font-semibold">
            {String(minutes).padStart(2, '0')}:{seconds}
          </span>
          . If not paid in time, it will be released to others.
        </span>
      )}
    </div>
  );
};
