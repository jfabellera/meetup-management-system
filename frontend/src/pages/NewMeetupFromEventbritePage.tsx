import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormErrorSummary } from '@/components/ui/form-error-summary';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  type EventbriteEvent,
  type EventbriteOrganization,
  type EventbriteQuestion,
  type EventbriteTicket,
} from '@keebmeet/shared';
import { type ReactNode } from 'react';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '../components/Page/Page';
import BackButton from '../components/shared/BackButton';
import {
  useGetCustomQuestionsQuery,
  useGetEventsQuery,
  useGetOrganizationsQuery,
  useGetTicketClassesQuery,
} from '../store/eventbriteSlice';
import { useAppSelector } from '../store/hooks';
import { useCreateMeetupFromEventbriteMutation } from '../store/meetupSlice';
import { useGetUserQuery } from '../store/userSlice';
import MeetupFromEventbriteFormSchema from '../util/schemas/MeetupFromEventbriteFormSchema';
import { zodFormResolver } from '../util/zodFormResolver';

const DEFAULT_RAFFLE_ENTRIES = 1;

const FIELD_LABELS = {
  organizationId: 'Organization',
  eventId: 'Event',
  ticketClassId: 'Ticket class',
  customQuestionId: 'Custom question',
  defaultRaffleEntries: 'Default raffle entries',
};

interface FormValues {
  organizationId: string;
  eventId: string;
  ticketClassId: string;
  customQuestionId: string;
  hasRaffle: boolean;
  defaultRaffleEntries: number;
}

type SelectFieldName =
  | 'organizationId'
  | 'eventId'
  | 'ticketClassId'
  | 'customQuestionId';

interface FormSelectProps {
  control: Control<FormValues>;
  name: SelectFieldName;
  label: string;
  options:
    | EventbriteOrganization[]
    | EventbriteEvent[]
    | EventbriteTicket[]
    | EventbriteQuestion[]
    | undefined;
  disabled?: boolean;
}

const FormSelect = ({
  control,
  name,
  label,
  options,
  disabled,
}: FormSelectProps): ReactNode => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="w-full">
        <FormLabel>{label}</FormLabel>
        <Select
          value={field.value}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <FormControl>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

const NewMeetupFromEventbritePage = (): ReactNode => {
  const navigate = useNavigate();
  const { user: localUser } = useAppSelector((state) => state.user);
  const { data: user } = useGetUserQuery(localUser?.id ?? '', {
    skip: localUser == null,
  });
  const isEventbriteLinked = user?.is_eventbrite_linked === true;
  const [createMeetupFromEventbrite, { isLoading }] =
    useCreateMeetupFromEventbriteMutation();

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(MeetupFromEventbriteFormSchema),
    defaultValues: {
      organizationId: '',
      eventId: '',
      ticketClassId: '',
      customQuestionId: '',
      hasRaffle: true,
      defaultRaffleEntries: DEFAULT_RAFFLE_ENTRIES,
    },
  });

  const organizationId = useWatch({
    control: form.control,
    name: 'organizationId',
  });
  const eventId = useWatch({ control: form.control, name: 'eventId' });
  const hasRaffle = useWatch({ control: form.control, name: 'hasRaffle' });

  const { data: organizations } = useGetOrganizationsQuery(undefined, {
    skip: !isEventbriteLinked,
  });
  const { data: events } = useGetEventsQuery(organizationId, {
    skip: organizationId === '',
  });
  const { data: ticketClasses } = useGetTicketClassesQuery(eventId, {
    skip: eventId === '',
  });
  const { data: customQuestions } = useGetCustomQuestionsQuery(eventId, {
    skip: eventId === '',
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
    const response = await createMeetupFromEventbrite({
      eventbrite_event_id: values.eventId,
      eventbrite_ticket_id: values.ticketClassId,
      eventbrite_question_id: values.customQuestionId,
      has_raffle: values.hasRaffle,
      default_raffle_entries: values.hasRaffle
        ? values.defaultRaffleEntries
        : DEFAULT_RAFFLE_ENTRIES,
    });

    if ('error' in response) {
      const data =
        response.error != null && 'data' in response.error
          ? (response.error.data as { message?: string } | undefined)
          : undefined;
      toast.error('Error', {
        description: data?.message ?? 'Unable to create meetup',
      });
    } else {
      toast.success('Success', {
        description: 'Meetup created successfully',
      });
      void navigate('/organizer');
    }
  };

  return (
    <Page>
      <div className="mx-2 mt-4 flex flex-col items-center gap-4">
        <div className="relative flex w-full max-w-md items-center justify-center">
          <BackButton
            to="/organizer"
            label="Back to organizer dashboard"
            className="absolute left-0"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold">New Meetup</h1>
            <p>From Eventbrite Event</p>
          </div>
        </div>
        <div className="bg-card text-card-foreground w-full max-w-md rounded-lg p-8 shadow-lg">
          <Form {...form}>
            <form
              onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
              noValidate
            >
              <div className="flex flex-col items-center gap-4">
                <span
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer self-end underline"
                  onClick={() => {
                    void navigate('/new-meetup');
                  }}
                >
                  Use native
                </span>
                {!isEventbriteLinked ? (
                  <p>
                    Please connect your Eventbrite account in your{' '}
                    <Link to="/account" className="text-primary underline">
                      account settings
                    </Link>{' '}
                    to create a meetup from an Eventbrite event.
                  </p>
                ) : (
                  <>
                    <FormSelect
                      control={form.control}
                      name="organizationId"
                      label="Organization"
                      options={organizations}
                    />
                    <FormSelect
                      control={form.control}
                      name="eventId"
                      label="Event"
                      options={events}
                      disabled={events == null}
                    />
                    <FormSelect
                      control={form.control}
                      name="ticketClassId"
                      label="Ticket Class"
                      options={ticketClasses}
                      disabled={ticketClasses == null}
                    />
                    <FormSelect
                      control={form.control}
                      name="customQuestionId"
                      label="Custom Question"
                      options={customQuestions}
                      disabled={customQuestions == null}
                    />

                    <FormField
                      control={form.control}
                      name="hasRaffle"
                      render={({ field }) => (
                        <div className="flex w-full items-center gap-2">
                          <Label htmlFor="hasRaffle" className="pr-4">
                            Will this meetup have raffles?
                          </Label>
                          <Checkbox
                            id="hasRaffle"
                            name={field.name}
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked === true)
                            }
                          />
                          <span>Yes</span>
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultRaffleEntries"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>
                            Default raffle entries per attendee
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              disabled={!hasRaffle}
                              {...field}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.value === ''
                                    ? ''
                                    : event.target.valueAsNumber
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormErrorSummary<FormValues>
                      labels={FIELD_LABELS}
                      className="w-full"
                    />
                    <Button type={'submit'} disabled={isLoading}>
                      Submit
                      {isLoading && <Spinner />}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Page>
  );
};

export default NewMeetupFromEventbritePage;
