'use client';

import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page/Page';
import { register, type RegisterPayload } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';

const RegisterPage = (): JSX.Element => {
  const [registerPayload, setRegisterPayload] = useState<RegisterPayload>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /**
   * Handle form input changes. This updates the login payload to be dispatched.
   *
   * @param event
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRegisterPayload({
      ...registerPayload,
      [event.target.name]: event.target.value,
    });
  };

  /**
   * Handle form submit. This dispatches the register action using the register
   * payload.
   *
   * @param event
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    dispatch(register(registerPayload))
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
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <HStack>
                  <Box>
                    <FormControl id="firstName" isRequired>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        type="text"
                        name="firstName"
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl id="lastName" isRequired>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        type="text"
                        name="lastName"
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Box>
                </HStack>
                <FormControl id="nickName" isRequired>
                  <FormLabel>Display Name</FormLabel>
                  <Input type="text" name="nickName" onChange={handleChange} />
                </FormControl>
                <FormControl id="email" isRequired>
                  <FormLabel>Email address</FormLabel>
                  <Input type="email" name="email" onChange={handleChange} />
                </FormControl>
                <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl id="confirmPassword" isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input type="password" name="confirmPassword" />
                </FormControl>
                <FormControl id="requestOrganizer">
                  <Flex justify={'center'}>
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
