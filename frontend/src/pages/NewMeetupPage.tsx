import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Stack,
  useColorModeValue,
  useToast,
  type BoxProps,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import Page from '../components/Page/Page';
import { useCreateMeetupMutation } from '../store/meetupSlice';

const NewMeetupSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Required'),
  date: Yup.date()
    .min(new Date(), 'Date must be in the future')
    .required('Required'),
  startTime: Yup.string().required('Required'),
  address: Yup.string().required('Required'),
  duration: Yup.number()
    .moreThan(0, 'Must be greater than 0')
    .required('Required'),
  capacity: Yup.number()
    .moreThan(0, 'Must be greater than 0')
    .required('Required'),
  imageUrl: Yup.string().required('Required'),
});

const NewMeetupPage = (): JSX.Element => {
  const [createMeetup] = useCreateMeetupMutation();
  const navigate = useNavigate();
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
      const result = await createMeetup({
        name: formik.values.name,
        date: new Date(
          `${formik.values.date}T${formik.values.startTime}Z`,
        ).toISOString(),
        address: formik.values.address,
        duration_hours: formik.values.duration,
        capacity: formik.values.capacity,
        image_url: formik.values.imageUrl,
        has_raffle: false, // TODO(jan)
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
        navigate('/organizer');
      }
    },
    validationSchema: NewMeetupSchema,
    validateOnMount: true,
  });

  const ErrorMessage = ({ children }: BoxProps): JSX.Element => {
    return (
      <FormErrorMessage justifyContent={'right'}>{children}</FormErrorMessage>
    );
  };

  return (
    <Page>
      <Container padding={0} maxWidth={'contanier.md'}>
        <Stack padding={0} mx={'auto'} maxW={'lg'}>
          <Heading fontSize={'4xl'} textAlign={'center'}>
            New Meetup
          </Heading>
          <Box
            rounded={'lg'}
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow={'lg'}
            p={8}
          >
            <form onSubmit={formik.handleSubmit} noValidate>
              <Stack spacing={4}>
                <FormControl
                  id="name"
                  isRequired
                  isInvalid={formik.errors.name != null && formik.touched.name}
                  minWidth={0}
                >
                  <FormLabel noOfLines={1}>Meetup Name</FormLabel>
                  <Input
                    type="text"
                    name="name"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.name}</ErrorMessage>
                </FormControl>

                <HStack align={'baseline'}>
                  <FormControl
                    id="date"
                    isRequired
                    isInvalid={
                      formik.errors.date != null && formik.touched.date
                    }
                    minWidth={0}
                  >
                    <FormLabel noOfLines={1}>Date</FormLabel>
                    <Input
                      type="date"
                      name="date"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <ErrorMessage>{formik.errors.date}</ErrorMessage>
                  </FormControl>

                  <FormControl
                    id="startTime"
                    isRequired
                    isInvalid={
                      formik.errors.startTime != null &&
                      formik.touched.startTime
                    }
                    minWidth={0}
                  >
                    <FormLabel noOfLines={1}>Start Time</FormLabel>
                    <Input
                      type="time"
                      name="startTime"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <ErrorMessage>{formik.errors.startTime}</ErrorMessage>
                  </FormControl>
                </HStack>

                <HStack align={'baseline'}>
                  <FormControl
                    id="duration"
                    isRequired
                    isInvalid={
                      formik.errors.duration != null && formik.touched.duration
                    }
                    minWidth={0}
                  >
                    <FormLabel noOfLines={1} wordBreak={'break-all'}>
                      Duration (hours)
                    </FormLabel>
                    <Input
                      type="number"
                      name="duration"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <ErrorMessage>{formik.errors.duration}</ErrorMessage>
                  </FormControl>

                  <FormControl
                    id="capacity"
                    isRequired
                    isInvalid={
                      formik.errors.capacity != null && formik.touched.capacity
                    }
                    minWidth={0}
                  >
                    <FormLabel noOfLines={1}>Capacity</FormLabel>
                    <Input
                      type="number"
                      name="capacity"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <ErrorMessage>{formik.errors.capacity}</ErrorMessage>
                  </FormControl>
                </HStack>

                <FormControl
                  id="address"
                  isRequired
                  isInvalid={
                    formik.errors.address != null && formik.touched.address
                  }
                  minWidth={0}
                >
                  <FormLabel noOfLines={1}>Address</FormLabel>
                  <Input
                    type="text"
                    name="address"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.address}</ErrorMessage>
                </FormControl>

                <FormControl
                  id="imageUrl"
                  isRequired
                  isInvalid={
                    formik.errors.imageUrl != null && formik.touched.imageUrl
                  }
                  minWidth={0}
                >
                  <FormLabel noOfLines={1}>Image URL</FormLabel>
                  <Input
                    type="text"
                    name="imageUrl"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.imageUrl}</ErrorMessage>
                </FormControl>

                {/* TODO(jan) */}
                {/* <FormControl id="has_raffle">
                  <Stack direction="row">
                    <FormLabel margin={0} pr="4">
                      Will this meetup have raffles?
                    </FormLabel>
                    <Checkbox>Yes</Checkbox>
                  </Stack>
                </FormControl> */}

                <Button
                  type="submit"
                  loadingText="Submitting"
                  disabled={!formik.isValid}
                  size="lg"
                  bg={'blue.400'}
                  color={'white'}
                  _hover={{
                    bg: 'blue.500',
                  }}
                >
                  Create
                </Button>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Container>
    </Page>
  );
};

export default NewMeetupPage;
