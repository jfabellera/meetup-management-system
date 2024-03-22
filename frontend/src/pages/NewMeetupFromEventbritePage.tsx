import { Button, Select } from '@chakra-ui/react';
import { useFormik } from 'formik';
import Page from '../components/Page/Page';
import {
  useGetCustomQuestionsQuery,
  useGetEventsQuery,
  useGetOrganizationsQuery,
  useGetTicketClassesQuery,
} from '../store/eventbriteSlice';
import { useCreateMeetupFromEventbriteMutation } from '../store/meetupSlice';

const NewMeetupFromEventbritePage = (): JSX.Element => {
  const formik = useFormik({
    initialValues: {
      organizationId: NaN,
      eventId: NaN,
      ticketClassId: NaN,
      customQuestionId: NaN,
      hasRaffle: false,
    },
    onSubmit: async (values) => {
      if (
        Number.isNaN(values.eventId) ||
        Number.isNaN(values.ticketClassId) ||
        Number.isNaN(values.customQuestionId)
      ) {
        console.log('invalid');
        return;
      }

      console.log(values);

      await createMeetupFromEventbrite({
        eventbrite_event_id: Number(values.eventId),
        eventbrite_ticket_id: Number(values.ticketClassId),
        eventbrite_question_id: Number(values.customQuestionId),
        has_raffle: values.hasRaffle,
      });
    },
  });

  const { data: organizations } = useGetOrganizationsQuery();
  const { data: events } = useGetEventsQuery(
    Number(formik.values.organizationId),
    {
      skip: Number.isNaN(formik.values.organizationId),
    }
  );
  const { data: ticketClasses } = useGetTicketClassesQuery(
    Number(formik.values.eventId),
    {
      skip: Number.isNaN(formik.values.eventId),
    }
  );
  const { data: customQuestions } = useGetCustomQuestionsQuery(
    Number(formik.values.eventId),
    {
      skip: Number.isNaN(formik.values.eventId),
    }
  );
  const [createMeetupFromEventbrite] = useCreateMeetupFromEventbriteMutation();

  return (
    <Page>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Select
          id={'organizationId'}
          onChange={formik.handleChange}
          placeholder={'Select organization'}
        >
          {organizations != null
            ? organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))
            : null}
        </Select>
        <Select
          id={'eventId'}
          onChange={formik.handleChange}
          placeholder={'Select event'}
        >
          {events != null
            ? events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))
            : null}
        </Select>
        <Select
          id={'ticketClassId'}
          onChange={formik.handleChange}
          placeholder={'Select ticket class'}
        >
          {ticketClasses != null
            ? ticketClasses.map((ticketClass) => (
                <option key={ticketClass.id} value={ticketClass.id}>
                  {ticketClass.name}
                </option>
              ))
            : null}
        </Select>
        <Select
          id={'customQuestionId'}
          onChange={formik.handleChange}
          placeholder={'Select display name question'}
        >
          {customQuestions != null
            ? customQuestions.map((customQuestion) => (
                <option key={customQuestion.id} value={customQuestion.id}>
                  {customQuestion.name}
                </option>
              ))
            : null}
        </Select>
        <Button type={'submit'}>Submit</Button>
      </form>
    </Page>
  );
};

export default NewMeetupFromEventbritePage;
