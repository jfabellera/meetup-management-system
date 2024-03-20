import { Box, Flex, Heading, type BoxProps } from '@chakra-ui/react';
import { useEffect, useState, type ReactNode } from 'react';
import { FiGift, FiHome, FiSettings, FiUsers } from 'react-icons/fi';
import { IoTicketOutline } from 'react-icons/io5';
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
      name: 'Check-in',
      value: 'checkin',
      icon: IoTicketOutline,
      url: `/meetup/${meetupId}/manage/checkin`,
    },
    {
      name: 'Raffle',
      value: 'raffle',
      icon: FiGift,
      url: `/meetup/${meetupId}/manage/raffle`,
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

  const getSidebarValueFromPath = (): string => {
    return sidebarItems.filter((item) => item.url === location.pathname)[0]
      .value;
  };

  const [sidebarValue, setSidebarValue] = useState<string>(
    getSidebarValueFromPath(),
  );

  useEffect(() => {
    setSidebarValue(getSidebarValueFromPath());
  }, [location]);

  return (
    <Page
      sidebarItems={sidebarItems}
      sidebarValue={sidebarValue}
      setSidebarValue={setSidebarValue}
    >
      <Flex direction={'column'} height={'100%'} overflow={'scroll'}>
        <Heading
          width={'100%'}
          textAlign={'center'}
          marginTop={'1rem'}
          noOfLines={2}
          paddingX={'1.5rem'}
        >
          {meetup?.name}
        </Heading>
        <Box flexGrow={1} {...rest}>
          {children}
        </Box>
      </Flex>
    </Page>
  );
};

export default ManageMeetupPage;
