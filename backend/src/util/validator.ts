import { z } from 'zod';

export const createMeetupSchema = z.object({
  name: z.string().min(3),
  date: z.string().datetime({
    offset: false,
    message: 'Datetime must be in the format of YYYY-MM-DDT:HH:mm:ssZ',
  }),
  address: z.string(),
  duration_hours: z.number().gt(0),
  has_raffle: z.boolean(),
  capacity: z.number().gt(0),
  image_url: z.string(),
  organizer_ids: z.array(z.number()).optional(),
});

export type CreateMeetupPayload = z.infer<typeof createMeetupSchema>;

export const editMeetupSchema = z.object({
  name: z.string().min(3).optional(),
  date: z
    .string()
    .datetime({
      offset: false,
      message: 'Datetime must be in the format of YYYY-MM-DDT:HH:mm:ssZ',
    })
    .optional(),
  address: z.string().optional(),
  duration_hours: z.number().gt(0).optional(),
  has_raffle: z.boolean().optional(),
  capacity: z.number().gt(0).optional(),
  image_url: z.string().optional(),
  organizer_ids: z.array(z.number()).optional(),
});

export type EditMeetupPayload = z.infer<typeof editMeetupSchema>;

export const createTicketSchema = z.object({
  meetup_id: z.number(),
  user_id: z.number(),
});

export type CreateTicketPayload = z.infer<typeof createTicketSchema>;

export const editTicketSchema = z.object({
  is_checked_in: z.boolean().optional(),
  raffle_entries: z.number().min(0).optional(),
  raffle_wins: z.number().min(0).optional(),
});

export type EditTicketPayload = z.infer<typeof editTicketSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  nick_name: z.string(),
  password: z.string(), // TODO(jan): check for password strength?
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  nick_name: z.string().optional(),
  password: z.string().optional(), // TODO(jan): check for password strength?
  is_organizer: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

export type EditUserPayload = z.infer<typeof editUserSchema>;
