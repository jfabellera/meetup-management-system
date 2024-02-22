import { Box, Heading } from '@chakra-ui/react';
import { FiHome, FiSettings, FiUsers } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { type SidebarItem } from '../components/Sidebar/Sidebar';
import { useGetMeetupQuery } from '../store/meetupSlice';

const OrganizerMeetupPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));

  const sidebarItems: SidebarItem[] = [
    { name: 'Home', icon: FiHome },
    { name: 'Attendees', icon: FiUsers },
    { name: 'Meetup Settings', icon: FiSettings },
  ];

  return (
    <Page sidebarItems={sidebarItems}>
      <Box padding={'1rem'}>
        <Heading>{meetup?.name}</Heading>
      </Box>
    </Page>
  );
};

export default OrganizerMeetupPage;
