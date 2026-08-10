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
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { SLUG_REGEX, slugify } from '@keebmeet/shared';
import { useFormik } from 'formik';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
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

const NewMeetupPage = (): ReactNode => {
  const [createMeetup, { isLoading }] = useCreateMeetupMutation();
  const { isUploading, onUploadingChange } = usePendingUploads();
  const currentUserId = useAppSelector((state) => state.user.user?.id);
  const navigate = useNavigate();
  // Track whether the user edited the slug so name changes stop overwriting it.
  const [slugEdited, setSlugEdited] = useState(false);
  // Submit intent rather than form data, so the two buttons share one submit.
  const saveAsDraft = useRef(false);
  const formik = useFormik({
    initialValues: {
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
      defaultRaffleEntries: 1,
      isUnlisted: false,
      organizerIds: [] as string[],
      groupIds: [] as string[],
      tagIds: [] as string[],
    },
    onSubmit: async (values) => {
      const result = await createMeetup({
        name: formik.values.name,
        slug: formik.values.slug,
        date: new Date(
          `${formik.values.date}T${formik.values.startTime}Z`
        ).toISOString(),
        address: formik.values.address,
        venue_name:
          formik.values.venueName !== '' ? formik.values.venueName : undefined,
        duration_hours: formik.values.duration,
        capacity: formik.values.capacity,
        image_key: formik.values.imageKey,
        description: formik.values.description,
        has_raffle: formik.values.hasRaffle,
        default_raffle_entries: formik.values.hasRaffle
          ? formik.values.defaultRaffleEntries
          : formik.initialValues.defaultRaffleEntries,
        is_unlisted: formik.values.isUnlisted,
        is_draft: saveAsDraft.current,
        organizer_ids: formik.values.organizerIds,
        group_ids: formik.values.groupIds,
        tag_ids: formik.values.tagIds,
        ticket_type:
          formik.values.isPaid && formik.values.price > 0
            ? { price_cents: Math.round(formik.values.price * 100) }
            : undefined,
      });

      if ('error' in result && result.error != null && 'data' in result.error) {
        // is this allowed
        const data: any = result.error.data;
        toast.error('Error creating meetup', {
          description: data.message,
        });
      } else {
        void navigate(`/meetup/${formik.values.slug}`);
      }
    },
    validationSchema: MeetupFormSchema,
    validateOnMount: true,
  });

  // Auto-fill the slug from the name until the user edits it directly.
  useEffect(() => {
    if (!slugEdited) {
      void formik.setFieldValue('slug', slugify(formik.values.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.name, slugEdited]);

  const slugValid = SLUG_REGEX.test(formik.values.slug);
  const { data: slugCheck } = useCheckSlugAvailableQuery(
    { slug: formik.values.slug },
    { skip: !slugValid }
  );
  const slugTaken = slugValid && slugCheck?.available === false;
  const slugError =
    formik.values.slug !== '' && !slugValid
      ? 'Lowercase letters, numbers, and hyphens only'
      : slugTaken
        ? 'That URL is already taken'
        : undefined;

  const submitDisabled =
    !formik.isValid ||
    isLoading ||
    isUploading ||
    slugError != null ||
    formik.values.slug === '';

  const onDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ): void => {
    // Truncate more than 500 characters
    event.target.value = event.target.value.substring(0, 500);
    formik.handleChange(event);
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
          <form
            onSubmit={formik.handleSubmit}
            noValidate
            className="flex flex-col gap-5 pt-2"
          >
            <MeetupFormSection title="Basics">
              <FormField
                formik={formik}
                name="name"
                label="Meetup Name"
                className="min-w-0"
              />
              <Field
                data-invalid={slugError != null}
                className="min-w-0 gap-1.5"
              >
                <FieldLabel htmlFor="slug">URL slug</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  value={formik.values.slug}
                  aria-invalid={slugError != null}
                  onChange={(event) => {
                    setSlugEdited(true);
                    formik.handleChange(event);
                  }}
                  onBlur={formik.handleBlur}
                />
                {slugError != null ? (
                  <FieldError>{slugError}</FieldError>
                ) : null}
              </Field>
              <Field className="min-w-0">
                <FieldLabel htmlFor="organizers">
                  Additional Organizers
                </FieldLabel>
                <OrganizerCombobox
                  id="organizers"
                  value={formik.values.organizerIds}
                  onChange={(organizerIds) =>
                    void formik.setFieldValue('organizerIds', organizerIds)
                  }
                  excludeIds={currentUserId ? [currentUserId] : []}
                />
              </Field>
              <Field className="min-w-0">
                <FieldLabel htmlFor="tags">Tags</FieldLabel>
                <TagCombobox
                  id="tags"
                  value={formik.values.tagIds}
                  onChange={(tagIds) =>
                    void formik.setFieldValue('tagIds', tagIds)
                  }
                />
              </Field>
              <Field className="min-w-0">
                <FieldLabel htmlFor="isUnlisted">Visibility</FieldLabel>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isUnlisted"
                    name="isUnlisted"
                    checked={formik.values.isUnlisted}
                    onCheckedChange={(checked) => {
                      const isUnlisted = checked === true;
                      void formik.setFieldValue('isUnlisted', isUnlisted);
                      if (!isUnlisted) {
                        void formik.setFieldValue('groupIds', []);
                      }
                    }}
                  />
                  <Label htmlFor="isUnlisted">
                    Hide from public listings (reachable only by direct link)
                  </Label>
                </div>
              </Field>
              {formik.values.isUnlisted ? (
                <Field className="min-w-0">
                  <FieldLabel htmlFor="groups">Groups</FieldLabel>
                  <FieldDescription>
                    {UNLISTED_GROUPS_DESCRIPTION}
                  </FieldDescription>
                  <GroupCombobox
                    id="groups"
                    value={formik.values.groupIds}
                    onChange={(groupIds) =>
                      void formik.setFieldValue('groupIds', groupIds)
                    }
                  />
                </Field>
              ) : null}
              {formik.values.isUnlisted ? (
                <p className="text-sm text-amber-600 sm:col-span-2">
                  {UNLISTED_SLUG_NOTE}
                </p>
              ) : null}
            </MeetupFormSection>
            <MeetupFormSection title="Schedule & location">
              <Field
                data-invalid={
                  formik.errors.date != null && formik.touched.date === true
                }
                className="min-w-0 gap-1.5"
              >
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <DatePicker
                  id="date"
                  value={formik.values.date}
                  invalid={
                    formik.errors.date != null && formik.touched.date === true
                  }
                  onChange={(date) => void formik.setFieldValue('date', date)}
                  onBlur={() =>
                    void formik.setFieldTouched('date', true, false)
                  }
                />
                {formik.errors.date != null && formik.touched.date === true ? (
                  <FieldError>{formik.errors.date}</FieldError>
                ) : null}
              </Field>
              <FormField
                formik={formik}
                name="startTime"
                label="Start Time"
                type="time"
                className="min-w-0"
              />
              <Field
                data-invalid={
                  formik.errors.address != null &&
                  formik.touched.address === true
                }
                className="min-w-0 gap-1.5"
              >
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <AddressCombobox
                  id="address"
                  address={formik.values.address}
                  onAddressChange={(address) => {
                    void formik.setFieldValue('address', address);
                    void formik.setFieldValue('venueName', '');
                  }}
                  onPlaceSelect={({ address, venueName }) => {
                    void formik.setFieldValue('address', address);
                    void formik.setFieldValue('venueName', venueName);
                  }}
                  onBlur={() => {
                    void formik.setFieldTouched('address', true);
                  }}
                  invalid={
                    formik.errors.address != null &&
                    formik.touched.address === true
                  }
                />
                {formik.errors.address != null &&
                formik.touched.address === true ? (
                  <FieldError>{formik.errors.address}</FieldError>
                ) : null}
              </Field>
              <FormField
                formik={formik}
                name="venueName"
                label={<VenueNameLabel />}
                className="min-w-0"
              />
              <FormField
                formik={formik}
                name="duration"
                label="Duration (hours)"
                type="number"
                className="min-w-0"
              />
            </MeetupFormSection>
            <MeetupFormSection title="Tickets">
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="isPaid"
                  name="isPaid"
                  checked={formik.values.isPaid}
                  onCheckedChange={(checked) => {
                    const isPaid = checked === true;
                    void formik.setValues({
                      ...formik.values,
                      isPaid,
                      price: isPaid ? formik.values.price : 0,
                    });
                  }}
                />
                <Label htmlFor="isPaid">Charge for tickets</Label>
              </div>
              <FormField
                formik={formik}
                name="capacity"
                label="Capacity"
                type="number"
                className="min-w-0"
              />
              <FormField
                formik={formik}
                name="price"
                label="Ticket price in USD"
                type="number"
                disabled={!formik.values.isPaid}
                className="min-w-0"
              />
              <p className="text-muted-foreground text-xs sm:col-span-2">
                Paid tickets are subject to the{' '}
                <Link
                  to="/legal/organizer-payment-terms"
                  target="_blank"
                  className="underline underline-offset-2"
                >
                  Organizer Payment Terms
                </Link>
                .
              </p>
            </MeetupFormSection>
            <MeetupFormSection title="Raffle">
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="hasRaffle"
                  name="hasRaffle"
                  checked={formik.values.hasRaffle}
                  onCheckedChange={(checked) => {
                    void formik.setFieldValue('hasRaffle', checked === true);
                  }}
                />
                <Label htmlFor="hasRaffle">Run raffles at this meetup</Label>
              </div>
              <FormField
                formik={formik}
                name="defaultRaffleEntries"
                label="Default raffle entries per attendee"
                type="number"
                disabled={!formik.values.hasRaffle}
                value={formik.values.defaultRaffleEntries}
                className="min-w-0"
              />
            </MeetupFormSection>
            <MeetupFormSection title="Image & description">
              <MeetupImageField
                className="min-w-0"
                previewUrl={formik.values.imageUrl}
                onUploaded={(imageKey, imageUrl) => {
                  void formik.setFieldValue('imageKey', imageKey);
                  void formik.setFieldValue('imageUrl', imageUrl);
                }}
                onUploadingChange={onUploadingChange}
              />
              <Field className="min-w-0">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  onChange={onDescriptionChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.description}
                />
                <p
                  className={cn(
                    'text-right text-sm',
                    formik.values.description.length === 500
                      ? 'text-destructive'
                      : 'text-foreground'
                  )}
                >
                  {formik.values.description.length} / 500
                </p>
              </Field>
            </MeetupFormSection>
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
        </Card>
      </div>
    </Page>
  );
};

export default NewMeetupPage;
