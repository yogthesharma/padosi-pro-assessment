import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { TextField } from './TextField';

type FormTextFieldProps<T extends FieldValues> = Omit<ComponentProps<typeof TextField>, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T, any, any>;
  name: Path<T>;
};

/** TextField wired to react-hook-form, showing the field's validation message inline. */
export function FormTextField<T extends FieldValues>({ control, name, ...props }: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={field.ref}
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
