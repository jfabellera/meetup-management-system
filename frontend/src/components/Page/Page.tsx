import { Box, Flex, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { type ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';
import Sidebar, { type SidebarItem } from '../Sidebar/Sidebar';

export interface PageProps {
  children: ReactNode;
  sidebarItems?: SidebarItem[];
}

const Page = ({ sidebarItems, children }: PageProps): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex
      direction="column"
      height="100svh"
      bg={useColorModeValue('gray.100', 'gray.900')}
    >
      <Navbar sidebar={sidebarItems != null} onOpen={onOpen} />
      <Box height={'full'} w="auto" overflow="auto">
        {sidebarItems != null ? (
          <Flex direction={'row'} height={'100%'}>
            <Sidebar
              sidebarItems={sidebarItems}
              isOpen={isOpen}
              onClose={onClose}
            />
            <Box flexGrow={1}>{children}</Box>
          </Flex>
        ) : (
          children
        )}
      </Box>
    </Flex>
  );
};

export default Page;
