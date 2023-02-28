import { Link, ListItem, Text, UnorderedList } from '@chakra-ui/react';
import Page from '../components/Page/Page'

export default function Home() {
  return (
    <Page
      pageTitle="Meetup Management System"
      pageDescription="This app aims to help streamline activites related to mechanical keyboard
      meetups for the Texas Mechanical Keyboards community.">
        <Text>To get started:</Text>
        <UnorderedList>
          <ListItem>Select an existing meetup from the sidebar.</ListItem>
          <ListItem><Link>Or import a new meetup list of attendees.</Link></ListItem>
        </UnorderedList>
    </Page> 
  );
}
