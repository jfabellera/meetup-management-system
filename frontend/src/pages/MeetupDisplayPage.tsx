import { Flex, Heading, Image } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { useGetMeetupIdleImagesQuery } from '../store/meetupSlice';

const MeetupDisplayPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const [displayState, setDisplayState] = useState<'idle' | 'raffle winner'>(
    'idle'
  );
  const { data: idleImages } = useGetMeetupIdleImagesQuery(Number(meetupId));
  const [idleImageIndex, setIdleImageIndex] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });
    // Resubscribe on reconnection after losing connection
    socket.on('connect', () => {
      socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });
    });

    socket.on('meetup:display', (payload) => {
      setWinner(payload.winner);
      if (payload.winner != null) {
        setDisplayState('raffle winner');
      } else {
        setDisplayState('idle');
      }
    });
  }, []);

  useEffect(() => {
    if (idleImages == null || idleImages.length <= 1) return;

    // If there are multiple images, cycle through them periodically
    const intervalId = setInterval(() => {
      // Don't change image if display is idle
      if (displayState !== 'idle') return;

      setIdleImageIndex(
        (previousIndex) => (previousIndex + 1) % idleImages.length
      );
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [idleImages, displayState]);

  return (
    <Flex height={'100vh'} justify={'center'} align={'center'}>
      {displayState === 'raffle winner' ? (
        <Heading size={'4xl'} fontWeight={''}>
          {winner ?? ''}
        </Heading>
      ) : idleImages != null && idleImages.length > 0 ? (
        <Image
          width={'100%'}
          height={'100%'}
          objectFit={'contain'}
          background={'black'}
          src={idleImages[idleImageIndex]}
        />
      ) : null}
    </Flex>
  );
};

export default MeetupDisplayPage;
