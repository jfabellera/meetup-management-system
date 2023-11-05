import { ReactNode } from 'react';
import {
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import Navbar from '../Navbar/Navbar';

export default function Page({ children }: { children: ReactNode }) {
  return (
    <Box display={{ base: 'flex' }} bg={useColorModeValue('gray.100', 'gray.900')}>
      <Navbar>
          {children}
      </Navbar>
    </Box>
  );
}
