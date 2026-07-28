import { type ReactNode } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface ExpandableCardProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  trailing?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const ExpandableCard = ({
  leading,
  title,
  subtitle,
  badges,
  trailing,
  expanded,
  onToggle,
  children,
}: ExpandableCardProps): ReactNode => (
  <div className="bg-card text-card-foreground rounded-lg shadow-sm">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center gap-3 p-3 text-left"
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        {subtitle != null ? (
          <div className="text-muted-foreground truncate text-sm">
            {subtitle}
          </div>
        ) : null}
        {badges != null ? (
          <div className="mt-1 flex flex-wrap gap-1 empty:hidden">{badges}</div>
        ) : null}
      </div>
      {trailing}
      <FiChevronDown
        className={`text-muted-foreground size-4 shrink-0 transition-transform ${
          expanded ? 'rotate-180' : ''
        }`}
      />
    </button>
    {expanded ? (
      <div className="flex flex-col gap-3 border-t p-3">{children}</div>
    ) : null}
  </div>
);
