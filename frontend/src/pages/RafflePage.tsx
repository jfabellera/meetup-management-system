import {
  Box,
  Button,
  Flex,
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

  const handleClearDisplay = (): void => {
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
        <Button
          colorScheme={'green'}
          flexGrow={1}
          width={'100%'}
          onClick={handleClaim}
          isLoading={isClaimLoading}
          isDisabled={winner == null}
        >
          <Heading fontWeight={'medium'}>Claim</Heading>
        </Button>
        <Button
          colorScheme={'blackAlpha'}
          flexGrow={1}
          width={'100%'}
          onClick={handleRoll}
          isLoading={isRollLoading}
        >
          <Heading fontWeight={'medium'}>Roll</Heading>
        </Button>
        <Button
          colorScheme={'blackAlpha'}
          flexGrow={1}
          width={'100%'}
          onClick={handleDisplay}
          isLoading={isRollLoading}
        >
          <Heading fontWeight={'medium'}>Display winner</Heading>
        </Button>
        <Button
          colorScheme={'blackAlpha'}
          flexGrow={1}
          width={'100%'}
          onClick={handleClearDisplay}
          isLoading={isRollLoading}
        >
          <Heading fontWeight={'medium'}>Clear display</Heading>
        </Button>
      </VStack>
    </Flex>
  );
};

export default RafflePage;
