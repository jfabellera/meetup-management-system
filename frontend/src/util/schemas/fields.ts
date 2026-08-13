import { z } from 'zod';

const emptyToUndefined = (value: unknown): unknown =>
  value === '' ? undefined : value;

export const requiredText = z.string().min(1, 'Required');

export const positiveNumber = z.preprocess(
  emptyToUndefined,
  z.number({ error: 'Required' }).gt(0, 'Must be greater than 0')
);

export const nonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.number({ error: 'Required' }).min(0, 'Must be non-negative')
);

export const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.number().optional()
);

export const requiredDate = requiredText.refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'Required'
);

export const futureDate = requiredDate.refine(
  (value) => new Date(value) > new Date(),
  'Date must be in the future'
);

export const pastDate = requiredDate.refine(
  (value) => new Date(value) < new Date(),
  'Date must be in the past'
);

export const priceError = (values: {
  isPaid: boolean;
  price?: number;
}): string | null => {
  if (values.isPaid) {
    if (typeof values.price !== 'number') return 'Required';
    if (values.price <= 0) return 'Must be greater than 0';
  } else if (typeof values.price === 'number' && values.price < 0) {
    return 'Must be non-negative';
  }
  return null;
};
