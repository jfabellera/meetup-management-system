import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { type IconType } from 'react-icons';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';

const themes: Array<{ value: string; label: string; icon: IconType }> = [
  { value: 'light', label: 'Light', icon: FiSun },
  { value: 'dark', label: 'Dark', icon: FiMoon },
  { value: 'system', label: 'System', icon: FiMonitor },
];

export function ModeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <FiSun className="size-5 dark:hidden" />
          <FiMoon className="hidden size-5 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Theme resolves on mount, so fall back to the provider's default. */}
        <DropdownMenuRadioGroup
          value={theme ?? 'system'}
          onValueChange={setTheme}
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="cursor-pointer"
            >
              <Icon className="size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
