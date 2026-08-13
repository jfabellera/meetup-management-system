import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver, ResolverResult } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Resolves a form against a zod schema. `raw` keeps the caller's values intact:
 * the schemas validate a subset of each form, so parsed output would drop every
 * field they don't describe. `extraErrors` carries checks that live outside the
 * schema (server availability, captcha) and wins over it.
 */
export const zodFormResolver = <Values extends FieldValues>(
  schema: ZodType,
  extraErrors?: Record<string, string>
): Resolver<Values> => {
  const resolve = zodResolver(schema as never, undefined, {
    raw: true,
  }) as Resolver<Values>;

  if (extraErrors == null) return resolve;

  return async (values, context, options) => {
    const result = await resolve(values, context, options);
    const errors = {
      ...result.errors,
      ...Object.fromEntries(
        Object.entries(extraErrors).map(([name, message]) => [
          name,
          { type: 'manual', message },
        ])
      ),
    };

    return (
      Object.keys(errors).length > 0
        ? { values: {}, errors }
        : { values: result.values, errors: {} }
    ) as ResolverResult<Values>;
  };
};
