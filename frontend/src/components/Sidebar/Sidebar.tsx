import {
  Box,
  CloseButton,
  Drawer,
  DrawerContent,
  Flex,
  Icon,
  useColorModeValue,
  type BoxProps,
  type FlexProps,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';

/**
 * Adapted from https://chakra-templates.vercel.app/navigation/sidebar
 */

export interface SidebarItem {
  name: string;
  icon: IconType;
}

interface SidebarProps {
  sidebarItems: SidebarItem[];
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({
  sidebarItems,
  isOpen,
  onClose,
}: SidebarProps): JSX.Element => {
  return (
    <Box height="100%" bg={useColorModeValue('gray.100', 'gray.900')}>
      <SidebarContent
        sidebarItems={sidebarItems}
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        // size="full"
      >
        <DrawerContent>
          <SidebarContent sidebarItems={sidebarItems} onClose={onClose} />
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

interface SidebarContentProps extends BoxProps {
  sidebarItems: SidebarItem[];
  onClose: () => void;
}

const SidebarContent = ({
  sidebarItems,
  onClose,
  ...rest
}: SidebarContentProps): JSX.Element => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      h="full"
      paddingY={'0.5rem'}
      {...rest}
    >
      <Flex justify={'right'}>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {sidebarItems.map((link) => (
        <NavItem key={link.name} icon={link.icon}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  children: ReactNode;
}

const NavItem = ({ icon, children, ...rest }: NavItemProps): JSX.Element => {
  return (
    <Box
      as="a"
      href="#"
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'cyan.400',
          color: 'white',
        }}
        {...rest}
      >
        {icon != null && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'white',
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Box>
  );
};

export default Sidebar;