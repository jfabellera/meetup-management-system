import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

interface ExpandableSearchProps {
  value: string;
  onChange: (value: string) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  placeholder?: string;
  label?: string;
  expandInline?: boolean;
  fullWidth?: boolean;
}

/**
 * A search field that collapses to a single icon button and expands inline on
 * demand, collapsing again on blur when empty.
 */
export const ExpandableSearch = ({
  value,
  onChange,
  expanded,
  onExpandedChange,
  placeholder = 'Search',
  label = 'Search',
  expandInline = false,
  fullWidth = false,
}: ExpandableSearchProps): ReactNode => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [animatingOut, setAnimatingOut] = useState(false);

  const collapse = (): void => {
    setAnimatingOut(true);
  };

  if (!fullWidth && !(expanded && expandInline) && !animatingOut) {
    if (expanded) {
      return null;
    }
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        onClick={() => {
          onExpandedChange(true);
        }}
      >
        <Search />
      </Button>
    );
  }

  return (
    <InputGroup
      className={
        fullWidth
          ? animatingOut
            ? 'bg-background animate-out fade-out slide-out-to-top-1 fill-mode-forwards w-full'
            : 'bg-background animate-in fade-in slide-in-from-top-1 w-full'
          : animatingOut
            ? 'bg-background animate-out fade-out slide-out-to-right-2 fill-mode-forwards h-8 w-48'
            : 'bg-background animate-in fade-in slide-in-from-right-2 h-8 w-48'
      }
      onAnimationEnd={() => {
        if (animatingOut) {
          setAnimatingOut(false);
          onExpandedChange(false);
        }
      }}
    >
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={() => {
          if (value.trim() !== '') {
            return;
          }
          requestAnimationFrame(() => {
            if (document.activeElement !== inputRef.current) {
              collapse();
            }
          });
        }}
      />
      <InputGroupButton
        // Clear and focus the input so the user can keep typing
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => {
          onChange('');
          inputRef.current?.focus();
        }}
        className="hover:bg-transparent"
      >
        <X />
      </InputGroupButton>
    </InputGroup>
  );
};
