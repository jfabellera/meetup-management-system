import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/field';
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
import { USERNAME_REGEX, usernameField } from '@keebmeet/shared';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { DiscordLoginButton } from '../components/Auth/DiscordLoginButton';
import Page from '../components/Page/Page';
import ImageUploadField from '../components/shared/ImageUploadField';
import { usePendingUploads } from '../hooks/usePendingUploads';
import { register } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  useCheckUsernameAvailableQuery,
  useUploadUserImageMutation,
} from '../store/userSlice';
import { zodFormResolver } from '../util/zodFormResolver';

const RegisterSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Required')
      .regex(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Invalid email'
      ),
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    nickName: z.string().min(1, 'Required'),
    username: usernameField,
    password: z
      .string()
      .min(1, 'Required')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
        'Must contain 8 characters, one uppercase, one lowercase, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Required'),
    turnstileToken: z.string().min(1, 'Captcha verification is required'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

const FIELD_LABELS = {
  nickName: 'Display name',
  username: 'Username',
  email: 'Email address',
  firstName: 'First name',
  lastName: 'Last name',
  password: 'Password',
  confirmPassword: 'Confirm password',
  turnstileToken: 'Captcha',
};

interface FormValues {
  email: string;
  firstName: string;
  lastName: string;
  nickName: string;
  username: string;
  password: string;
  confirmPassword: string;
  requestOrganizer: boolean;
  turnstileToken: string;
  profilePhotoKey: string;
  profilePhotoUrl: string;
}

const RegisterPage = (): ReactNode => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { isUploading, onUploadingChange } = usePendingUploads();
  // Availability is checked against the server, so it validates outside the schema.
  const [extraErrors, setExtraErrors] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    mode: 'onTouched',
    resolver: zodFormResolver<FormValues>(RegisterSchema, extraErrors),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      nickName: '',
      username: '',
      password: '',
      confirmPassword: '',
      requestOrganizer: false,
      turnstileToken: '',
      // profilePhotoUrl is the preview; profilePhotoKey is submitted.
      profilePhotoKey: '',
      profilePhotoUrl: '',
    },
  });

  const username = useWatch({ control: form.control, name: 'username' });
  const profilePhotoUrl = useWatch({
    control: form.control,
    name: 'profilePhotoUrl',
  });

  const usernameValid = USERNAME_REGEX.test(username);
  const { data: usernameCheck } = useCheckUsernameAvailableQuery(
    { username },
    { skip: !usernameValid }
  );
  const usernameTaken = usernameValid && usernameCheck?.available === false;
  useEffect(() => {
    setExtraErrors(usernameTaken ? { username: 'Username is taken' } : {});
  }, [usernameTaken]);

  const onSubmit = (values: FormValues): void => {
    dispatch(register(values))
      .then((action) => {
        // Get status of register
        if (register.fulfilled.match(action)) {
          // Successfully registered, prompt the user to verify their email.
          toast.success('Account created', {
            description: 'Check your email for a link to verify your account.',
          });
          void navigate('/login');
        } else if (register.rejected.match(action)) {
          // Failed to register, show an error message
          // TODO(jan)
          // Turnstile tokens are single-use, so reset the widget to let the
          // user try again with a fresh one.
          turnstileRef.current?.reset();
          form.setValue('turnstileToken', '');
        }
      })
      .catch(() => {});
  };

  return (
    <Page>
      <div className="flex items-center justify-center p-4">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
          <div className="flex flex-col items-center">
            <h1 className="text-center text-4xl font-bold">Sign up</h1>
          </div>
          <div className="bg-card text-card-foreground rounded-lg p-8 shadow-lg">
            <Form {...form}>
              <form
                onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
                noValidate
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center">
                    <ImageUploadField
                      className="w-40"
                      label="Profile Photo (optional)"
                      aspectRatio={1}
                      rounded
                      useUploadMutation={useUploadUserImageMutation}
                      previewUrl={profilePhotoUrl}
                      onUploaded={(imageKey, imageUrl) => {
                        form.setValue('profilePhotoKey', imageKey);
                        form.setValue('profilePhotoUrl', imageUrl);
                      }}
                      onUploadingChange={onUploadingChange}
                      onRemove={() => {
                        form.setValue('profilePhotoKey', '');
                        form.setValue('profilePhotoUrl', '');
                      }}
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-muted-foreground shrink-0 text-xs font-semibold tracking-[0.14em] uppercase">
                        Public · shown on your profile
                      </h2>
                      <Separator className="flex-1" />
                    </div>
                    <FormField
                      control={form.control}
                      name="nickName"
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
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-muted-foreground shrink-0 text-xs font-semibold tracking-[0.14em] uppercase">
                        Private · only visible to you
                      </h2>
                      <Separator className="flex-1" />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <FormItem
                          data-invalid={error === 409 || fieldState.invalid}
                        >
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          {error === 409 ? (
                            <FieldError>Email is already in use</FieldError>
                          ) : (
                            <FormMessage />
                          )}
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
                        Password
                      </h2>
                      <Separator className="flex-1" />
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
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
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="requestOrganizer"
                    render={({ field }) => (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <Label htmlFor="requestOrganizer" className="pr-4">
                          Are you an organizer?
                        </Label>
                        <Checkbox
                          id="requestOrganizer"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                        <span>Yes</span>
                      </div>
                    )}
                  />
                  <div
                    id="turnstileToken"
                    tabIndex={-1}
                    className="flex flex-col items-center gap-2 pt-2 outline-none"
                  >
                    <Turnstile
                      ref={turnstileRef}
                      siteKey="0x4AAAAAADvKnjEaFlmjd5Yq"
                      onSuccess={(token) => {
                        form.setValue('turnstileToken', token, {
                          shouldValidate: true,
                        });
                      }}
                      onExpire={() => {
                        form.setValue('turnstileToken', '');
                      }}
                      onError={() => {
                        form.setValue('turnstileToken', '');
                      }}
                    />
                    {form.formState.errors.turnstileToken != null ? (
                      <FieldError>
                        {form.formState.errors.turnstileToken.message}
                      </FieldError>
                    ) : null}
                  </div>
                  <FormErrorSummary<FormValues> labels={FIELD_LABELS} />
                  <div className="flex flex-col gap-10 pt-2">
                    <Button
                      type="submit"
                      disabled={loading || isUploading}
                      size="lg"
                    >
                      Sign up
                      {loading ? <Loader2 className="animate-spin" /> : null}
                    </Button>
                    <DiscordLoginButton />
                  </div>
                  {error != null ? (
                    <p className="text-destructive text-center text-sm">
                      Registration failed
                    </p>
                  ) : null}
                  <div className="pt-2">
                    <p className="text-center">
                      Already a user?{' '}
                      <span
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer text-blue-500"
                        onClick={() => {
                          void navigate('/login');
                        }}
                      >
                        Login
                      </span>
                    </p>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default RegisterPage;
