import { Button, Container, Heading, HStack, Spacer } from '@chakra-ui/react';
import Page from '../components/Page/Page';

const OrganizerDashboard = (): JSX.Element => {
  return (
    <Page>
      <Container padding={0}>
        <HStack>
          <Heading fontWeight={'semibold'}>Your Meetups</Heading>
          <Spacer />
          <Button colorScheme={'green'}>New meetup</Button>
        </HStack>
      </Container>
    </Page>
  );
};

export default OrganizerDashboard;
