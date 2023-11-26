import JoiDate from '@joi/date';
import JoiBase from 'joi';
import passwordComplexity from 'joi-password-complexity';

const Joi = JoiBase.extend(JoiDate);

const validator = (schema: JoiBase.Schema) => (payload: any) =>
  schema.validate(payload, { abortEarly: false });

const userSchema = Joi.object({
  id: Joi.number(),
  email: Joi.string()
    .email({ tlds: { allow: false } }) // Less strict, allow any TLD to match frontend validation
    .required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  nick_name: Joi.string().required(),
  is_organizer: Joi.boolean().default(false),
  is_admin: Joi.boolean().default(false),
  password_hash: Joi.string().default(''),
});

const meetupSchema = Joi.object({
  id: Joi.number(),
  name: Joi.string().required(),
  date: Joi.date().format('YYYY-MM-DD').required().raw(),
  organizer_ids: Joi.array()
    .items(Joi.number())
    .default([] as number[]),
  has_raffle: Joi.boolean().default(false),
  capacity: Joi.number().required(),
  start_time: Joi.date().format('HH:mm:ss').required().raw(),
  duration_hours: Joi.number().required(),
  address_line_1: Joi.string().required(),
  address_line_2: Joi.string(),
  city: Joi.string().required(),
  state: Joi.string(),
  country: Joi.string().required(),
  postal_code: Joi.string().required(),
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

export const validatePassword = (password: string) => {
  return passwordComplexity(passwordComplexityOptions, '"password"').validate(
    password
  );
};

export const validateUser = validator(userSchema);
export const validateMeetup = validator(meetupSchema);
export const validateTicket = validator(ticketSchema);
