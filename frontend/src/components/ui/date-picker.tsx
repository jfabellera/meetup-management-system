import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/** Parse a 'YYYY-MM-DD' form value as a local date (Date.parse reads it as UTC). */
const parseValue = (value: string): Date | undefined => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

interface DatePickerProps {
  id?: string;
  /** 'YYYY-MM-DD', or '' when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Fires when the popover closes, e.g. to mark a formik field touched. */
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/**
 * A calendar popover date field that speaks the 'YYYY-MM-DD' strings our
 * forms already use, so it drops in where <input type="date"> was.
 */
export const DatePicker = ({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  className,
}: DatePickerProps): ReactNode => {
  const [open, setOpen] = useState(false);
  const date = parseValue(value);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          data-empty={date == null}
          className={cn(
            'border-input hover:text-foreground bg-transparent hover:bg-transparent',
            'data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal',
            className
          )}
        >
          <CalendarIcon />
          {date != null ? format(date, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(selected) => {
            onChange(selected != null ? format(selected, 'yyyy-MM-dd') : '');
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
