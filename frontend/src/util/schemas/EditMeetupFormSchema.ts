import { z } from 'zod';
import {
  optionalNumber,
  positiveNumber,
  priceError,
  requiredDate,
  requiredText,
} from './fields';

const sharedShape = {
  name: requiredText.min(3, 'Name must be at least 3 characters'),
  slug: requiredText,
  date: requiredDate,
  address: requiredText,
};

const ArchiveEditSchema = z.object(sharedShape);

const LiveEditSchema = z
  .object({
    ...sharedShape,
    startTime: requiredText,
    duration: positiveNumber,
    capacity: positiveNumber,
    isPaid: z.boolean(),
    price: optionalNumber,
  })
  .superRefine((values, ctx) => {
    const message = priceError(values);
    if (message != null) {
      ctx.addIssue({ code: 'custom', path: ['price'], message });
    }
  });

export const editMeetupFormSchema = (isArchive: boolean): z.ZodType =>
  isArchive ? ArchiveEditSchema : LiveEditSchema;
