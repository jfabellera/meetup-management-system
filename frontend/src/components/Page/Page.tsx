import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { type ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';

const Page = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <Flex
      direction="column"
      height="100vh"
      bg={useColorModeValue('gray.100', 'gray.900')}
    >
      <Navbar />
      <Box w="auto" p="6" overflow="auto">
        {children}
      </Box>
    </Flex>
  );
};

export default Page;
