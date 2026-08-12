import { cn } from '@/lib/utils';
import { focusField } from '@/util/focusField';
import { type FormikProps } from 'formik';
import { useEffect, useRef, type ReactNode } from 'react';

interface FormErrorSummaryProps<Values> {
  formik: FormikProps<Values>;
  /** Field labels, in the order the fields appear in the form. */
  labels: Partial<Record<keyof Values & string, string>>;
  className?: string;
}

interface SummaryEntry {
  name: string;
  label: string;
  message: string;
}

const humanize = (name: string): string => {
  const words = name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const collect = (
  errors: Record<string, unknown>,
  labels: Record<string, string | undefined>
): SummaryEntry[] => {
  const names = Object.keys(labels).concat(
    Object.keys(errors).filter((name) => !(name in labels))
  );

  return names.flatMap((name) => {
    const message = errors[name];
    return typeof message === 'string'
      ? [{ name, label: labels[name] ?? humanize(name), message }]
      : [];
  });
};

/**
 * Lists everything keeping a form from being submitted, so a field the user
 * never touched can't block them invisibly. Appears only once they try to
 * submit, and takes focus each time so the reason is where they just clicked.
 */
export const FormErrorSummary = <Values,>({
  formik,
  labels,
  className,
}: FormErrorSummaryProps<Values>): ReactNode => {
  const { submitCount, isValidating } = formik;
  const summaryRef = useRef<HTMLDivElement>(null);
  const announcedFor = useRef(0);

  const entries =
    submitCount === 0
      ? []
      : collect(
          formik.errors as Record<string, unknown>,
          labels as Record<string, string | undefined>
        );
  const count = entries.length;

  useEffect(() => {
    if (isValidating || count === 0 || announcedFor.current === submitCount) {
      return;
    }
    announcedFor.current = submitCount;
    summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    summaryRef.current?.focus({ preventScroll: true });
  }, [submitCount, isValidating, count]);

  if (count === 0) return null;

  return (
    <div
      ref={summaryRef}
      role="alert"
      tabIndex={-1}
      className={cn(
        'border-destructive/40 bg-destructive/5 text-destructive flex flex-col gap-2 rounded-md border p-3 text-sm outline-none',
        className
      )}
    >
      <p className="font-medium">
        {count === 1
          ? 'One field needs your attention'
          : `${count} fields need your attention`}
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {entries.map(({ name, label, message }) => (
          <li key={name}>
            <button
              type="button"
              className="cursor-pointer font-medium underline underline-offset-2"
              onClick={() => focusField(name)}
            >
              {label}
            </button>
            {`: ${message}`}
          </li>
        ))}
      </ul>
    </div>
  );
};
