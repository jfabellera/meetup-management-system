import { getIn, setIn } from 'formik';
import type { ZodType } from 'zod';

export const toFormikValidate =
  (schema: ZodType) =>
  (values: unknown): Record<string, string> => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    return result.error.issues.reduce<Record<string, string>>(
      (errors, issue) => {
        const path = issue.path.join('.');
        return getIn(errors, path) == null
          ? (setIn(errors, path, issue.message) as Record<string, string>)
          : errors;
      },
      {}
    );
  };
