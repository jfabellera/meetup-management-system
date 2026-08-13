import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormErrorSummary } from '@/components/ui/form-error-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { SLUG_REGEX, slugify } from '@keebmeet/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AddressCombobox from '../components/Meetups/AddressCombobox';
import GroupCombobox from '../components/Meetups/GroupCombobox';
import MeetupFormSection from '../components/Meetups/MeetupFormSection';
import MeetupImageField from '../components/Meetups/MeetupImageField';
import OrganizerCombobox from '../components/Meetups/OrganizerCombobox';
import TagCombobox from '../components/Meetups/TagCombobox';
import {
  UNLISTED_GROUPS_DESCRIPTION,
  UNLISTED_SLUG_NOTE,
} from '../components/Meetups/unlistedCopy';
import VenueNameLabel from '../components/Meetups/VenueNameLabel';
import Page from '../components/Page/Page';
import BackButton from '../components/shared/BackButton';
import { usePendingUploads } from '../hooks/usePendingUploads';
import {
  useCheckSlugAvailableQuery,
  useCreateMeetupMutation,
} from '../store/meetupSlice';
import MeetupFormSchema from '../util/schemas/MeetupFormSchema';
import { zodFormResolver } from '../util/zodFormResolver';

const DEFAULT_RAFFLE_ENTRIES = 1;

const FIELD_LABELS = {
  name: 'Meetup name',
  slug: 'URL slug',
  date: 'Date',
  startTime: 'Start time',
  address: 'Address',
  duration: 'Duration',
  capacity: 'Capacity',
  price: 'Ticket price',
  defaultRaffleEntries: 'Default raffle entries',
};

interface FormValues {
  name: string;
  slug: string;
  date: string;
  startTime: string;
  address: string;
  venueName: string;
  duration: number;
  capacity: number;
  isPaid: boolean;
  price: number;
  imageUrl: string;
  imageKey: string;
  description: string;
  hasRaffle: boolean;
  defaultRaffleEntries: number;
  isUnlisted: boolean;
  organizerIds: string[];
  groupIds: string[];
  tagIds: string[];
}

