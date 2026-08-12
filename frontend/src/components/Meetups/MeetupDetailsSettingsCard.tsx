import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBoolean } from '@/hooks/useBoolean';
import { usePendingUploads } from '@/hooks/usePendingUploads';
import { useAppSelector } from '@/store/hooks';
import { SLUG_REGEX, type EditMeetupPayload } from '@keebmeet/shared';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Form, FormField } from '@/components/ui/form';
import { editMeetupFormSchema } from '@/util/schemas/EditMeetupFormSchema';
import { zodFormResolver } from '@/util/zodFormResolver';
import { useEffect, useMemo, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCheckSlugAvailableQuery,
  useEditMeetupMutation,
  useGetMeetupQuery,
} from '../../store/meetupSlice';
import EditableFormCard from '../Forms/EditableFormCard';
import EditableFormField from '../Forms/EditableFormField';
import AddressCombobox from './AddressCombobox';
import GroupCombobox from './GroupCombobox';
import MeetupFormSection from './MeetupFormSection';
import VenueNameLabel from './VenueNameLabel';
import MeetupImageField from './MeetupImageField';
import OrganizerCombobox from './OrganizerCombobox';
import TagCombobox from './TagCombobox';
import {
  UNLISTED_GROUPS_DESCRIPTION,
  UNLISTED_SLUG_NOTE,
} from './unlistedCopy';

dayjs.extend(customParseFormat);

interface Props {
  meetupId: string;
}

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
  isUnlisted: boolean;
  organizerIds: string[];
  groupIds: string[];
  tagIds: string[];
  organizerType: 'me' | 'other';
  organizerName: string;
}

