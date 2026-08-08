import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { type TicketInfo } from '@keebmeet/shared';
import type React from 'react';
import { useState, type ReactNode } from 'react';
import { FiCheck } from 'react-icons/fi';

interface AttendeeSearchInputProps {
  attendees: TicketInfo[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (attendee: TicketInfo) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Same concept as UserSearchInput, but matches against the display names of a
 * meetup's attendees locally. Shows nothing until the visitor types, so the
 * attendee list is never browsable.
 */
export const AttendeeSearchInput = ({
  attendees,
  value,
  onChange,
  onSelect,
  id,
  placeholder = 'Start typing a display name…',
  disabled = false,
  autoFocus = false,
}: AttendeeSearchInputProps): ReactNode => {
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const query = value.trim().toLowerCase();
  const results =
    query.length < 2
      ? []
      : attendees.filter((attendee) =>
          attendee.ticket_holder_display_name.toLowerCase().includes(query)
        );
  const isListVisible = showResults && query.length >= 2 && results.length > 0;
  // The first option is focused by default so Enter selects it immediately;
  // clamp in case the results shrink under the current index.
  const focused = Math.min(focusedIndex, results.length - 1);

  const select = (attendee: TicketInfo): void => {
    onSelect(attendee);
    setShowResults(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (!isListVisible) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      select(results[focused]);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex(Math.min(results.length - 1, focused + 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex(Math.max(0, focused - 1));
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setShowResults(true);
          setFocusedIndex(0);
        }}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {isListVisible ? (
        <ul className="bg-popover absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 shadow-md">
          {results.map((attendee, index) => (
            <li
              key={attendee.id}
              ref={(el) => {
                if (index === focused) el?.scrollIntoView({ block: 'nearest' });
              }}
            >
              <button
                type="button"
                className={cn(
                  'hover:bg-accent flex w-full items-center gap-2 rounded-sm p-1.5 text-left text-sm',
                  index === focused ? 'bg-accent text-accent-foreground' : ''
                )}
                onClick={() => {
                  select(attendee);
                }}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {attendee.ticket_holder_display_name}
                </span>
                {attendee.is_checked_in ? (
                  <FiCheck className="shrink-0 text-green-600" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
