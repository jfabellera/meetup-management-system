import { ReactNode, useEffect, useState } from 'react'
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
  Link,
  Select,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import {
  FiAward,
  FiDatabase,
  FiGift,
  FiHome,
  FiList,
  FiMenu,
  FiUserCheck,
} from 'react-icons/fi'
import { IconType } from 'react-icons'
import MeetupDropdown from './MeetupDropdown'

/**
 * Adapted from https://chakra-templates.dev/navigation/sidebar
 */

interface LinkItemProps {
  name: string
  url: string
  icon: IconType
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'Home', url: '.', icon: FiHome },
  { name: 'Check-In', url: './checkin', icon: FiUserCheck },
  { name: 'Raffle', url: './raffle', icon: FiGift },
  { name: 'Typing Test', url: './typing_test', icon: FiAward },
  { name: 'View Attendees', url: './attendees', icon: FiList },
  { name: 'Import Attendees', url: './import', icon: FiDatabase },
]

export default function Sidebar({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box minH="100vh" width='100%' bg={useColorModeValue('gray.100', 'gray.900')}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav
        display={{ base: 'flex', md: 'none' }}
        onOpen={onOpen} />
      <Box w='auto' ml={{ base: 'full', md: 60 }} p="6">
        {children}
      </Box>
    </Box>
  )
}

interface SidebarProps extends BoxProps {
  onClose: () => void
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}>
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="l" fontWeight="bold">
          {import.meta.env.VITE_APP_TITLE}
        </Text>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem key={link.name} icon={link.icon} url={link.url}>
          {link.name}
        </NavItem>
      ))}
      <MeetupDropdown />
    </Box>
  )
}

interface NavItemProps extends FlexProps {
  icon: IconType
  url: string
  children: ReactNode
}
const NavItem = ({ icon, url, children, ...rest }: NavItemProps) => {
  return (
    <Link href={url} style={{ textDecoration: 'none' }} _focus={{ boxShadow: 'none' }}>
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
        {...rest}>
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
  )
}

interface MobileProps extends FlexProps {
  onOpen: () => void
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
      {...rest}>
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
  )
}
