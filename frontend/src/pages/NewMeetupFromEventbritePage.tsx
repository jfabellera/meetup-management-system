import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Text,
  VStack,
  type SelectProps,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import {
  type EventbriteEvent,
  type EventbriteOrganization,
  type EventbriteQuestion,
  type EventbriteTicket,
} from '../../../backend/src/interfaces/eventbriteInterfaces';
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
      organizationId: '',
      eventId: '',
      ticketClassId: '',
      customQuestionId: '',
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

  interface FormSelectProps extends SelectProps {
    name: string;
    id: string;
    options:
      | EventbriteOrganization[]
      | EventbriteEvent[]
      | EventbriteTicket[]
      | EventbriteQuestion[]
      | undefined;
  }

  const FormSelect = ({
    name,
    id,
    options,
    onChange,
    value,
  }: FormSelectProps): JSX.Element => {
    return (
      <FormControl id={id}>
        <FormLabel>{name}</FormLabel>
        <Select
          onChange={onChange}
          placeholder={'Select'}
          value={Number.isNaN(value) ? '' : value}
        >
          {options != null
            ? options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))
            : null}
        </Select>
      </FormControl>
    );
  };

  return (
    <Page>
      <VStack spacing={4} marginX={'0.5rem'} marginTop={'1rem'}>
        <Box textAlign={'center'}>
          <Heading>Create Meetup</Heading>
          <Text>From Eventbrite Event</Text>
        </Box>
        <Container
          padding={'1rem'}
          background={'white'}
          borderRadius={'md'}
          boxShadow={'sm'}
        >
          <form onSubmit={formik.handleSubmit} noValidate>
            <VStack spacing={4}>
              <FormSelect
                name={'Organization'}
                id={'organizationId'}
                options={organizations}
                value={formik.values.organizationId}
                onChange={formik.handleChange}
              />
              <FormSelect
                name={'Event'}
                id={'eventId'}
                options={events}
                value={formik.values.eventId}
                onChange={formik.handleChange}
              />
              <FormSelect
                name={'Ticket Class'}
                id={'ticketClassId'}
                options={ticketClasses}
                value={formik.values.ticketClassId}
                onChange={formik.handleChange}
              />
              <FormSelect
                name={'Custom Question'}
                id={'customQuestionId'}
                options={customQuestions}
                value={formik.values.customQuestionId}
                onChange={formik.handleChange}
              />
              <Button type={'submit'}>Submit</Button>
            </VStack>
          </form>
        </Container>
      </VStack>
    </Page>
  );
};

export default NewMeetupFromEventbritePage;
