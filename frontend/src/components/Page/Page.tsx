import { ReactNode } from 'react';
import {
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import PageContent from './PageContent';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';

export default function Page({ pageTitle, pageDescription, children }: { pageTitle: string; pageDescription: string; children: ReactNode }) {
  return (
    <Box display={{ base: 'flex' }} bg={useColorModeValue('gray.100', 'gray.900')}>
      <Navbar>
        <PageContent
          pageTitle={pageTitle}
          pageDescription={pageDescription}>
          {children}
        </PageContent>
      </Navbar>
    </Box>
  );
}
