import { Box, Flex, Heading, type BoxProps } from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';
import { FiHome, FiSettings, FiUsers } from 'react-icons/fi';
import { useLocation, useParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { type SidebarItem } from '../components/Sidebar/Sidebar';
import { useGetMeetupQuery } from '../store/meetupSlice';

interface ManageMeetupPageProps extends BoxProps {
  children: ReactNode;
}

const ManageMeetupPage = ({
  children,
  ...rest
}: ManageMeetupPageProps): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Home',
      value: 'home',
      icon: FiHome,
      url: `/meetup/${meetupId}/manage`,
    },
    {
      name: 'Attendees',
      value: 'attendees',
      icon: FiUsers,
      url: `/meetup/${meetupId}/manage/attendees`,
    },
    {
      name: 'Meetup Settings',
      value: 'settings',
      icon: FiSettings,
      url: `/meetup/${meetupId}/manage/settings`,
    },
  ];

  const [sidebarValue, setSidebarValue] = useState<string>(
    sidebarItems.filter((item) => item.url === location.pathname)[0].value,
  );

  return (
    <Page
      sidebarItems={sidebarItems}
      sidebarValue={sidebarValue}
      setSidebarValue={setSidebarValue}
    >
      <Flex direction={'column'} height={'100%'}>
        <Heading width={'100%'} textAlign={'center'} marginTop={'1rem'}>
          {meetup?.name}
        </Heading>
        <Box flexGrow={1} padding={'1rem'} {...rest}>
          {children}
        </Box>
      </Flex>
    </Page>
  );
};

export default ManageMeetupPage;
