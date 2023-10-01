import Joi from "joi";

const validator = (schema: Joi.Schema) => (payload: any) =>
    schema.validate(payload, { abortEarly: false });

const userSchema = Joi.object({
    id: Joi.number(),
    email: Joi.string().email().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    nick_name: Joi.string().required(),
    is_organizer: Joi.boolean().default(false),
    is_admin: Joi.boolean().default(false),
    password_hash: Joi.string().default('')
});

const meetupSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string().required(),
    date: Joi.date().required(),
    organizer_ids: Joi.array().items(Joi.number()).min(1),
    has_raffle: Joi.boolean().default(false)
});

const ticketSchema = Joi.object({
    id: Joi.number(),
    meetup_id: Joi.number().required(),
    user_id: Joi.number().required(),
    is_checked_in: Joi.boolean().default(false),
    raffle_entries: Joi.number().min(0).default(0),
    raffle_wins: Joi.number().min(0).default(0).max(Joi.ref('raffle_entries'))
});

export const validateUser = validator(userSchema);
export const validateMeetup = validator(meetupSchema);
export const validateTicket = validator(ticketSchema);
