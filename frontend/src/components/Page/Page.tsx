import { ReactNode } from 'react';
import {
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import PageContent from './PageContent';
import Sidebar from '../Sidebar/Sidebar';

export default function Page({ pageTitle, pageDescription, children }: { pageTitle: string; pageDescription: string; children: ReactNode }) {
  return (
    <Box display={{ base: 'flex' }} bg={useColorModeValue('gray.100', 'gray.900')}>
      <Sidebar>
        <PageContent
          pageTitle={pageTitle}
          pageDescription={pageDescription}>
          {children}
        </PageContent>
      </Sidebar>
    </Box>
  );
}