const MeetupDetailsSettingsCard = ({ meetupId }: Props): ReactNode => {
  const { data: meetup } = useGetMeetupQuery(meetupId);
  const currentUserId = useAppSelector((state) => state.user.user?.id);
  // Only the lead organizer may change the organizers and groups.
  const isLead = currentUserId === meetup?.lead_organizer?.id;
  const [isEditable, setIsEditable] = useBoolean(false);
  const [editMeetup, { isLoading: isSaving }] = useEditMeetupMutation();
  const { isUploading, onUploadingChange } = usePendingUploads();
  const isArchive = meetup?.is_archive === true;
  const resolver = useMemo(
    () => zodFormResolver<FormValues>(editMeetupFormSchema(isArchive)),
    [isArchive]
  );

  const initialValues: FormValues = useMemo(
    () => ({
      name: meetup?.name ?? '',
      slug: meetup?.slug ?? '',
      date: dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format('YYYY-MM-DD'),
      startTime: dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format('HH:mm'),
      address: meetup?.location.full_address ?? '',
      venueName: meetup?.location.venue_name ?? '',
      duration: meetup?.duration_hours ?? 0,
      capacity: meetup?.tickets?.total ?? 0,
      isPaid: meetup?.ticket_types?.[0] != null,
      price:
        meetup?.ticket_types?.[0] != null
          ? meetup.ticket_types[0].price_cents / 100
          : 0,
      imageUrl: meetup?.image_url ?? '',
      imageKey: '',
      description: meetup?.description ?? '',
      isUnlisted: meetup?.is_unlisted ?? false,
      organizerIds: meetup?.organizers?.map((organizer) => organizer.id) ?? [],
      groupIds: meetup?.groups?.map((group) => group.id) ?? [],
      tagIds: meetup?.tags?.map((tag) => tag.id) ?? [],
      organizerType: meetup?.organizer_name != null ? 'other' : 'me',
      organizerName: meetup?.organizer_name ?? '',
    }),
    [meetup]
  );

  const form = useForm<FormValues>({
    mode: 'onTouched',
    resolver,
    defaultValues: initialValues,
  });
  const values = useWatch({ control: form.control }) as FormValues;

  const onSubmit = async (values: FormValues): Promise<void> => {
    const payload: EditMeetupPayload = {};
    if (initialValues.name !== values.name) payload.name = values.name;
    if (initialValues.slug !== values.slug) payload.slug = values.slug;
    if (
      initialValues.date !== values.date ||
      initialValues.startTime !== values.startTime
    )
      payload.date = new Date(
        `${values.date}T${values.startTime}Z`
      ).toISOString();
    if (initialValues.address !== values.address)
      payload.address = values.address;
    if (
      initialValues.venueName !== values.venueName &&
      (values.venueName !== '' || initialValues.address === values.address)
    )
      payload.venue_name = values.venueName;
    if (initialValues.duration !== values.duration)
      payload.duration_hours = values.duration;
    if (initialValues.capacity !== values.capacity)
      payload.capacity = values.capacity;
    if (initialValues.price !== values.price)
      payload.ticket_type =
        values.price > 0
          ? { price_cents: Math.round(values.price * 100) }
          : null;
    // A new upload sets imageKey; clearing an existing image empties imageUrl.
    if (values.imageKey !== '') {
      payload.image_key = values.imageKey;
    } else if (values.imageUrl === '' && initialValues.imageUrl !== '') {
      payload.image_key = '';
    }
    if (initialValues.description !== values.description)
      payload.description = values.description;
    if (initialValues.isUnlisted !== values.isUnlisted)
      payload.is_unlisted = values.isUnlisted;
    if (
      JSON.stringify(initialValues.organizerIds) !==
      JSON.stringify(values.organizerIds)
    )
      payload.organizer_ids = values.organizerIds;
    if (
      JSON.stringify(initialValues.groupIds) !== JSON.stringify(values.groupIds)
    )
      payload.group_ids = values.groupIds;
    if (JSON.stringify(initialValues.tagIds) !== JSON.stringify(values.tagIds))
      payload.tag_ids = values.tagIds;
    const organizerName =
      values.organizerType === 'other' ? values.organizerName : '';
    const initialOrganizerName =
      initialValues.organizerType === 'other'
        ? initialValues.organizerName
        : '';
    if (organizerName !== initialOrganizerName)
      payload.organizer_name = organizerName;

    const result = await editMeetup({ meetupId: meetup?.id ?? '', payload });

    if ('error' in result && result.error != null && 'data' in result.error) {
      // is this allowed
      const data: any = result.error.data;
      toast.error('Error updating meetup', {
        description: data.message,
      });
    } else {
      setIsEditable.off();
    }
  };

  const slugChanged = values.slug !== initialValues.slug;
  const slugValid = SLUG_REGEX.test(values.slug);
  const { data: slugCheck } = useCheckSlugAvailableQuery(
    { slug: values.slug, excludeId: meetup?.id },
    { skip: !isEditable || !slugChanged || !slugValid }
  );
  const slugTaken = slugChanged && slugValid && slugCheck?.available === false;
  const slugError = slugChanged
    ? !slugValid
      ? 'Use lowercase letters, numbers, and hyphens'
      : slugTaken
        ? 'That URL is already taken'
        : undefined
    : undefined;

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const onEditSubmit = (): void => {
    // Leave edit mode from within the submit handler once the save resolves,
    // so the Save button (and its spinner) stays visible while in flight.
    void form.handleSubmit(onSubmit)();
  };
  const onCancel = (): void => {
    form.reset(initialValues);
    setIsEditable.off();
  };

  return (
    <EditableFormCard
      title={'Meetup Details'}
      isEditable={isEditable}
      onEditEnter={setIsEditable.on}
      onEditCancel={onCancel}
      onEditSubmit={onEditSubmit}
      isSubmitLoading={isSaving}
      isFormInvalid={slugError != null}
      isSubmitDisabled={isUploading}
    >
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
              render={({ field, fieldState }) => (
                <EditableFormField
                  name={'Meetup Name'}
                  className="max-w-none py-0"
                  editable={isEditable}
                  id={'name'}
                  type={'text'}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={fieldState.invalid}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <EditableFormField
                  name={'URL slug'}
                  className="max-w-none py-0"
                  editable={isEditable}
                  id={'slug'}
                  type={'text'}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={slugError != null}
                  errorMessage={slugError}
                />
              )}
            />
            {isArchive ? (
              <Field className="min-w-0">
                <FieldLabel htmlFor="organizerType">Organizer</FieldLabel>
                {isEditable ? (
                  <div className="flex flex-col gap-2">
                    <Select
                      value={values.organizerType}
                      onValueChange={(value) => {
                        form.setValue(
                          'organizerType',
                          value as FormValues['organizerType']
                        );
                        // Clear a stale name when switching back to self-credit.
                        if (value === 'me') {
                          form.setValue('organizerName', '');
                        }
                      }}
                    >
                      <SelectTrigger id="organizerType" className="w-full">
                        <SelectValue placeholder="Who organized this meetup?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="me">I organized this</SelectItem>
                        <SelectItem value="other">
                          Someone else organized this
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {values.organizerType === 'other' ? (
                      <FormField
                        control={form.control}
                        name="organizerName"
                        render={({ field }) => (
                          <Input
                            id="organizerName"
                            placeholder="Organizer name"
                            {...field}
                          />
                        )}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p className="text-foreground/70">
                    {meetup?.organizer_name ??
                      meetup?.lead_organizer?.display_name ??
                      'N/A'}
                  </p>
                )}
              </Field>
            ) : (
              <Field className="min-w-0">
                <FieldLabel htmlFor="organizers">Organizers</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {meetup?.lead_organizer != null ? (
                    <Badge>{meetup.lead_organizer.display_name} · Lead</Badge>
                  ) : null}

                  {!isEditable &&
                    meetup?.organizers?.map((organizer) => (
                      <Badge variant="secondary" key={organizer.id}>
                        {organizer.display_name}
                      </Badge>
                    ))}
                </div>
                {isEditable && (
                  <OrganizerCombobox
                    id="organizers"
                    disabled={
                      !isEditable ||
                      currentUserId !== meetup?.lead_organizer?.id
                    }
                    excludeIds={
                      meetup?.lead_organizer != null
                        ? [meetup.lead_organizer.id]
                        : []
                    }
                    value={values.organizerIds}
                    onChange={(organizerIds) =>
                      form.setValue('organizerIds', organizerIds)
                    }
                  />
                )}
              </Field>
            )}
            <Field className="min-w-0">
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              {isEditable ? (
                <TagCombobox
                  id="tags"
                  value={values.tagIds}
                  onChange={(tagIds) => form.setValue('tagIds', tagIds)}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {meetup?.tags != null && meetup.tags.length > 0 ? (
                    meetup.tags.map((tag) => (
                      <Badge variant="secondary" key={tag.id}>
                        <span
                          aria-hidden
                          className="mr-1 size-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-foreground/70">No tags</p>
                  )}
                </div>
              )}
            </Field>
            <Field className="min-w-0">
              <FieldLabel htmlFor="isUnlisted">Visibility</FieldLabel>
              {isEditable ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isUnlisted"
                    name="isUnlisted"
                    checked={values.isUnlisted}
                    onCheckedChange={(checked) => {
                      const isUnlisted = checked === true;
                      form.setValue('isUnlisted', isUnlisted);
                      if (!isUnlisted) form.setValue('groupIds', []);
                    }}
                  />
                  <Label htmlFor="isUnlisted">
                    Hide from public listings (reachable only by direct link)
                  </Label>
                </div>
              ) : (
                <p className="text-foreground/70">
                  {meetup?.is_unlisted === true ? 'Unlisted' : 'Public'}
                </p>
              )}
            </Field>
            {values.isUnlisted ? (
              <Field className="min-w-0">
                <FieldLabel htmlFor="groups">Groups</FieldLabel>
                <FieldDescription>
                  {UNLISTED_GROUPS_DESCRIPTION}
                </FieldDescription>
                {/* Only the lead edits groups; everyone else sees them read-only. */}
                {!(isEditable && isLead) ? (
                  <div className="flex flex-wrap gap-2">
                    {meetup?.groups != null && meetup.groups.length > 0 ? (
                      meetup.groups.map((group) => (
                        <Badge variant="secondary" key={group.id}>
                          {group.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-foreground/70">No groups</p>
                    )}
                  </div>
                ) : (
                  <GroupCombobox
                    id="groups"
                    value={values.groupIds}
                    onChange={(groupIds) => form.setValue('groupIds', groupIds)}
                  />
                )}
              </Field>
            ) : null}
            {isEditable && values.isUnlisted ? (
              <p className="text-sm text-amber-600 sm:col-span-2">
                {UNLISTED_SLUG_NOTE}
              </p>
            ) : null}
          </MeetupFormSection>
          <MeetupFormSection title="Schedule & location">
            <Field
              data-invalid={form.formState.errors.date != null}
              className="max-w-none min-w-0 py-0"
            >
              <FieldLabel htmlFor="date" className="line-clamp-1">
                Date
              </FieldLabel>
              {isEditable ? (
                <>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field, fieldState }) => (
                      <DatePicker
                        id="date"
                        value={field.value}
                        invalid={fieldState.invalid}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {form.formState.errors.date != null ? (
                    <FieldError>
                      {form.formState.errors.date?.message}
                    </FieldError>
                  ) : null}
                </>
              ) : (
                <p className="text-foreground/70">
                  {dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format(
                    'YYYY-MM-DD'
                  )}
                </p>
              )}
            </Field>
            {/* Archives capture the day only — no start time. */}
            {!isArchive ? (
              <FormField
                control={form.control}
                name="startTime"
                render={({ field, fieldState }) => (
                  <EditableFormField
                    name={'Start Time'}
                    className="max-w-none py-0"
                    editable={isEditable}
                    id={'startTime'}
                    type={'time'}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={fieldState.invalid}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
            ) : null}
            <Field
              data-invalid={form.formState.errors.address != null}
              className="max-w-none min-w-0 py-0"
            >
              <FieldLabel htmlFor="address" className="line-clamp-1">
                Address
              </FieldLabel>
              {isEditable ? (
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field, fieldState }) => (
                    <>
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
                      {fieldState.error != null ? (
                        <FieldError>{fieldState.error.message}</FieldError>
                      ) : null}
                    </>
                  )}
                />
              ) : (
                <p className="text-foreground/70">
                  {meetup?.location.full_address ?? 'N/A'}
                </p>
              )}
            </Field>
            <Field className="max-w-none min-w-0 py-0">
              <FieldLabel htmlFor="venueName">
                <VenueNameLabel />
              </FieldLabel>
              {isEditable ? (
                <FormField
                  control={form.control}
                  name="venueName"
                  render={({ field }) => (
                    <Input id="venueName" type="text" {...field} />
                  )}
                />
              ) : (
                <p className="text-foreground/70">
                  {meetup?.location.venue_name ?? 'N/A'}
                </p>
              )}
            </Field>
            {!isArchive ? (
              <FormField
                control={form.control}
                name="duration"
                render={({ field, fieldState }) => (
                  <EditableFormField
                    name={'Duration (hours)'}
                    className="max-w-none py-0"
                    editable={isEditable}
                    id={'duration'}
                    type={'number'}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value)
                      )
                    }
                    onBlur={field.onBlur}
                    isInvalid={fieldState.invalid}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
            ) : null}
          </MeetupFormSection>
          {/* Archives have no live sign-ups. */}
          {!isArchive ? (
            <MeetupFormSection title="Tickets">
              {isEditable ? (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox
                    id="isPaid"
                    name="isPaid"
                    checked={values.isPaid}
                    onCheckedChange={(checked) => {
                      const isPaid = checked === true;
                      form.setValue('isPaid', isPaid);
                      if (!isPaid) form.setValue('price', 0);
                    }}
                  />
                  <Label htmlFor="isPaid">Charge for tickets</Label>
                </div>
              ) : null}
              <FormField
                control={form.control}
                name="capacity"
                render={({ field, fieldState }) => (
                  <EditableFormField
                    name={'Capacity'}
                    className="max-w-none py-0"
                    editable={isEditable}
                    id={'capacity'}
                    type={'number'}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value)
                      )
                    }
                    onBlur={field.onBlur}
                    isInvalid={fieldState.invalid}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <EditableFormField
                    name={'Ticket price in USD'}
                    className="max-w-none py-0"
                    key={`price-${values.isPaid}`}
                    editable={isEditable}
                    id={'price'}
                    type={'number'}
                    disabled={!values.isPaid}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value)
                      )
                    }
                    onBlur={field.onBlur}
                    isInvalid={fieldState.invalid}
                    errorMessage={fieldState.error?.message}
                  />
                )}
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
          ) : null}
          <MeetupFormSection title="Image & description">
            <MeetupImageField
              className="max-w-none py-0"
              previewUrl={values.imageUrl}
              editable={isEditable}
              onUploadingChange={onUploadingChange}
              onUploaded={(imageKey, imageUrl) => {
                form.setValue('imageKey', imageKey);
                form.setValue('imageUrl', imageUrl);
              }}
              onRemove={() => {
                form.setValue('imageKey', '');
                form.setValue('imageUrl', '');
              }}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <EditableFormField
                  name={'Description'}
                  className="max-w-none py-0"
                  editable={isEditable}
                  id={'description'}
                  type={'text'}
                  multiline
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={fieldState.invalid}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          </MeetupFormSection>
        </form>
      </Form>
    </EditableFormCard>
  );
};

export default MeetupDetailsSettingsCard;
