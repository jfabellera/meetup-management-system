import { Flex, Heading } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';

const MeetupDisplayPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });
    // Resubscribe on reconnection after losing connection
    socket.on('connect', () => {
      socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });
    });

    socket.on('meetup:display', (payload) => {
      setWinner(payload.winner);
    });
  }, []);

  return (
    <Flex height={'100vh'} justify={'center'} align={'center'}>
      <Heading size={'4xl'} fontWeight={'semibold'}>
        {winner ?? ''}
      </Heading>
    </Flex>
  );
};

export default MeetupDisplayPage;
