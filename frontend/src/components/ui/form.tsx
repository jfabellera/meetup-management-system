import { cn } from '@/lib/utils';
import { Slot } from 'radix-ui';
import { createContext, useContext, type ComponentProps } from 'react';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from './field';

const Form = FormProvider;

const FormFieldContext = createContext<{ name: string } | null>(null);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ControllerProps<TFieldValues, TName>
) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  if (fieldContext == null) {
    throw new Error('useFormField must be used within <FormField>');
  }

  const { getFieldState } = useFormContext();
  const fieldState = getFieldState(
    fieldContext.name,
    useFormState({ name: fieldContext.name })
  );

  return {
    name: fieldContext.name,
    formItemId: fieldContext.name,
    formDescriptionId: `${fieldContext.name}-description`,
    formMessageId: `${fieldContext.name}-error`,
    ...fieldState,
  };
};

const FormItem = ({ className, ...props }: ComponentProps<typeof Field>) => {
  const { error } = useFormField();

  return (
    <Field
      data-slot="form-item"
      data-invalid={error != null}
      className={cn('gap-1.5', className)}
      {...props}
    />
  );
};

const FormLabel = ({
  className,
  ...props
}: ComponentProps<typeof FieldLabel>) => {
  const { error, formItemId } = useFormField();

  return (
    <FieldLabel
      data-slot="form-label"
      data-error={error != null}
      htmlFor={formItemId}
      className={className}
      {...props}
    />
  );
};

const FormControl = (props: ComponentProps<typeof Slot.Root>) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        error == null
          ? formDescriptionId
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={error != null}
      {...props}
    />
  );
};

const FormDescription = ({
  className,
  ...props
}: ComponentProps<typeof FieldDescription>) => {
  const { formDescriptionId } = useFormField();

  return (
    <FieldDescription
      data-slot="form-description"
      id={formDescriptionId}
      className={className}
      {...props}
    />
  );
};

const FormMessage = ({
  className,
  children,
  ...props
}: ComponentProps<typeof FieldError>) => {
  const { error, formMessageId } = useFormField();
  const body = error != null ? String(error.message ?? '') : children;

  if (!body) return null;

  return (
    <FieldError
      data-slot="form-message"
      id={formMessageId}
      className={className}
      {...props}
    >
      {body}
    </FieldError>
  );
};

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
