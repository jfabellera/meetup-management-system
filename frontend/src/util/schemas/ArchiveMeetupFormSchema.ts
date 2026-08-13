import { z } from 'zod';
import { pastDate, requiredText } from './fields';

/**
 * Validation for the archive-meetup form. Unlike a live meetup, an archive
 * records a *past* event and has no capacity/duration/raffle. The submitter
 * always owns it; `organizerType` records who ran it. It has no default, so
 * crediting is a deliberate choice rather than a silent self-attribution; when
 * someone else ran it, an organizer name is required.
 */
const ArchiveMeetupFormSchema = z
  .object({
    name: requiredText.min(3, 'Name must be at least 3 characters'),
    slug: requiredText,
    date: pastDate,
    address: requiredText,
    imageKey: z.string().optional(),
    organizerType: z.enum(['me', 'other'], {
      error: 'Select who organized this meetup',
    }),
    organizerName: z.string().max(30, 'Name must be at most 30 characters'),
  })
  .refine(
    (values) =>
      values.organizerType !== 'other' || values.organizerName !== '',
    { path: ['organizerName'], message: 'Enter who organized this meetup' }
  );

export default ArchiveMeetupFormSchema;
