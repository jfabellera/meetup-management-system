import JoiDate from '@joi/date';
import JoiBase from 'joi';
import passwordComplexity from 'joi-password-complexity';
import { z } from 'zod';

const Joi = JoiBase.extend(JoiDate);

const validator = (schema: JoiBase.Schema) => (payload: any) =>
  schema.validate(payload, { abortEarly: false });

export const meetupSchema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  date: Joi.date().format('YYYY-MM-DDTHH:mm:ss').required().raw(),
  organizer_ids: Joi.array()
    .items(Joi.number())
    .default([] as number[]),
  has_raffle: Joi.boolean().default(false),
  capacity: Joi.number().required(),
  duration_hours: Joi.number().required(),
  address_line_1: Joi.string().required(),
  address_line_2: Joi.string(),
  city: Joi.string().required(),
  state: Joi.string(),
  country: Joi.string().required(),
  postal_code: Joi.string().required(),
  utc_offset: Joi.number().default(0),
  image_url: Joi.string(),
});

const ticketSchema = Joi.object({
  id: Joi.number(),
  meetup_id: Joi.number().required(),
  user_id: Joi.number().required(),
  is_checked_in: Joi.boolean().default(false),
  raffle_entries: Joi.number().min(0).default(0),
  raffle_wins: Joi.number().min(0).default(0).max(Joi.ref('raffle_entries')),
});

const passwordComplexityOptions = {
  min: 3,
  max: 30,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
};

export const validatePassword = (
  password: string
): JoiBase.ValidationResult<string> => {
  if (password == null) {
    password = '';
  }
  return passwordComplexity(passwordComplexityOptions, '"password"').validate(
    password
  );
};

export const validateMeetup = validator(meetupSchema);
export const validateTicket = validator(ticketSchema);

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

export const createTicketSchema = z.object({
  meetup_id: z.number(),
  user_id: z.number(),
});

export type CreateTicketPayload = z.infer<typeof createTicketSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  nick_name: z.string(),
  password: z.string(), // TODO(jan): check for password strength?
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  nick_name: z.string().optional(),
  password: z.string().optional(), // TODO(jan): check for password strength?
  is_organizer: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

export type EditUserSchema = z.infer<typeof editUserSchema>;
