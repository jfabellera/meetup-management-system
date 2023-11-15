import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Page from '../components/Page/Page';
import { login, type LoginPayload } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const LoginPage = (): JSX.Element => {
  const [loginPayload, setLoginPayload] = useState<LoginPayload>({
    email: '',
    password: '',
  });
  const { loading } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /**
   * Handle form input changes. This updates the login payload to be dispatched.
   *
   * @param event
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLoginPayload({
      ...loginPayload,
      [event.target.name]: event.target.value,
    });
  };

  /**
   * Handle form submit. This dispatches the login action using the login
   * payload.
   *
   * @param event
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    dispatch(login(loginPayload))
      .then((action) => {
        // Get status of login
        if (login.fulfilled.match(action)) {
          // Successfully logged in, redirect user to homepage
          navigate('/');
        } else if (login.rejected.match(action)) {
          // Failed to login, show an error message
          // TODO(jan): handle invalid login
        }
      })
      .catch(() => {});
  };

  return (
    <Page>
      <Flex align={'center'} justify={'center'}>
        <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
          <Stack align={'center'}>
            <Heading fontSize={'4xl'}>Sign in</Heading>
          </Stack>
          <Box
            rounded={'lg'}
            bg={useColorModeValue('white', 'gray.700')}
            boxShadow={'lg'}
            p={8}
          >
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl id="email">
                  <FormLabel>Email address</FormLabel>
                  <Input type="email" name="email" onChange={handleChange} />
                </FormControl>
                <FormControl id="password">
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    name="password"
                    onChange={handleChange}
                  />
                </FormControl>
                <Button
                  type="submit"
                  bg={'blue.400'}
                  color={'white'}
                  isLoading={loading}
                  _hover={{
                    bg: 'blue.500',
                  }}
                >
                  Sign in
                </Button>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Flex>
    </Page>
  );
};

export default LoginPage;
