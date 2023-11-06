import { ReactNode, useEffect, useState } from 'react';
import {
  Box,
  BoxProps,
  CloseButton,
  Drawer,
  DrawerContent,
  Flex,
  FlexProps,
  Icon,
  IconButton,
  Avatar,
  Text,
  Button,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Center,
} from '@chakra-ui/react';
import {
  FiAward,
  FiDatabase,
  FiGift,
  FiHome,
  FiList,
  FiMenu,
  FiUserCheck,
} from 'react-icons/fi';
import { IconType } from 'react-icons';
// import { MoonIcon, SunIcon } from '@chakra-ui/icons'

interface Props {
  children: React.ReactNode;
}

/**
 * Adapted from https://chakra-templates.dev/navigation/navbar
 */

interface LinkItemProps {
  name: string;
  url: string;
  icon: IconType;
}
const LinkItems: Array<LinkItemProps> = [
  // { name: 'Home', url: '.', icon: FiHome },
];

const NavLink = (props: Props) => {
  const { children } = props;

  return (
    <Box
      as="a"
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      href={'#'}
    >
      {children}
    </Box>
  );
};

export default function Nav({ children }: { children: ReactNode }) {
  // const { colorMode, toggleColorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Box
        minH="100vh"
        width="100%"
        bg={useColorModeValue('gray.100', 'gray.900')}
      >
        <Flex
          px={4}
          h={16}
          w="full"
          alignItems={'center'}
          justifyContent={'space-between'}
          bg={useColorModeValue('white', 'gray.900')}
          borderBottom="1px"
          borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Link href=".">
            <Box> {import.meta.env.VITE_APP_TITLE} </Box>
          </Link>
          <NavbarDropdown />
        </Flex>

        <Box w="auto" ml={{ base: 'full' }} p="6">
          {children}
        </Box>
      </Box>
    </>
  );
}

interface NavbarProps extends BoxProps {
  onClose: () => void;
}

const NavbarDropdown = ({ onClose, ...rest }: NavbarProps) => {
  return (
    <Flex alignItems={'center'}>
      <Stack direction={'row'} spacing={7}>
        {/* <Button onClick={toggleColorMode}>
          {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        </Button> */}

        <Menu>
          <MenuButton
            as={Button}
            rounded={'full'}
            variant={'link'}
            cursor={'pointer'}
            minW={0}
          >
            <Avatar
              size={'sm'}
              src={'https://avatars.dicebear.com/api/male/username.svg'}
            />
          </MenuButton>
          <MenuList alignItems={'center'}>
            <br />
            <Center>
              <Avatar
                size={'2xl'}
                src={'https://avatars.dicebear.com/api/male/username.svg'}
              />
            </Center>
            <br />
            <Center>
              <p>Username</p>
            </Center>
            <br />
            <MenuDivider />
            {LinkItems.map((link) => (
              <NavItem key={link.name} icon={link.icon} url={link.url}>
                {link.name}
              </NavItem>
            ))}
          </MenuList>
        </Menu>
      </Stack>
    </Flex>
  );
};

interface NavItemProps extends FlexProps {
  icon: IconType;
  url: string;
  children: ReactNode;
}
const NavItem = ({ icon, url, children, ...rest }: NavItemProps) => {
  return (
    <Link
      href={url}
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
        {icon && (
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
    </Link>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 24 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent="flex-start"
      {...rest}
    >
      <IconButton
        variant="outline"
        onClick={onOpen}
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text fontSize="xl" ml="8" fontWeight="bold">
        {import.meta.env.VITE_APP_TITLE}
      </Text>
    </Flex>
  );
};