const NewMeetupPage = (): ReactNode => {
  const [createMeetup, { isLoading }] = useCreateMeetupMutation();
  const { isUploading, onUploadingChange } = usePendingUploads();
  const currentUserId = useAppSelector((state) => state.user.user?.id);
  const navigate = useNavigate();
  // Track whether the user edited the slug so name changes stop overwriting it.
  const [slugEdited, setSlugEdited] = useState(false);
  // Submit intent rather than form data, so the two buttons share one submit.
  const saveAsDraft = useRef(false);
  // The slug is checked against the server, so it validates outside the schema.
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    mode: 'onTouched',
    resolver: zodFormResolver<FormValues>(MeetupFormSchema, extraErrors),
    defaultValues: {
      name: '',
      slug: '',
      date: '',
      // Real default rather than '': Safari renders an empty time input with
      // filled-looking segments, so users can't tell it still needs input.
      startTime: '12:00',
      address: '',
      venueName: '',
      duration: 0,
      capacity: 0,
      isPaid: false,
      price: 0,
      imageUrl: '',
      imageKey: '',
      description: '',
      hasRaffle: true,
      defaultRaffleEntries: DEFAULT_RAFFLE_ENTRIES,
      isUnlisted: false,
      organizerIds: [],
      groupIds: [],
      tagIds: [],
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });
  const slug = useWatch({ control: form.control, name: 'slug' });
  const isUnlisted = useWatch({ control: form.control, name: 'isUnlisted' });
  const isPaid = useWatch({ control: form.control, name: 'isPaid' });
  const hasRaffle = useWatch({ control: form.control, name: 'hasRaffle' });
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' });

  // Auto-fill the slug from the name until the user edits it directly.
  useEffect(() => {
    if (!slugEdited) {
      form.setValue('slug', slugify(name));
    }
  }, [name, slugEdited, form]);

  const slugValid = SLUG_REGEX.test(slug);
  const { data: slugCheck } = useCheckSlugAvailableQuery(
    { slug },
    { skip: !slugValid }
  );
  const slugTaken = slugValid && slugCheck?.available === false;
  const slugError =
    slug !== '' && !slugValid
      ? 'Lowercase letters, numbers, and hyphens only'
      : slugTaken
        ? 'That URL is already taken'
        : undefined;
  useEffect(() => {
    setExtraErrors(slugError != null ? { slug: slugError } : {});
  }, [slugError]);

  const submitDisabled = isLoading || isUploading;

  const onSubmit = async (values: FormValues): Promise<void> => {
    const result = await createMeetup({
      name: values.name,
      slug: values.slug,
      date: new Date(`${values.date}T${values.startTime}Z`).toISOString(),
      address: values.address,
      venue_name: values.venueName !== '' ? values.venueName : undefined,
      duration_hours: values.duration,
      capacity: values.capacity,
      image_key: values.imageKey,
      description: values.description,
      has_raffle: values.hasRaffle,
      default_raffle_entries: values.hasRaffle
        ? values.defaultRaffleEntries
        : DEFAULT_RAFFLE_ENTRIES,
      is_unlisted: values.isUnlisted,
      is_draft: saveAsDraft.current,
      organizer_ids: values.organizerIds,
      group_ids: values.groupIds,
      tag_ids: values.tagIds,
      ticket_type:
        values.isPaid && values.price > 0
          ? { price_cents: Math.round(values.price * 100) }
          : undefined,
    });

    if ('error' in result && result.error != null && 'data' in result.error) {
      // is this allowed
      const data: any = result.error.data;
      toast.error('Error creating meetup', {
        description: data.message,
      });
    } else {
      void navigate(`/meetup/${values.slug}`);
    }
  };

  return (
    <Page>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
        <div className="relative flex items-center justify-center">
          <BackButton
            to="/organizer"
            label="Back to organizer dashboard"
            className="absolute left-0"
          />
          <h1 className="text-center text-4xl font-bold">New Meetup</h1>
        </div>
        <Card className="gap-1 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Meetup Details</h2>
            <Button variant="ghost" asChild>
              <Link to="/new-meetup/eventbrite">Use Eventbrite</Link>
            </Button>
          </div>
          <Form {...form}>
            <form
              onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
              noValidate
              className="flex flex-col gap-5 pt-2"
            >
              <MeetupFormSection title="Basics">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Meetup Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field, fieldState }) => {
                    // Shown as typed for a bad slug; the empty case waits for a
                    // touch or submit.
                    const slugMessage =
                      slugError ??
                      (fieldState.invalid
                        ? fieldState.error?.message
                        : undefined);

                    return (
                      <FormItem
                        className="min-w-0"
                        data-invalid={slugMessage != null}
                      >
                        <FormLabel>URL slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(event) => {
                              setSlugEdited(true);
                              field.onChange(event);
                            }}
                          />
                        </FormControl>
                        {slugMessage != null ? (
                          <FieldError id="slug-error">{slugMessage}</FieldError>
                        ) : null}
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="organizerIds"
                  render={({ field }) => (
                    <Field className="min-w-0">
                      <FieldLabel htmlFor="organizers">
                        Additional Organizers
                      </FieldLabel>
                      <OrganizerCombobox
                        id="organizers"
                        value={field.value}
                        onChange={field.onChange}
                        excludeIds={currentUserId ? [currentUserId] : []}
                      />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tagIds"
                  render={({ field }) => (
                    <Field className="min-w-0">
                      <FieldLabel htmlFor="tags">Tags</FieldLabel>
                      <TagCombobox
                        id="tags"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isUnlisted"
                  render={({ field }) => (
                    <Field className="min-w-0">
                      <FieldLabel htmlFor="isUnlisted">Visibility</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isUnlisted"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            const unlisted = checked === true;
                            field.onChange(unlisted);
                            if (!unlisted) {
                              form.setValue('groupIds', []);
                            }
                          }}
                        />
                        <Label htmlFor="isUnlisted">
                          Hide from public listings (reachable only by direct
                          link)
                        </Label>
                      </div>
                    </Field>
                  )}
                />
                {isUnlisted ? (
                  <FormField
                    control={form.control}
                    name="groupIds"
                    render={({ field }) => (
                      <Field className="min-w-0">
                        <FieldLabel htmlFor="groups">Groups</FieldLabel>
                        <FieldDescription>
                          {UNLISTED_GROUPS_DESCRIPTION}
                        </FieldDescription>
                        <GroupCombobox
                          id="groups"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </Field>
                    )}
                  />
                ) : null}
                {isUnlisted ? (
                  <p className="text-sm text-amber-600 sm:col-span-2">
                    {UNLISTED_SLUG_NOTE}
                  </p>
                ) : null}
              </MeetupFormSection>
              <MeetupFormSection title="Schedule & location">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field, fieldState }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Date</FormLabel>
                      <DatePicker
                        id="date"
                        value={field.value}
                        invalid={fieldState.invalid}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field, fieldState }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Address</FormLabel>
                      <AddressCombobox
                        id="address"
                        address={field.value}
                        onAddressChange={(address) => {
                          field.onChange(address);
                          form.setValue('venueName', '');
                        }}
                        onPlaceSelect={({ address, venueName }) => {
                          field.onChange(address);
                          form.setValue('venueName', venueName);
                        }}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venueName"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>
                        <VenueNameLabel />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
              </MeetupFormSection>
              <MeetupFormSection title="Tickets">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    // Starts a new row so the checkbox sits beside the price.
                    <Field className="min-w-0 sm:col-start-1">
                      <FieldLabel htmlFor="isPaid">Ticket sales</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isPaid"
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            const paid = checked === true;
                            field.onChange(paid);
                            if (!paid) {
                              form.setValue('price', 0);
                            }
                          }}
                        />
                        <Label htmlFor="isPaid">Charge for tickets</Label>
                      </div>
                      <FieldDescription>
                        Paid tickets are subject to the{' '}
                        <Link
                          to="/legal/organizer-payment-terms"
                          target="_blank"
                          className="underline underline-offset-2"
                        >
                          Organizer Payment Terms
                        </Link>
                        .
                      </FieldDescription>
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Ticket price in USD</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={!isPaid}
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
              </MeetupFormSection>
              <MeetupFormSection title="Raffle">
                <FormField
                  control={form.control}
                  name="hasRaffle"
                  render={({ field }) => (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Checkbox
                        id="hasRaffle"
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      <Label htmlFor="hasRaffle">
                        Run raffles at this meetup
                      </Label>
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultRaffleEntries"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Default raffle entries per attendee</FormLabel>
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
              </MeetupFormSection>
              <MeetupFormSection title="Image & description">
                <MeetupImageField
                  className="min-w-0"
                  previewUrl={imageUrl}
                  onUploaded={(imageKey, uploadedUrl) => {
                    form.setValue('imageKey', imageKey);
                    form.setValue('imageUrl', uploadedUrl);
                  }}
                  onUploadingChange={onUploadingChange}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Field className="min-w-0">
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <Textarea
                        id="description"
                        value={field.value}
                        onBlur={field.onBlur}
                        // Truncate more than 500 characters
                        onChange={(event) =>
                          field.onChange(event.target.value.substring(0, 500))
                        }
                      />
                      <p
                        className={cn(
                          'text-right text-sm',
                          field.value.length === 500
                            ? 'text-destructive'
                            : 'text-foreground'
                        )}
                      >
                        {field.value.length} / 500
                      </p>
                    </Field>
                  )}
                />
              </MeetupFormSection>
              <FormErrorSummary<FormValues> labels={FIELD_LABELS} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={submitDisabled}
                  onClick={() => {
                    saveAsDraft.current = true;
                  }}
                >
                  Save as draft
                </Button>
                <Button
                  type="submit"
                  disabled={submitDisabled}
                  onClick={() => {
                    saveAsDraft.current = false;
                  }}
                >
                  Create
                  {isLoading && <Spinner />}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Page>
  );
};

export default NewMeetupPage;
