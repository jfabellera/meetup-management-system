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
    undefined,
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
          height={'6rem'}
          width={'100%'}
          onClick={handleClaim}
          isLoading={isClaimLoading}
          isDisabled={winner == null}
        >
          CLAIM
        </Button>
        <Button
          colorScheme={'blackAlpha'}
          flexGrow={1}
          width={'100%'}
          onClick={handleRoll}
          isLoading={isRollLoading}
        >
          <Heading size={'4xl'} fontWeight={'medium'}>
            ROLL
          </Heading>
        </Button>
      </VStack>
    </Flex>
  );
};

export default RafflePage;
