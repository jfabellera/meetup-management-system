import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter } from 'lucide-react';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useIsMobile } from '../hooks/use-mobile';
import { ExpandableSearch } from './ExpandableSearch';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  sortLabel?: string;
  align?: 'center' | 'right';
  headClassName?: string;
  cellClassName?: string;
}

interface DataTableFilter<T> {
  label: string;
  options: Array<{
    value: string;
    label: string;
    predicate: (row: T) => boolean;
  }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: Array<DataTableColumn<T>>;
  getRowId: (row: T) => string;
  title?: ReactNode;
  headerActions?: ReactNode;
  renderCard: (
    row: T,
    state: { expanded: boolean; toggle: () => void }
  ) => ReactNode;
  search?: { placeholder?: string; getText: (row: T) => string };
  filter?: DataTableFilter<T>;
  initialSort?: { columnId: string; direction: SortDirection };
  onRowClick?: (row: T) => void;
  emptyMessage?: ReactNode | ((ctx: { hasRows: boolean }) => ReactNode);
}

const alignClass = (align?: 'center' | 'right'): string =>
  align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';

const joinClasses = (...parts: Array<string | undefined>): string | undefined =>
  parts.filter((part) => part != null && part !== '').join(' ') || undefined;

const SortPopover = ({
  columns,
  sort,
  onToggle,
}: {
  columns: Array<{ id: string; label: string }>;
  sort: { columnId: string; direction: SortDirection } | null;
  onToggle: (columnId: string) => void;
}): ReactNode => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Sort">
          <ArrowUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="p-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            Sort by
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto border-t p-1">
          {columns.map((column) => {
            const active = sort?.columnId === column.id;
            return (
              <button
                key={column.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(column.id)}
                className="hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors"
              >
                <span className={cn('flex-1 truncate', active && 'font-bold')}>
                  {column.label}
                </span>
                {active ? (
                  sort?.direction === 'asc' ? (
                    <ArrowUp className="size-4 shrink-0" />
                  ) : (
                    <ArrowDown className="size-4 shrink-0" />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// A multi-select checkbox popover for the filter control. Selected options are
// AND-combined by the table; the count is surfaced on the trigger.
const FilterPopover = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}): ReactNode => {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(selected);
  const count = selected.length;

  const toggle = (value: string): void => {
    onChange(
      selectedSet.has(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={count > 0 ? 'default' : 'ghost'}
          size="sm"
          className="gap-2"
          aria-label={label}
        >
          <ListFilter />
          {count > 0 ? <span>{count}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex items-center justify-between p-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            {label}
          </span>
          {count > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="max-h-72 overflow-y-auto border-t p-1">
          {options.map((option) => {
            const isSelected = selectedSet.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(option.value)}
                className="hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors"
              >
                <Checkbox checked={isSelected} tabIndex={-1} />
                <span
                  className={cn('flex-1 truncate', isSelected && 'font-medium')}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  title,
  headerActions,
  renderCard,
  search,
  filter,
  initialSort,
  onRowClick,
  emptyMessage = 'No results.',
}: DataTableProps<T>): ReactNode {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sort, setSort] = useState<{
    columnId: string;
    direction: SortDirection;
  } | null>(initialSort ?? null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = (columnId: string): void => {
    setSort((prev) =>
      prev?.columnId === columnId
        ? { columnId, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId, direction: 'asc' }
    );
  };

  const rows = useMemo(() => {
    const all = data ?? [];
    const q = query.trim().toLowerCase();
    const activePredicates =
      filter != null
        ? filter.options
            .filter((option) => filter.selected.includes(option.value))
            .map((option) => option.predicate)
        : [];
    const filtered = all.filter((row) => {
      if (!activePredicates.every((predicate) => predicate(row))) return false;
      return (
        search == null ||
        q === '' ||
        search.getText(row).toLowerCase().includes(q)
      );
    });

    const column =
      sort != null ? columns.find((c) => c.id === sort.columnId) : undefined;
    if (sort == null || column?.sortValue == null) return filtered;

    const getValue = column.sortValue;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const primary =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, {
              sensitivity: 'base',
            });
      return primary * direction;
    });
  }, [data, query, sort, columns, search, filter]);

  const sortColumns = columns
    .filter((column) => column.sortValue != null)
    .map((column) => ({ id: column.id, label: column.sortLabel ?? column.id }));

  const hasControls =
    search != null || filter != null || sortColumns.length > 0;

  const hasRows = (data ?? []).length > 0;
  const empty =
    rows.length === 0 ? (
      <p className="text-muted-foreground p-4 text-center text-sm">
        {typeof emptyMessage === 'function'
          ? emptyMessage({ hasRows })
          : emptyMessage}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {title != null || headerActions != null || hasControls ? (
        <div className="flex items-center justify-between gap-2">
          {title != null ? (
            <h2 className="min-w-0 truncate text-2xl font-semibold">{title}</h2>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            {search != null ? (
              <ExpandableSearch
                value={query}
                onChange={setQuery}
                placeholder={search.placeholder ?? 'Search…'}
                label={search.placeholder ?? 'Search'}
                expanded={searchExpanded}
                onExpandedChange={setSearchExpanded}
                expandInline={!isMobile}
              />
            ) : null}
            {filter != null ? (
              <FilterPopover
                label={filter.label}
                options={filter.options}
                selected={filter.selected}
                onChange={filter.onChange}
              />
            ) : null}
            {sortColumns.length > 0 ? (
              <SortPopover
                columns={sortColumns}
                sort={sort}
                onToggle={toggleSort}
              />
            ) : null}
            {headerActions}
          </div>
        </div>
      ) : null}

      {/* On mobile the search opens as its own full-width row instead of
          cramping into the header. */}
      {isMobile && searchExpanded && search != null ? (
        <ExpandableSearch
          fullWidth
          value={query}
          onChange={setQuery}
          placeholder={search.placeholder ?? 'Search…'}
          label={search.placeholder ?? 'Search'}
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
        />
      ) : null}

      {/* Desktop: dense, sortable table. */}
      <div className="bg-card text-card-foreground hidden rounded-lg p-2 shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const active = sort?.columnId === column.id;
                return (
                  <TableHead
                    key={column.id}
                    className={joinClasses(
                      alignClass(column.align),
                      column.headClassName
                    )}
                  >
                    {column.sortValue != null ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        aria-label={`Sort by ${column.sortLabel ?? column.id}`}
                        className={joinClasses(
                          'hover:text-foreground inline-flex items-center gap-1 transition-colors',
                          column.align === 'center' ? 'mx-auto' : undefined,
                          active ? 'text-foreground' : undefined
                        )}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === 'asc' ? (
                            <FiChevronUp className="size-3.5" />
                          ) : (
                            <FiChevronDown className="size-3.5" />
                          )
                        ) : (
                          <FiChevronDown className="size-3.5 opacity-30" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getRowId(row)}
                className={
                  onRowClick != null
                    ? 'hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors'
                    : undefined
                }
                onClick={onRowClick != null ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={joinClasses(
                      alignClass(column.align),
                      column.cellClassName
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {empty}
      </div>

      {/* Mobile: one card per row. */}
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => {
          const id = getRowId(row);
          return (
            <Fragment key={id}>
              {renderCard(row, {
                expanded: expandedId === id,
                toggle: () =>
                  setExpandedId((prev) => (prev === id ? null : id)),
              })}
            </Fragment>
          );
        })}
        {empty}
      </div>
    </div>
  );
}
