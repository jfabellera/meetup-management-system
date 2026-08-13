import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { USERNAME_REGEX, usernameField } from '@keebmeet/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FaDiscord } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import GroupsCard from '../components/Account/GroupsCard';
import OrganizerPaymentTerms from '../components/Account/OrganizerPaymentTerms';
import Page from '../components/Page/Page';
import BackButton from '../components/shared/BackButton';
import ImageUploadField from '../components/shared/ImageUploadField';
import config from '../config';
import { usePendingUploads } from '../hooks/usePendingUploads';
import { updateProfile } from '../store/authSlice';
import { groupSlice } from '../store/groupSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  useCreateStripeAccountLinkMutation,
  useCreateStripeLoginLinkMutation,
  useGetStripeStatusQuery,
} from '../store/stripeSlice';
import {
  useCheckUsernameAvailableQuery,
  useGetUserQuery,
  useRequestOrganizerMutation,
  useUnlinkDiscordMutation,
  useUploadUserImageMutation,
} from '../store/userSlice';
import { redirectToDiscordLink } from '../util/discord';
import { zodFormResolver } from '../util/zodFormResolver';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;

const ProfileSchema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    displayName: z.string().min(1, 'Required'),
    username: usernameField,
    // Password is optional; only validated when the user types a new one.
    password: z
      .string()
      .refine(
        (value) => value === '' || PASSWORD_REGEX.test(value),
        'Must contain 8 characters, one uppercase, one lowercase, one number, and one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

const FIELD_LABELS = {
  displayName: 'Display name',
  username: 'Username',
  firstName: 'First name',
  lastName: 'Last name',
  password: 'New password',
  confirmPassword: 'Confirm new password',
};

interface FormValues {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  password: string;
  confirmPassword: string;
  photoUrl: string;
  photoKey: string;
}

const AccountPage = (): ReactNode => {
  const dispatch = useAppDispatch();
  const { user: localUser, loading } = useAppSelector((state) => state.user);
  const { data: user, refetch } = useGetUserQuery(localUser?.id ?? '', {
    skip: localUser == null,
  });
  const [requestOrganizer, { isLoading: isRequestingOrganizer }] =
    useRequestOrganizerMutation();
  const [unlinkDiscord, { isLoading: isUnlinking }] =
    useUnlinkDiscordMutation();
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const { isUploading, onUploadingChange } = usePendingUploads();

  const isOrganizer = user?.is_organizer ?? false;
  const { data: stripeStatus } = useGetStripeStatusQuery(undefined, {
    skip: !isOrganizer,
  });
  const [createStripeAccountLink] = useCreateStripeAccountLinkMutation();
  const [createStripeLoginLink, { isLoading: isOpeningDashboard }] =
    useCreateStripeLoginLinkMutation();
  const [isStartingStripe, setIsStartingStripe] = useState(false);
  const [showPaymentTerms, setShowPaymentTerms] = useState(false);
  const [agreedToPaymentTerms, setAgreedToPaymentTerms] = useState(false);

  const startStripeOnboarding = (acceptPaymentTerms: boolean): void => {
    setIsStartingStripe(true);
    void (async () => {
      try {
        const { url } = await createStripeAccountLink({
          acceptPaymentTerms,
        }).unwrap();
        window.location.href = url;
      } catch {
        setIsStartingStripe(false);
        toast.error('Could not start Stripe onboarding. Please try again.');
      }
    })();
  };

  const onSetupPayments = (): void => {
    if (stripeStatus?.payment_terms_accepted ?? false) {
      startStripeOnboarding(false);
    } else {
      setAgreedToPaymentTerms(false);
      setShowPaymentTerms(true);
    }
  };

  const onOpenDashboard = (): void => {
    void (async () => {
      try {
        const { url } = await createStripeLoginLink().unwrap();
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        toast.error('Could not open your Stripe dashboard. Please try again.');
      }
    })();
  };

  const onRequestOrganizer = (): void => {
    void (async () => {
      try {
        await requestOrganizer().unwrap();
        toast.success('Organizer request submitted', {
          description: 'An admin will review your request.',
        });
      } catch {
        toast.error('Could not submit your request. Please try again.');
      }
    })();
  };

  const onUnlinkDiscord = (): void => {
    if (user == null) return;
    void (async () => {
      try {
        await unlinkDiscord(user.id).unwrap();
        dispatch(groupSlice.util.invalidateTags(['MyGroups']));
        toast.success('Your Discord account has been unlinked.');
        setShowUnlinkConfirm(false);
      } catch (err) {
        const message = (err as { data?: { message?: string } }).data?.message;
        toast.error(message ?? 'Could not unlink Discord. Please try again.');
      }
    })();
  };

  // Availability is checked against the server, so it validates outside the schema.
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});
  const initialPhotoUrl = user?.photo_url ?? '';
  const initialUsername = user?.username ?? '';

  const form = useForm<FormValues>({
    mode: 'onTouched',
    resolver: zodFormResolver<FormValues>(ProfileSchema, extraErrors),
    // Prefilled from the fetched user; reinitialised once it loads.
    values: {
      email: user?.email ?? '',
      firstName: user?.first_name ?? '',
      lastName: user?.last_name ?? '',
      displayName: user?.display_name ?? '',
      username: initialUsername,
      password: '',
      confirmPassword: '',
      // photoUrl is the preview; photoKey is only set on a new upload.
      photoUrl: initialPhotoUrl,
      photoKey: '',
    },
  });

  const username = useWatch({ control: form.control, name: 'username' });
  const photoUrl = useWatch({ control: form.control, name: 'photoUrl' });

  const usernameChanged = username !== initialUsername;
  const usernameValid = USERNAME_REGEX.test(username);
  const { data: usernameCheck } = useCheckUsernameAvailableQuery(
    { username, excludeId: user?.id },
    { skip: !usernameChanged || !usernameValid }
  );
  const usernameTaken =
    usernameChanged && usernameValid && usernameCheck?.available === false;
  useEffect(() => {
    setExtraErrors(usernameTaken ? { username: 'Username is taken' } : {});
  }, [usernameTaken]);

  const onSubmit = (values: FormValues): void => {
    if (localUser == null) return;

    // A new upload sets photoKey; clearing an existing photo empties photoUrl;
    // otherwise leave it unchanged (undefined).
    let photoKey: string | undefined;
    if (values.photoKey !== '') {
      photoKey = values.photoKey;
    } else if (values.photoUrl === '' && initialPhotoUrl !== '') {
      photoKey = '';
    }

    void dispatch(
      updateProfile({
        userId: localUser.id,
        firstName: values.firstName,
        lastName: values.lastName,
        displayName: values.displayName,
        username: values.username,
        password: values.password,
        photoKey,
      })
    )
      .then((action) => {
        if (updateProfile.fulfilled.match(action)) {
          void refetch();
          // Reset to the saved values with the password fields cleared. This
          // also clears touched/errors so no stale validation messages show.
          form.reset({
            ...values,
            password: '',
            confirmPassword: '',
            photoKey: '',
          });
          toast.success('Profile updated');
        } else {
          toast.error('Failed to update profile');
        }
      })
      .catch(() => {});
  };

  return (
    <Page>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
        <div className="relative flex items-center justify-center">
          <BackButton to="/" label="Back to home" className="absolute left-0" />
          <h1 className="text-2xl font-bold">Account</h1>
        </div>
        <div className="bg-card text-card-foreground rounded-lg p-8 shadow-lg">
          <Form {...form}>
            <form
              onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
              noValidate
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-muted-foreground shrink-0 text-xs font-semibold tracking-[0.14em] uppercase">
                      Public · shown on your profile
                    </h2>
                    <Separator className="flex-1" />
                  </div>
                  <div className="flex flex-col items-center gap-x-6 gap-y-4 sm:flex-row sm:items-start">
                    <ImageUploadField
                      className="w-28 shrink-0 py-0"
                      label="Profile Photo"
                      aspectRatio={1}
                      rounded
                      useUploadMutation={useUploadUserImageMutation}
                      previewUrl={photoUrl}
                      onUploaded={(imageKey, imageUrl) => {
                        form.setValue('photoKey', imageKey, {
                          shouldDirty: true,
                        });
                        form.setValue('photoUrl', imageUrl, {
                          shouldDirty: true,
                        });
                      }}
                      onUploadingChange={onUploadingChange}
                      onRemove={() => {
                        form.setValue('photoKey', '', { shouldDirty: true });
                        form.setValue('photoUrl', '', { shouldDirty: true });
                      }}
                    />
                    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field, fieldState }) => (
                          <FormItem
                            data-invalid={usernameTaken || fieldState.invalid}
                          >
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-muted-foreground shrink-0 text-xs font-semibold tracking-[0.14em] uppercase">
                      Private · visible to organizers
                    </h2>
                    <Separator className="flex-1" />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" disabled {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-row gap-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-muted-foreground shrink-0 text-xs font-semibold tracking-[0.14em] uppercase">
                      Change password
                    </h2>
                    <Separator className="flex-1" />
                  </div>
                  <div className="flex flex-row gap-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormErrorSummary<FormValues> labels={FIELD_LABELS} />
                <Button
                  type="submit"
                  className="self-end"
                  disabled={loading || !form.formState.isDirty || isUploading}
                >
                  Save changes
                  {loading ? <Spinner /> : null}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        <GroupsCard />
        <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-lg p-8 shadow-lg">
          <h2 className="text-lg font-medium">Connections</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span>Discord</span>
              <span className="text-muted-foreground text-xs">
                {(user?.is_discord_linked ?? false)
                  ? user?.discord_username != null
                    ? `Linked as @${user.discord_username}`
                    : 'Linked'
                  : 'Link your account to access groups from your Discord servers.'}
              </span>
            </div>
            {(user?.is_discord_linked ?? false) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnlinkConfirm(true)}
              >
                Unlink
              </Button>
            ) : (
              <Button
                className="bg-[#5865F2] text-white hover:bg-[#4752c4]"
                onClick={redirectToDiscordLink}
              >
                <FaDiscord />
                Link Discord
              </Button>
            )}
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-lg p-8 shadow-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Organizer access</h2>
            {isOrganizer ? (
              <Badge variant="secondary">
                <span
                  aria-hidden
                  className="mr-1 size-2 rounded-full bg-green-600"
                />
                Active
              </Badge>
            ) : null}
          </div>
          {isOrganizer ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span>Payments</span>
                  <span className="text-muted-foreground text-xs">
                    Selling tickets is subject to the{' '}
                    <Link
                      to="/legal/organizer-payment-terms"
                      target="_blank"
                      className="underline underline-offset-2"
                    >
                      Organizer Payment Terms
                    </Link>
                    .
                  </span>
                </div>
                {(stripeStatus?.stripe_charges_enabled ?? false) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenDashboard}
                    disabled={isOpeningDashboard}
                  >
                    Stripe dashboard
                    {isOpeningDashboard ? <Spinner /> : null}
                  </Button>
                ) : (
                  <Button onClick={onSetupPayments} disabled={isStartingStripe}>
                    {(stripeStatus?.is_stripe_connected ?? false)
                      ? 'Continue setup'
                      : 'Set up payments'}
                  </Button>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span>Eventbrite</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={'secondary'}>Legacy</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Please setup payments through Stripe instead.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <a
                  href={`${config.apiUrl}/oauth2/eventbrite?redirect_uri=${config.appUrl}/account/authorize-eventbrite`}
                >
                  <Button disabled={user?.is_eventbrite_linked}>
                    {(user?.is_eventbrite_linked ?? false)
                      ? 'Eventbrite linked!'
                      : 'Link Eventbrite'}
                  </Button>
                </a>
              </div>
            </div>
          ) : (user?.has_organizer_request ?? false) ? (
            <p className="text-muted-foreground text-sm">
              Your organizer request is pending review.
            </p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground text-sm">
                Want to host meetups? Request organizer access.
              </span>
              <Button
                onClick={onRequestOrganizer}
                disabled={isRequestingOrganizer || user == null}
              >
                Request organizer access
                {isRequestingOrganizer ? <Spinner /> : null}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={showUnlinkConfirm}
        onOpenChange={(open) => {
          if (!open) setShowUnlinkConfirm(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Discord</DialogTitle>
            <DialogDescription>
              You'll lose access to any groups (and their meetups) you're in
              only through this Discord server. You can relink at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowUnlinkConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onUnlinkDiscord}
              disabled={isUnlinking}
            >
              Unlink
              {isUnlinking ? <Spinner /> : null}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPaymentTerms}
        onOpenChange={(open) => {
          if (!open) setShowPaymentTerms(false);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Organizer Payment Terms</DialogTitle>
            <DialogDescription>
              Review and agree to these terms before connecting your Stripe
              account. You can revisit them anytime from this page.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-4">
            <OrganizerPaymentTerms />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="agreePaymentTerms"
              checked={agreedToPaymentTerms}
              onCheckedChange={(checked) =>
                setAgreedToPaymentTerms(checked === true)
              }
            />
            <Label htmlFor="agreePaymentTerms" className="font-normal">
              I have read and agree to the Organizer Payment Terms
            </Label>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowPaymentTerms(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!agreedToPaymentTerms || isStartingStripe}
              onClick={() => {
                setShowPaymentTerms(false);
                startStripeOnboarding(true);
              }}
            >
              Agree and continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isStartingStripe ? (
        <div className="bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
          <Loader2 className="size-10 animate-spin" />
          <p className="text-muted-foreground">Redirecting to Stripe…</p>
        </div>
      ) : null}
    </Page>
  );
};

export default AccountPage;
