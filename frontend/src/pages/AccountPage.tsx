import { Button, Container, Heading, Link } from '@chakra-ui/react';
import Page from '../components/Page/Page';
import config from '../config';

const AccountPage = (): JSX.Element => {
  return (
    <Page>
      <Heading textAlign={'center'}>Account</Heading>
      <Container
        marginY={'1rem'}
        padding={'1rem'}
        background={'white'}
        borderRadius={'md'}
      >
        <Button>
          <Link
            href={`${config.apiUrl}:${config.apiPort}/oauth2/eventbrite?redirect_uri=http://localhost:5173/account/authorize-eventbrite`}
          >
            Link Eventbrite
          </Link>
        </Button>
      </Container>
    </Page>
  );
};

export default AccountPage;
