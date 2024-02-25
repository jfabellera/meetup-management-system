import { Box, Flex, Heading, type BoxProps } from '@chakra-ui/react';
import { useEffect, useState, type ReactNode } from 'react';
import { FiHome, FiSettings, FiUsers } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { type SidebarItem } from '../components/Sidebar/Sidebar';
import { useGetMeetupQuery } from '../store/meetupSlice';

interface OrganizerMeetupPageProps extends BoxProps {
  children: ReactNode;
}

const OrganizerMeetupPage = ({
  children,
  ...rest
}: OrganizerMeetupPageProps): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems: SidebarItem[] = [
    { name: 'Home', value: '', icon: FiHome },
    { name: 'Attendees', value: 'attendees', icon: FiUsers },
    { name: 'Meetup Settings', value: 'settings', icon: FiSettings },
  ];

  const [sidebarValue, setSidebarValue] = useState<string>(
    sidebarItems[0].value,
  );

  useEffect(() => {
    console.log(location);
    navigate(`/meetup/${meetupId}/manage/${sidebarValue}`);
  }, [sidebarValue]);

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
        <Box flexGrow={1} {...rest}>
          {children}
        </Box>
      </Flex>
    </Page>
  );
};

export default OrganizerMeetupPage;
