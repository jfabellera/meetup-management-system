import { Box, Flex, Heading, Image, Text, VStack } from '@chakra-ui/react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMeasure from 'react-use-measure';
import { socket } from '../socket';
import { useGetMeetupDisplayAssetsQuery } from '../store/meetupSlice';

// Durstenfeld shuffle taken from https://stackoverflow.com/a/12646864
const shuffleArray = (array: any[]): any[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const MeetupDisplayPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const [displayState, setDisplayState] = useState<'idle' | 'raffle winner'>(
    'idle'
  );
  const [raffleType, setRaffleType] = useState<'single' | 'batch'>('single');
  const { data: displayAssets } = useGetMeetupDisplayAssetsQuery(
    Number(meetupId)
  );
  const [idleImageIndex, setIdleImageIndex] = useState<number>(0);
  const [winners, setWinners] = useState<string[] | null>(null);
  const [losers, setLosers] = useState<string[] | null>(null);

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
      setLosers(payload.losers);
      setRaffleType(payload.isBatchRoll === true ? 'batch' : 'single');
      if (payload.winners != null) {
        setDisplayState('raffle winner');
      } else {
        setDisplayState('idle');
      }
    });
  }, []);

  useEffect(() => {
    if (
      displayAssets?.idleImageUrls == null ||
      displayAssets.idleImageUrls.length <= 1
    )
      return;

    // If there are multiple images, cycle through them periodically
    const intervalId = setInterval(() => {
      // Don't change image if display is idle
      if (displayState !== 'idle') return;

      const idleImageCount = displayAssets.idleImageUrls?.length ?? 0;

      setIdleImageIndex(
        (previousIndex) => (previousIndex + 1) % idleImageCount
      );
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [displayAssets, displayState]);

  useEffect(() => {
    if (height === 0) return;
    if (winners == null) return;

    const initialY = -height;
    const finalY = 72;

    void (async () => {
      await animate(yTranslation, [initialY, finalY], {
        // ease: 'backOut',
        type: 'spring',
        // stiffness: 20,
        // mass: 10,
        damping: 50,
      });
    })();
  }, [yTranslation, height, winners]);

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
          <>
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
          </>
        ) : (
          <>
            <Box
              position={'absolute'}
              height={'33%'}
              width={'66%'}
              overflow={'clip'}
            >
              <motion.div
                style={{ width: '100%', textAlign: 'center', y: yTranslation }}
              >
                <VStack
                  position={'absolute'}
                  width={'100%'}
                  spacing={5}
                  ref={ref}
                >
                  <Text fontSize={'144px'} noOfLines={1}>
                    {winners[0]}
                  </Text>
                  {losers != null
                    ? shuffleArray(losers).map((loser, index) => (
                        <Text key={index} fontSize={'144px'} noOfLines={1}>
                          {loser}
                        </Text>
                      ))
                    : null}
                </VStack>
              </motion.div>
            </Box>
          </>
        )
      ) : displayAssets?.idleImageUrls != null &&
        displayAssets.idleImageUrls.length > 0 ? (
        <Image
          width={'100%'}
          height={'100%'}
          objectFit={'contain'}
          background={'black'}
          src={displayAssets.idleImageUrls[idleImageIndex]}
        />
      ) : null}
    </Flex>
  );
};

export default MeetupDisplayPage;
