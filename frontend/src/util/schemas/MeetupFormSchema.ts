import * as Yup from 'yup';

const emptyToUndefined = (
  value: number,
  original: unknown
): number | undefined => (original === '' ? undefined : value);

const MeetupFormSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Required'),
  date: Yup.date()
    .min(new Date(), 'Date must be in the future')
    .required('Required'),
  startTime: Yup.string().required('Required'),
  address: Yup.string().required('Required'),
  duration: Yup.number()
    .transform(emptyToUndefined)
    .moreThan(0, 'Must be greater than 0')
    .required('Required'),
  capacity: Yup.number()
    .transform(emptyToUndefined)
    .moreThan(0, 'Must be greater than 0')
    .required('Required'),
  price: Yup.number()
    .transform(emptyToUndefined)
    .when('isPaid', {
      is: true,
      then: (schema) =>
        schema.moreThan(0, 'Must be greater than 0').required('Required'),
      otherwise: (schema) => schema.min(0, 'Must be non-negative'),
    }),
  imageKey: Yup.string(),
  defaultRaffleEntries: Yup.number()
    .transform(emptyToUndefined)
    .min(0, 'Must be non-negative')
    .required('Required'),
});

export default MeetupFormSchema;
