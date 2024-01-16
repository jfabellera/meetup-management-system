import {
  Avatar,
  Box,
  type BoxProps,
  Button,
  Center,
  Flex,
  type FlexProps,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { HamburgerIcon } from '@chakra-ui/icons';
import { MdAdminPanelSettings } from 'react-icons/all';

/**
 * Adapted from https://chakra-templates.dev/navigation/navbar
 */

interface LinkItemProps {
  name: string;
  url: string;
  icon: IconType;
}

/**
 * Items to be placed in the navbar dropdown.
 */
const LinkItems: LinkItemProps[] = [
  // { name: 'Home', url: '.', icon: FiHome },
];

const Nav = (): JSX.Element => {
  const { isLoggedIn, user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();

  return (
    <>
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
        <Menu>
          <MenuButton
              as={IconButton}
              aria-label='Options'
              icon={<HamburgerIcon />}
              variant='outline'
          />
          <MenuList>
            <MenuItem icon={<MdAdminPanelSettings />} onClick={() => {navigate('/admin');}}>
              Admin Dashboard
            </MenuItem>
          </MenuList>
        </Menu>
        <Link
          onClick={() => {
            navigate('/');
          }}
        >
          <Box> {import.meta.env.VITE_APP_TITLE} </Box>
        </Link>
        {/* TODO(jan): Make dependent on logged in state */}
        {isLoggedIn ? (
          <NavbarDropdown nickname={user.nick_name} />
        ) : (
          <GuestButtons />
        )}
      </Flex>
    </>
  );
};

/**
 * Sign in and sign up buttons for when a user is not logged in.
 */
const GuestButtons = (): JSX.Element => {
  const navigate = useNavigate();
  return (
    <Stack
      flex={{ base: 1, md: 0 }}
      justify={'flex-end'}
      direction={'row'}
      spacing={6}
    >
      <Button
        as={'a'}
        fontSize={'sm'}
        fontWeight={400}
        variant={'link'}
        onClick={() => {
          navigate('/login');
        }}
      >
        Sign In
      </Button>
      <Button
        as={'a'}
        display={{ base: 'none', md: 'inline-flex' }}
        fontSize={'sm'}
        fontWeight={600}
        color={'white'}
        bg={'pink.400'}
        onClick={() => {
          navigate('/register');
        }}
        _hover={{
          bg: 'pink.300',
        }}
      >
        Sign Up
      </Button>
    </Stack>
  );
};

interface NavbarDropdownProps extends BoxProps {
  nickname: string;
}

const NavbarDropdown = (props: NavbarDropdownProps): JSX.Element => {
  const { nickname } = props;
  const dispatch = useAppDispatch();

  return (
    <Flex alignItems={'center'}>
      <Stack direction={'row'} spacing={7}>
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
              <p>{nickname}</p>
            </Center>
            <br />
            <MenuDivider />
            {LinkItems.map((link) => (
              <NavItem key={link.name} icon={link.icon} url={link.url}>
                {link.name}
              </NavItem>
            ))}
            <NavItem
              key="logout"
              icon={FiLogOut}
              onClick={() => {
                dispatch(logout());
              }}
              url=""
            >
              Logout
            </NavItem>
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

const NavItem = ({
  icon,
  url,
  children,
  ...rest
}: NavItemProps): JSX.Element => {
  const navigate = useNavigate();
  return (
    <Link
      onClick={() => {
        navigate(url);
      }}
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
        <Icon
          mr="4"
          fontSize="16"
          _groupHover={{
            color: 'white',
          }}
          as={icon}
        />
        {children}
      </Flex>
    </Link>
  );
};

// interface MobileProps extends FlexProps {
//   onOpen: () => void;
// }

// const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
//   return (
//     <Flex
//       ml={{ base: 0, md: 60 }}
//       px={{ base: 4, md: 24 }}
//       height="20"
//       alignItems="center"
//       bg={useColorModeValue('white', 'gray.900')}
//       borderBottomWidth="1px"
//       borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
//       justifyContent="flex-start"
//       {...rest}
//     >
//       <IconButton
//         variant="outline"
//         onClick={onOpen}
//         aria-label="open menu"
//         icon={<FiMenu />}
//       />

//       <Text fontSize="xl" ml="8" fontWeight="bold">
//         {import.meta.env.VITE_APP_TITLE}
//       </Text>
//     </Flex>
//   );
// };

export default Nav;
