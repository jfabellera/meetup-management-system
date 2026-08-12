import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SLUG_REGEX, slugify } from '@keebmeet/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AddressCombobox from '../components/Meetups/AddressCombobox';
import GroupCombobox from '../components/Meetups/GroupCombobox';
import MeetupImageField from '../components/Meetups/MeetupImageField';
import TagCombobox from '../components/Meetups/TagCombobox';
import VenueNameLabel from '../components/Meetups/VenueNameLabel';
import {
  UNLISTED_GROUPS_DESCRIPTION,
  UNLISTED_SLUG_NOTE,
} from '../components/Meetups/unlistedCopy';
import Page from '../components/Page/Page';
import BackButton from '../components/shared/BackButton';
import { usePendingUploads } from '../hooks/usePendingUploads';
import {
  useCheckSlugAvailableQuery,
  useCreateArchiveMeetupMutation,
} from '../store/meetupSlice';
import ArchiveMeetupFormSchema from '../util/schemas/ArchiveMeetupFormSchema';
import { zodFormResolver } from '../util/zodFormResolver';

const FIELD_LABELS = {
  organizerType: 'Organizer',
  organizerName: 'Organizer name',
  name: 'Meetup name',
  slug: 'URL slug',
  date: 'Date',
  address: 'Address',
};

interface FormValues {
  name: string;
  slug: string;
  date: string;
  address: string;
  venueName: string;
  imageUrl: string;
  imageKey: string;
  description: string;
  organizerType: 'me' | 'other' | '';
  organizerName: string;
  groupIds: string[];
  tagIds: string[];
  isUnlisted: boolean;
}

const NewArchiveMeetupPage = (): ReactNode => {
  const [createArchiveMeetup, { isLoading }] = useCreateArchiveMeetupMutation();
  const { isUploading, onUploadingChange } = usePendingUploads();
  const navigate = useNavigate();
  const [slugEdited, setSlugEdited] = useState(false);
  // The slug is checked against the server, so it validates outside the schema.
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    mode: 'onTouched',
    resolver: zodFormResolver<FormValues>(ArchiveMeetupFormSchema, extraErrors),
    defaultValues: {
      name: '',
      slug: '',
      date: '',
      address: '',
      venueName: '',
      imageUrl: '',
      imageKey: '',
      description: '',
      // No default so crediting is a deliberate choice; 'other' reveals a
      // required organizer-name field (see the schema).
      organizerType: '',
      organizerName: '',
      groupIds: [],
      tagIds: [],
      isUnlisted: false,
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });
  const slug = useWatch({ control: form.control, name: 'slug' });
  const organizerType = useWatch({
    control: form.control,
    name: 'organizerType',
  });
  const isUnlisted = useWatch({ control: form.control, name: 'isUnlisted' });
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

  const onSubmit = async (values: FormValues): Promise<void> => {
    const result = await createArchiveMeetup({
      name: values.name,
      slug: values.slug,
      // Archives capture the day only; default to noon so the stored date
      // can't roll to an adjacent day across the UTC offset.
      date: new Date(`${values.date}T12:00Z`).toISOString(),
      address: values.address,
      venue_name: values.venueName !== '' ? values.venueName : undefined,
      image_key: values.imageKey,
      description: values.description,
      // The submitter always owns the archive. The credit is either
      // themselves ('me') or the typed name ('other').
      organizer_name:
        values.organizerType === 'other' ? values.organizerName : undefined,
      group_ids: values.groupIds,
      tag_ids: values.tagIds,
      is_unlisted: values.isUnlisted,
    });

    if ('error' in result && result.error != null && 'data' in result.error) {
      const data: any = result.error.data;
      toast.error('Error archiving meetup', {
        description: data.message,
      });
    } else {
      void navigate(`/meetup/${values.slug}`);
    }
  };

  return (
    <Page>
      <div className="mx-auto max-w-3xl p-4">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <div className="relative flex items-center justify-center">
            <BackButton
              to="/organizer"
              label="Back to organizer dashboard"
              className="absolute left-0"
            />
            <h1 className="text-center text-4xl font-bold">
              Archive a Past Meetup
            </h1>
          </div>
          <div className="bg-card text-card-foreground rounded-lg p-8 shadow-lg">
            <Form {...form}>
              <form
                onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
                noValidate
              >
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="organizerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizer</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Clear a stale name when switching back to self-credit.
                            if (value === 'me') {
                              form.setValue('organizerName', '');
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Who organized this meetup?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="me">I organized this</SelectItem>
                            <SelectItem value="other">
                              Someone else organized this
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {organizerType === 'other' && (
                    <FormField
                      control={form.control}
                      name="organizerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organizer Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
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
                      // Shown as typed for a bad slug; the empty case waits for
                      // a touch or submit.
                      const slugMessage =
                        slugError ??
                        (fieldState.invalid
                          ? fieldState.error?.message
                          : undefined);

                      return (
                        <FormItem data-invalid={slugMessage != null}>
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
                            <FieldError id="slug-error">
                              {slugMessage}
                            </FieldError>
                          ) : null}
                        </FormItem>
                      );
                    }}
                  />

                  <div className="flex flex-col gap-2">
                    <FormField
                      control={form.control}
                      name="isUnlisted"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Label htmlFor="isUnlisted" className="pr-4">
                            Hide this meetup from public listings?
                          </Label>
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
                          <span>Yes</span>
                        </div>
                      )}
                    />
                    {isUnlisted ? (
                      <p className="text-sm text-amber-600">
                        {UNLISTED_SLUG_NOTE}
                      </p>
                    ) : null}
                    {isUnlisted ? (
                      <FormField
                        control={form.control}
                        name="groupIds"
                        render={({ field }) => (
                          <Field>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="tagIds"
                    render={({ field }) => (
                      <Field>
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
                    name="date"
                    render={({ field, fieldState }) => (
                      <FormItem>
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
                    name="address"
                    render={({ field, fieldState }) => (
                      <FormItem>
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
                      <FormItem>
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

                  <MeetupImageField
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
                      <Field>
                        <FieldLabel htmlFor="description">
                          Description
                        </FieldLabel>
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
                            'mt-1 text-right text-sm',
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

                  <FormErrorSummary<FormValues> labels={FIELD_LABELS} />

                  <Button
                    type="submit"
                    disabled={isLoading || isUploading}
                    size="lg"
                  >
                    Archive
                    {isLoading && <Spinner />}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default NewArchiveMeetupPage;
