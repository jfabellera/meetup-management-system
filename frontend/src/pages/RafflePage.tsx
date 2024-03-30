import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { type RaffleWinnerResponse } from '../../../backend/src/interfaces/rafflesInterfaces';
import { socket } from '../socket';
import {
  useClaimRaffleWinnerMutation,
  useRollRaffleWinnerMutation,
} from '../store/organizerSlice';

const RafflePage = (): JSX.Element => {
  const { meetupId: meetupIdParam } = useParams();
  const meetupId = parseInt(meetupIdParam ?? '');
  const [
    rollRaffleWinner,
    {
      isSuccess: isRollSuccess,
      isError: isRollError,
      isLoading: isRollLoading,
      data: rollResult,
    },
  ] = useRollRaffleWinnerMutation();
  const [
    claimRaffleWinner,
    {
      isSuccess: isClaimSuccess,
      isError: isClaimError,
      isLoading: isClaimLoading,
    },
  ] = useClaimRaffleWinnerMutation();
  const [winner, setWinner] = useState<RaffleWinnerResponse | undefined>(
    undefined
  );

  const toast = useToast();

  const handleRoll = (): void => {
    void (async () => {
      await rollRaffleWinner(meetupId);
      socket.emit('meetup:display', { meetupId, winner: null });
    })();
  };

  const handleClaim = (): void => {
    void (async () => {
      if (winner != null) {
        await claimRaffleWinner(winner.ticketId);
      }
    })();
  };

  const handleDisplay = (): void => {
    if (winner != null) {
      socket.emit('meetup:display', { meetupId, winner: winner.displayName });
    }
  };

  const handleClear = (): void => {
    setWinner(undefined);
    socket.emit('meetup:display', { meetupId, winner: null });
  };

  useEffect(() => {
    if (isRollSuccess) {
      if (rollResult == null) {
        toast({
          title: 'Roll failed',
          status: 'warning',
          description: 'No eligible attendees',
        });
      }
      setWinner(rollResult);
    }
  }, [isRollSuccess]);

  useEffect(() => {
    if (isClaimSuccess) {
      toast({
        title: 'Success',
        status: 'success',
        description: `Raffle claimed by ${winner?.displayName}`,
      });
      setWinner(undefined);
    }
  }, [isClaimSuccess]);

  useEffect(() => {
    if (isRollError || isClaimError) {
      toast({
        title: 'Error',
        status: 'error',
        description: 'Action failed',
      });
    }
  }, [isRollError, isClaimError]);

  return (
    <Flex justify={'center'} height={'100%'}>
      <VStack
        spacing={4}
        height={'100%'}
        padding={'1rem'}
        width={'100%'}
        maxWidth={'800px'}
      >
        <Box textAlign={'center'} height={'6rem'}>
          {winner != null ? (
            <>
              <Text>WINNER</Text>
              <Heading size={'4xl'} fontWeight={'medium'}>
                {winner.displayName ?? ''}
              </Heading>
            </>
          ) : (
            <Text lineHeight={'6rem'}>Click roll to select a winner</Text>
          )}
        </Box>
        <Grid
          width={'100%'}
          flexGrow={1}
          templateRows="repeat(3, 1fr)"
          templateColumns="repeat(2, 1fr)"
          gap={4}
        >
          <GridItem rowSpan={1} colSpan={2}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={'blackAlpha'}
              onClick={handleRoll}
              isLoading={isRollLoading}
              isDisabled={winner != null}
            >
              <Heading fontWeight={'medium'}>Roll</Heading>
            </Button>
          </GridItem>
          <GridItem rowSpan={1} colSpan={2}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={'blackAlpha'}
              onClick={handleDisplay}
              isDisabled={winner == null}
            >
              <Heading fontWeight={'medium'}>Display winner</Heading>
            </Button>
          </GridItem>
          <GridItem colSpan={1}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={'blackAlpha'}
              onClick={handleClaim}
              isLoading={isClaimLoading}
              isDisabled={winner == null}
            >
              <Heading fontWeight={'medium'}>Claim</Heading>
            </Button>
          </GridItem>
          <GridItem colSpan={1}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={'blackAlpha'}
              onClick={handleClear}
            >
              <Heading fontWeight={'medium'}>Clear</Heading>
            </Button>{' '}
          </GridItem>
        </Grid>
      </VStack>
    </Flex>
  );
};

export default RafflePage;
