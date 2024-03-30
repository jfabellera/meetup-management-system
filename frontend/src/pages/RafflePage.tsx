import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Link,
  Spacer,
  Switch,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
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
  const [isDisplayed, setIsDisplayed] = useState<boolean>(false);

  const toast = useToast({ position: 'top-right', duration: 2500 });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const formik = useFormik({
    initialValues: {
      rollQuantity: 1,
      displayOnRoll: false,
      clearOnClaim: false,
    },
    onSubmit: () => {},
  });

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
      setIsDisplayed(true);
    }
  };

  const handleClear = (): void => {
    setWinner(undefined);
    setIsDisplayed(false);
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
      } else {
        if (formik.values.displayOnRoll) {
          socket.emit('meetup:display', {
            meetupId,
            winner: rollResult.displayName,
          });
          setIsDisplayed(true);
        } else {
          socket.emit('meetup:display', { meetupId, winner: null });
          setIsDisplayed(false);
        }
      }

      setWinner(rollResult);
    }
  }, [isRollSuccess, rollResult]);

  useEffect(() => {
    if (isClaimSuccess) {
      toast({
        title: 'Success',
        status: 'success',
        description: `Raffle claimed by ${winner?.displayName}`,
      });

      if (formik.values.clearOnClaim) {
        handleClear();
      }
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
              <Text marginTop={'0.3rem'}>
                {winner.firstName} {winner.lastName}
              </Text>
            </>
          ) : (
            <Text lineHeight={'6rem'}>Click roll to select a winner</Text>
          )}
        </Box>
        <Spacer />
        <Link fontSize={'18px'} textDecoration={'underline'} onClick={onOpen}>
          More options
        </Link>
        <Grid
          width={'100%'}
          flexGrow={1}
          maxHeight={'350px'}
          templateRows="repeat(3, 1fr)"
          templateColumns="repeat(2, 1fr)"
          gap={4}
        >
          <GridItem rowSpan={1} colSpan={2}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={winner == null ? 'green' : 'blackAlpha'}
              onClick={handleRoll}
              isLoading={isRollLoading}
              isDisabled={winner != null}
              flexDir={'column'}
            >
              <Heading fontWeight={'medium'}>Roll</Heading>
              {formik.values.displayOnRoll ? (
                <Text fontSize={'14px'}>and display</Text>
              ) : null}
            </Button>
          </GridItem>
          <GridItem rowSpan={1} colSpan={2}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={
                winner != null && !isDisplayed ? 'green' : 'blackAlpha'
              }
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
              colorScheme={
                winner != null && isDisplayed ? 'green' : 'blackAlpha'
              }
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
              colorScheme={
                winner != null && isDisplayed
                  ? 'red'
                  : isDisplayed
                    ? 'yellow'
                    : 'blackAlpha'
              }
              onClick={handleClear}
            >
              <Heading fontWeight={'medium'}>Clear</Heading>
            </Button>{' '}
          </GridItem>
        </Grid>
      </VStack>

      <Drawer isOpen={isOpen} placement={'bottom'} onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Options</DrawerHeader>

          <DrawerBody>
            <VStack spacing={6}>
              <FormControl id={'rollQuantity'}>
                <FormLabel>Roll quantity</FormLabel>
                <Input
                  type={'number'}
                  inputMode={'numeric'}
                  value={formik.values.rollQuantity}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <FormControl
                id={'displayOnRoll'}
                display={'flex'}
                alignItems={'center'}
              >
                <FormLabel mb={0}>Display on roll</FormLabel>
                <Switch
                  isChecked={formik.values.displayOnRoll}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <FormControl
                id={'clearOnClaim'}
                display={'flex'}
                alignItems={'center'}
              >
                <FormLabel mb={0}>Clear on claim</FormLabel>
                <Switch
                  isChecked={formik.values.clearOnClaim}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <Box width={'100%'}>
                <Button width={'100%'} height={'3rem'} colorScheme={'red'}>
                  Roll all in
                </Button>
                <Text textAlign={'center'} marginTop={'0.25rem'}>
                  Previous winners are eligible to wins
                </Text>
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
};

export default RafflePage;
