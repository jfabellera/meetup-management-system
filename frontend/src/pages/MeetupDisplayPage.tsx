import { Box, Flex, Heading, Image, VStack } from '@chakra-ui/react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMeasure from 'react-use-measure';
import { socket } from '../socket';
import { useGetMeetupIdleImagesQuery } from '../store/meetupSlice';

const losers = [
  'Oliver',
  'Emma',
  'Liam',
  'Ava',
  'Noah',
  'Sophia',
  'Jackson',
  'Isabella',
  'Ethan',
  'Mia',
  'James',
  'Charlotte',
  'Alexander',
  'Amelia',
  'Lucas',
  'Harper',
  'Mason',
  'Ella',
  'Michael',
  'Evelyn',
  'Elijah',
  'Abigail',
  'William',
  'Emily',
  'Benjamin',
  'Sofia',
  'Logan',
  'Avery',
  'Jacob',
  'Scarlett',
  'Daniel',
  'Chloe',
  'Matthew',
  'Luna',
  'Henry',
  'Zoe',
  'Sebastian',
  'Penelope',
  'David',
  'Lily',
  'Owen',
  'Grace',
  'Jack',
  'Hannah',
  'Jackson',
  'Lila',
  'Grayson',
  'Natalie',
  'Leo',
  'Brooklyn',
  'Luke',
  'Ellie',
  'Josiah',
  'Leah',
  'Nathan',
  'Savannah',
  'Jaxon',
  'Aria',
  'Wyatt',
  'Camila',
  'Hunter',
  'Chloe',
  'Connor',
  'Victoria',
  'Christian',
  'Madison',
  'Jonathan',
  'Sophie',
  'Thomas',
  'Hailey',
  'Carter',
  'Riley',
  'Dominic',
  'Layla',
  'Nicholas',
  'Hazel',
  'Zachary',
  'Ellie',
  'Josiah',
  'Lillian',
  'Hunter',
  'Scarlett',
  'Cameron',
  'Aubrey',
  'Aidan',
  'Stella',
  'Asher',
  'Audrey',
  'Julian',
  'Mila',
  'Easton',
  'Aria',
  'Eli',
  'Savannah',
  'Isaac',
  'Elena',
  'Jeremiah',
  'Ella',
  'Levi',
  'Brooklyn',
  'Xavier',
  'Samantha',
  'Josiah',
  'Madelyn',
  'Landon',
  'Ariana',
  'Levi',
  'Skylar',
  'Eli',
  'Charlotte',
];

const MeetupDisplayPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const [displayState, setDisplayState] = useState<'idle' | 'raffle winner'>(
    'idle'
  );
  const [raffleType, setRaffleType] = useState<'single' | 'batch'>('single');
  const { data: idleImages } = useGetMeetupIdleImagesQuery(Number(meetupId));
  const [idleImageIndex, setIdleImageIndex] = useState<number>(0);
  const [winners, setWinners] = useState<string[] | null>(null);

  const [ref, { height }] = useMeasure();
  const yTranslation = useMotionValue(0);

  useEffect(() => {
    socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });
    // Resubscribe on reconnection after losing connection
    socket.on('connect', () => {
      socket.emit('meetup:subscribe', { meetupId: Number(meetupId) });
    });

    socket.on('meetup:display', (payload) => {
      setWinners(payload.winners);
      setRaffleType(payload.isBatchRoll === true ? 'batch' : 'single');
      if (payload.winners != null) {
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

  useEffect(() => {
    if (height === 0) return;

    const initialY = -height;
    const finalY = -height / 2 - 44;

    void (async () => {
      await animate(yTranslation, [initialY, finalY], {
        // ease: 'backOut',
        type: 'spring',
        // stiffness: 20,
        mass: 10,
        damping: 50,
      });
    })();
  }, [yTranslation, height]);

  return (
    <Flex
      height={'100vh'}
      justify={'center'}
      align={'center'}
      direction={'column'}
    >
      {displayState === 'raffle winner' &&
      winners != null &&
      winners.length > 0 ? (
        raffleType === 'batch' ? (
          <VStack spacing={4}>
            {winners.map((winner, index) => {
              return (
                <Box key={index} textAlign={'left'} width={'100%'}>
                  <Heading size={'4xl'} fontWeight={''}>
                    {`${index + 1}. ${winner}`}
                  </Heading>
                </Box>
              );
            })}
          </VStack>
        ) : (
          <>
            <Heading position={'absolute'} left={'20%'}>
              {'>'}
            </Heading>
            <Heading position={'absolute'} right={'20%'}>
              {'<'}
            </Heading>

            <motion.div
              style={{ width: '100%', textAlign: 'center', y: yTranslation }}
            >
              <VStack
                position={'absolute'}
                width={'100%'}
                spacing={4}
                ref={ref}
              >
                <Heading size={'4xl'} fontWeight={''}>
                  {winners[0]}
                </Heading>
                {losers.map((loser, index) => (
                  <Heading key={index} size={'4xl'} fontWeight={''}>
                    {loser}
                  </Heading>
                ))}

                <Heading size={'4xl'} fontWeight={''}>
                  {winners[0]}
                </Heading>
                {losers.map((loser, index) => (
                  <Heading key={index} size={'4xl'} fontWeight={''}>
                    {loser}
                  </Heading>
                ))}
              </VStack>
            </motion.div>
          </>
        )
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
