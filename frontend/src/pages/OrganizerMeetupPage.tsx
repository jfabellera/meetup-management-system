import { Box, Heading } from '@chakra-ui/react';
import { useState } from 'react';
import { FiHome, FiSettings, FiUsers } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { type SidebarItem } from '../components/Sidebar/Sidebar';
import { useGetMeetupQuery } from '../store/meetupSlice';

const OrganizerMeetupPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));

  const sidebarItems: SidebarItem[] = [
    { name: 'Home', value: 'home', icon: FiHome },
    { name: 'Attendees', value: 'attendees', icon: FiUsers },
    { name: 'Meetup Settings', value: 'settings', icon: FiSettings },
  ];

  const [sidebarValue, setSidebarValue] = useState<string>(
    sidebarItems[0].value,
  );

  return (
    <Page
      sidebarItems={sidebarItems}
      sidebarValue={sidebarValue}
      setSidebarValue={setSidebarValue}
    >
      <Box padding={'1rem'}>
        <Heading>{meetup?.name}</Heading>
      </Box>
    </Page>
  );
};

export default OrganizerMeetupPage;
