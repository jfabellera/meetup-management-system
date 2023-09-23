import Joi from "joi";

const validator = (schema: Joi.Schema) => (payload: any) =>
    schema.validate(payload, { abortEarly: false });

const meetupSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string().required(),
    date: Joi.date().required(),
    organizer_ids: Joi.array().items(Joi.number()).min(1),
    has_raffle: Joi.boolean().default(false)
});

export const validateMeetup = validator(meetupSchema);
