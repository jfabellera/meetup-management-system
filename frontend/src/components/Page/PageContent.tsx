import { ReactNode } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
} from '@chakra-ui/react';

export default function PageContent(
  {
    pageTitle,
    pageDescription = '',
    children
  }: {
    pageTitle: string;
    pageDescription: string;
    children: ReactNode 
  }) {
  return (
    <VStack spacing="1em" alignItems="left">
      <Heading>
        {pageTitle}
      </Heading>
      <Box className="page-description">
        <Text fontStyle='italic' color='gray.600'>
          {pageDescription}
        </Text>
      </Box>
      <Box>
        {children}
      </Box>
    </VStack>
  );
}
