import { Box, Flex, Heading, type BoxProps } from '@chakra-ui/react';
import { useEffect, useState, type ReactNode } from 'react';
import { FiGift, FiHome, FiSettings, FiUsers } from 'react-icons/fi';
import { IoTicketOutline } from 'react-icons/io5';
import { useLocation, useParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { type SidebarItem } from '../components/Sidebar/Sidebar';
import { socket } from '../socket';
import { useAppDispatch } from '../store/hooks';
import { meetupSlice, useGetMeetupQuery } from '../store/meetupSlice';
import { organizerSlice } from '../store/organizerSlice';

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
  const dispatch = useAppDispatch();

  /**
   * Subscribe user to updates for the selected meetup. This will invalidate the
   * cache for the fetched meetup and attendees whenever a meetup is updated.
   */
  useEffect(() => {
    socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });

    socket.on('meetup:update', (payload) => {
      dispatch(
        meetupSlice.util.invalidateTags([
          { type: 'Meetup', id: payload.meetupId },
        ])
      );
      dispatch(
        organizerSlice.util.invalidateTags([
          { type: 'Attendees', id: payload.meetupId },
        ])
      );
    });

    // Stay subscribed to updates in case user comes back to page
  }, []);

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
    getSidebarValueFromPath()
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
