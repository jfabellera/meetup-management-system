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
import { useEffect, useState } from 'react';
import Page from '../components/Page/Page';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginRequest, type LoginPayload } from '../store/userSlice';

const LoginPage = (): JSX.Element => {
  const [login, setLogin] = useState<LoginPayload>({
    email: '',
    password: '',
  });
  const { loading, data, error } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setLogin({
      ...login,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    dispatch(loginRequest(login));
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
