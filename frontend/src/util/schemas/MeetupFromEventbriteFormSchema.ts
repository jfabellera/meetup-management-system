import * as Yup from 'yup';

const MeetupFromEventbriteFormSchema = Yup.object().shape({
  organizationId: Yup.string().required('Select an organization'),
  eventId: Yup.string().required('Select an event'),
  ticketClassId: Yup.string().required('Select a ticket class'),
  customQuestionId: Yup.string().required('Select a custom question'),
  defaultRaffleEntries: Yup.number()
    .min(0, 'Must be non-negative')
    .required('Required'),
});

export default MeetupFromEventbriteFormSchema;
