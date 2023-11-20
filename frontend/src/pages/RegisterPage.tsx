'use client';

import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Stack,
  Text,
  useColorModeValue,
  type BoxProps,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import Page from '../components/Page/Page';
import { register } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  firstName: Yup.string().required('Required'),
  lastName: Yup.string().required('Required'),
  nickName: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

const RegisterPage = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      nickName: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: (values) => {
      dispatch(register(values))
        .then((action) => {
          // Get status of register
          if (register.fulfilled.match(action)) {
            // Successfully registered, redirect user to login page
            navigate('/login');
          } else if (register.rejected.match(action)) {
            // Failed to register, show an error message
            // TODO(jan)
          }
        })
        .catch(() => {});
    },
    validationSchema: RegisterSchema,
  });

  const ErrorMessage = ({ children }: BoxProps): JSX.Element => {
    return (
      <FormErrorMessage position="absolute" right="0" margin="1">
        {children}
      </FormErrorMessage>
    );
  };

  return (
    <Page>
      <Flex align={'center'} justify={'center'}>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={6} px={6}>
          <Stack align={'center'}>
            <Heading fontSize={'4xl'} textAlign={'center'}>
              Sign up
            </Heading>
          </Stack>
          <Box
            rounded={'lg'}
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow={'lg'}
            p={8}
          >
            <form onSubmit={formik.handleSubmit} noValidate>
              <Stack spacing={4}>
                <HStack>
                  <Box>
                    <FormControl
                      id="firstName"
                      isRequired
                      isInvalid={
                        formik.errors.firstName != null &&
                        formik.touched.firstName
                      }
                    >
                      <FormLabel>First Name</FormLabel>
                      <Input
                        type="text"
                        name="firstName"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <ErrorMessage>{formik.errors.firstName}</ErrorMessage>
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl
                      id="lastName"
                      isRequired
                      isInvalid={
                        formik.errors.lastName != null &&
                        formik.touched.lastName
                      }
                    >
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        type="text"
                        name="lastName"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <ErrorMessage>{formik.errors.lastName}</ErrorMessage>
                    </FormControl>
                  </Box>
                </HStack>
                <FormControl
                  id="nickName"
                  isRequired
                  isInvalid={
                    formik.errors.nickName != null && formik.touched.nickName
                  }
                >
                  <FormLabel>Display Name</FormLabel>
                  <Input
                    type="text"
                    name="nickName"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.nickName}</ErrorMessage>
                </FormControl>
                <FormControl
                  id="email"
                  isRequired
                  isInvalid={
                    formik.errors.email != null && formik.touched.email
                  }
                >
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.email}</ErrorMessage>
                </FormControl>
                <FormControl
                  id="password"
                  isRequired
                  isInvalid={
                    formik.errors.password != null && formik.touched.password
                  }
                >
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.password}</ErrorMessage>
                </FormControl>
                <FormControl
                  id="confirmPassword"
                  isRequired
                  isInvalid={
                    formik.errors.confirmPassword != null &&
                    formik.touched.confirmPassword
                  }
                >
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    name="confirmPassword"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <ErrorMessage>{formik.errors.confirmPassword}</ErrorMessage>
                </FormControl>
                <FormControl id="requestOrganizer">
                  <Flex justify={'center'} mt="2">
                    <Stack direction="row">
                      <FormLabel margin={0} pr="4">
                        Are you an organizer?
                      </FormLabel>
                      <Checkbox>Yes</Checkbox>
                    </Stack>
                  </Flex>
                </FormControl>
                <Stack spacing={10} pt={2}>
                  <Button
                    type="submit"
                    loadingText="Submitting"
                    size="lg"
                    bg={'blue.400'}
                    color={'white'}
                    _hover={{
                      bg: 'blue.500',
                    }}
                  >
                    Sign up
                  </Button>
                </Stack>
                <Stack pt={2}>
                  <Text align={'center'}>
                    Already a user?{' '}
                    <Link href={'/login'} color={'blue.400'}>
                      Login
                    </Link>
                  </Text>
                </Stack>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Flex>
    </Page>
  );
};

export default RegisterPage;
