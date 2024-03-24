import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Spacer,
  Text,
  useBoolean,
  useToast,
  type InputProps,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useFormik } from 'formik';
import { useEffect } from 'react';
import { FiEdit } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { type EditMeetupPayload } from '../../../backend/src/util/validator';
import { useEditMeetupMutation, useGetMeetupQuery } from '../store/meetupSlice';
import MeetupFormSchema from '../util/schemas/MeetupFormSchema';

dayjs.extend(customParseFormat);

interface FieldDisplayProps extends InputProps {
  name: string;
  value: string | number | undefined;
  id: string;
  errorMessage: string | undefined;
  editable: boolean;
}

const FieldDisplay = ({
  name,
  value,
  id,
  type,
  isInvalid,
  onChange,
  onBlur,
  errorMessage,
  editable,
  ...rest
}: FieldDisplayProps): JSX.Element => {
  return (
    <Box paddingY={'0.5rem'} maxWidth={'sm'} {...rest}>
      <FormControl id={id} isInvalid={isInvalid} minWidth={0}>
        <FormLabel noOfLines={1} marginBottom={'0.2rem'}>
          {name}
        </FormLabel>
        {editable ? (
          <>
            <Input
              type={type}
              name={id}
              onChange={onChange}
              onBlur={onBlur}
              defaultValue={value}
            />

            <FormErrorMessage justifyContent={'right'}>
              {errorMessage}
            </FormErrorMessage>
          </>
        ) : (
          <>
            <Text textColor={'blackAlpha.700'}>{value ?? 'N/A'}</Text>
          </>
        )}
      </FormControl>
    </Box>
  );
};

const ManageMeetupSettingsPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? '0'));
  const [editable, setEditable] = useBoolean(false);
  const [editMeetup] = useEditMeetupMutation();
  const toast = useToast();
  const formik = useFormik({
    initialValues: {
      name: '',
      date: '',
      startTime: '',
      address: '',
      duration: 0,
      capacity: 0,
      imageUrl: '',
    },
    onSubmit: async (values) => {
      const payload: EditMeetupPayload = {};
      if (formik.initialValues.name !== values.name) payload.name = values.name;
      if (
        formik.initialValues.date !== values.date ||
        formik.initialValues.startTime !== values.startTime
      )
        payload.date = new Date(
          `${values.date}T${values.startTime}Z`
        ).toISOString();
      if (formik.initialValues.address !== values.address)
        payload.address = values.address;
      if (formik.initialValues.duration !== values.duration)
        payload.duration_hours = values.duration;
      if (formik.initialValues.capacity !== values.capacity)
        payload.capacity = values.capacity;
      if (formik.initialValues.imageUrl !== values.imageUrl)
        payload.image_url = values.imageUrl;

      const result = await editMeetup({
        meetupId: parseInt(meetupId ?? '0'),
        payload,
      });

      if ('error' in result && 'data' in result.error) {
        // is this allowed
        const data: any = result.error.data;
        toast({
          title: 'Error creating meetup',
          description: data.message,
          status: 'error',
          isClosable: true,
        });
      } else {
        setEditable.off();
      }
    },
    validationSchema: MeetupFormSchema,
    validateOnMount: true,
  });

  useEffect(() => {
    formik.resetForm({
      values: {
        name: meetup?.name ?? '',
        date: dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format('YYYY-MM-DD'),
        startTime: dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format('hh:mm'),
        address: meetup?.location.full_address ?? '',
        duration: meetup?.duration_hours ?? 0,
        capacity: meetup?.tickets?.total ?? 0,
        imageUrl: meetup?.image_url ?? '',
      },
    });
  }, [meetup]);

  useEffect(() => {
    if (!editable) {
      formik.resetForm();
    }
  }, [editable]);

  return (
    <Box
      background={'white'}
      borderRadius={'md'}
      boxShadow={'sm'}
      padding={{ base: '1rem', md: '1.5rem' }}
      margin={{ base: '0.5rem', md: '1rem' }}
    >
      <HStack>
        <Heading size={'lg'} marginBottom={'0.5rem'}>
          Settings
        </Heading>
        <Spacer />
        <Button
          variant={'ghost'}
          leftIcon={<FiEdit />}
          onClick={setEditable.toggle}
        >
          Edit
        </Button>
      </HStack>
      <form onSubmit={formik.handleSubmit} noValidate>
        <FieldDisplay
          name={'Meetup Name'}
          value={meetup?.name}
          editable={editable}
          id={'name'}
          type={'text'}
          isInvalid={formik.errors.name != null && formik.touched.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.errors.name}
        />
        <FieldDisplay
          name={'Date'}
          value={dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format(
            'YYYY-MM-DD'
          )}
          editable={editable}
          id={'date'}
          type={'date'}
          isInvalid={formik.errors.date != null && formik.touched.date}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.errors.date}
        />
        <FieldDisplay
          name={'Start Time'}
          value={dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format('HH:mm')}
          editable={editable}
          id={'startTime'}
          type={'time'}
          isInvalid={
            formik.errors.startTime != null && formik.touched.startTime
          }
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.errors.startTime}
        />
        <FieldDisplay
          name={'Address'}
          value={meetup?.location.full_address}
          editable={editable}
          id={'address'}
          type={'text'}
          isInvalid={formik.errors.address != null && formik.touched.address}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.errors.address}
        />
        <FieldDisplay
          name={'Duration (hours)'}
          value={meetup?.duration_hours}
          editable={editable}
          id={'duration'}
          type={'number'}
          isInvalid={formik.errors.duration != null && formik.touched.duration}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.errors.duration}
        />
        <FieldDisplay
          name={'Capacity'}
          value={meetup?.tickets?.total}
          editable={editable}
          id={'capacity'}
          type={'number'}
          isInvalid={formik.errors.capacity != null && formik.touched.capacity}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          errorMessage={formik.errors.capacity}
        />
        {/* TODO(jan): Add imageURL */}
        {/* TODO(jan): Add description */}
        {editable ? (
          <HStack>
            <Spacer />
            <Button
              type="submit"
              loadingText="Save"
              isDisabled={!formik.isValid}
              size="lg"
              bg={'blue.400'}
              color={'white'}
              _hover={{
                bg: 'blue.500',
              }}
            >
              Save
            </Button>
          </HStack>
        ) : null}
      </form>
    </Box>
  );
};

export default ManageMeetupSettingsPage;
