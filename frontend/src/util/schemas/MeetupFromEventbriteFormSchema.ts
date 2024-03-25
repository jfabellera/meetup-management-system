import * as Yup from 'yup';

const MeetupFromEventbriteFormSchema = Yup.object().shape({
  organizationId: Yup.number().required(),
  eventId: Yup.number().required(),
  ticketClassId: Yup.number().required(),
  customQuestionId: Yup.number().required(),
  defaultRaffleEntries: Yup.number()
    .min(0, 'Must be non-negative')
    .required('Required'),
});

export default MeetupFromEventbriteFormSchema;
