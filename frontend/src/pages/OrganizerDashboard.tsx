import { Button, Container, Heading, HStack, Spacer } from '@chakra-ui/react';
import { MeetupOrganizerCard } from '../components/Meetups/MeetupOrganizerCard';
import Page from '../components/Page/Page';

const OrganizerDashboard = (): JSX.Element => {
  return (
    <Page>
      <Container padding={0} maxWidth={'container.md'}>
        <HStack marginBottom={'1rem'}>
          <Heading fontWeight={'semibold'}>Your Meetups</Heading>
          <Spacer />
          <Button colorScheme={'green'}>New meetup</Button>
        </HStack>
        <MeetupOrganizerCard
          name={'TexMechs Keyboard Roundup 2024'}
          date={'2024-04-27T13:00:00-05:00'}
          imageUrl={
            'https://media.discordapp.net/attachments/1149502169041621062/1182553630407135292/Eventbrite.jpg?ex=65851de4&is=6572a8e4&hm=bdc554f39abecd6436f4f344518f68c845a4340da137ad76ebfc258c034464cc&=&format=webp&width=2592&height=1296'
          }
          ticketsAvailable={45}
          ticketsTotal={300}
        />
      </Container>
    </Page>
  );
};

export default OrganizerDashboard;
