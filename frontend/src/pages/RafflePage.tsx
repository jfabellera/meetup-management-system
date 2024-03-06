import { Box, Button, useToast } from '@chakra-ui/react';
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
    <Box>
      <Button onClick={handleRoll} isLoading={isRollLoading}>
        {winner == null ? 'Roll winner' : winner.displayName}
      </Button>
      <Button
        onClick={handleClaim}
        isLoading={isClaimLoading}
        isDisabled={winner == null}
      >
        Claim
      </Button>
    </Box>
  );
};

export default RafflePage;
