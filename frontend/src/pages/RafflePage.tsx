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
  Switch,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { type RaffleWinnerInfo } from '../../../backend/src/interfaces/rafflesInterfaces';
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
  const [winners, setWinners] = useState<RaffleWinnerInfo[] | undefined>(
    undefined
  );
  const [claimIndex, setClaimIndex] = useState<number>(0);
  const [claimedArray, setClaimedArray] = useState<boolean[]>([]); // Used for disabling buttons on batch rolls
  const [raffleRecordId, setRaffleRecordId] = useState<number | null>(null);
  const [isDisplayed, setIsDisplayed] = useState<boolean>(false);
  const [isAllIn, setIsAllIn] = useState<boolean>(false);

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
      await rollRaffleWinner({
        meetupId,
        payload: { quantity: formik.values.rollQuantity },
      });
    })();
    setIsAllIn(false);
  };

  const handleRollAllIn = (): void => {
    void (async () => {
      await rollRaffleWinner({ meetupId, payload: { allIn: true } });
      onClose();
      setIsAllIn(true);
    })();
  };

  const handleClaim = (event: React.MouseEvent<HTMLButtonElement>): void => {
    const winnerIndex = Number(event.currentTarget.id);
    setClaimIndex(winnerIndex);
    void (async () => {
      if (raffleRecordId != null && winners != null) {
        await claimRaffleWinner({
          ticketId: winners[winnerIndex].ticketId,
          payload: { raffleRecordId, force: isAllIn },
        });
      }
    })();
  };

  const handleDisplay = (): void => {
    if (winners != null) {
      socket.emit('meetup:display', {
        meetupId,
        winners: winners.map((winner) => winner.displayName),
        isBatchRoll: formik.values.rollQuantity > 1,
      });
      setIsDisplayed(true);
    }
  };

  const handleClear = (): void => {
    setWinners(undefined);
    setIsDisplayed(false);
    setIsAllIn(false);
    socket.emit('meetup:display', { meetupId, winner: null });
  };

  useEffect(() => {
    if (isRollSuccess && rollResult != null) {
      if (rollResult.winners.length === 0) {
        toast({
          title: 'Roll failed',
          status: 'warning',
          description: 'No eligible attendees',
        });
      } else {
        if (formik.values.displayOnRoll) {
          socket.emit('meetup:display', {
            meetupId,
            winner: rollResult.winners[0],
          });
          setIsDisplayed(true);
        } else {
          socket.emit('meetup:display', { meetupId, winner: null });
          setIsDisplayed(false);
        }
      }

      setRaffleRecordId(rollResult.raffleRecordId);
      setWinners(rollResult.winners);

      // Initialize claimed status array for batch rolls
      if (formik.values.rollQuantity > 1) {
        const temp: boolean[] = [];
        rollResult.winners.forEach(() => {
          temp.push(false);
        });
        setClaimedArray(temp);
      }
    }
  }, [isRollSuccess, rollResult]);

  useEffect(() => {
    if (isClaimSuccess && winners != null) {
      toast({
        title: 'Success',
        status: 'success',
        description: `Raffle claimed by ${winners[claimIndex].displayName}`,
      });

      if (formik.values.clearOnClaim) {
        handleClear();
      }

      setIsAllIn(false);

      if (formik.values.rollQuantity === 1) {
        setWinners(undefined);
      } else {
        // Update claimed status array
        setClaimedArray((claimed) => {
          const temp = [...claimed];
          temp[claimIndex] = true;
          return temp;
        });
      }
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
        <Box
          textAlign={'center'}
          flexGrow={1}
          width={'100%'}
          overflow={'scroll'}
        >
          {winners != null && winners.length > 0 ? (
            formik.values.rollQuantity > 1 ? (
              <Box height={0}>
                {/* Display for batch roll */}
                <Text>WINNERS</Text>
                <VStack>
                  {winners.map((winner, index) => {
                    return (
                      <Flex
                        key={index}
                        width={'100%'}
                        textAlign={'left'}
                        flexDirection={'row'}
                        justifyContent={'space-between'}
                      >
                        <Text fontSize={'2xl'}>
                          {`${index + 1}. ${winner.displayName}`}
                        </Text>
                        <Button
                          colorScheme={
                            winners != null && isDisplayed
                              ? 'green'
                              : 'blackAlpha'
                          }
                          id={String(index)}
                          onClick={handleClaim}
                          isDisabled={claimedArray[index]}
                        >
                          Claim
                        </Button>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>
            ) : (
              <>
                {/* DIsplay for single person roll */}
                <Text>WINNER</Text>
                <Heading size={'4xl'} fontWeight={'medium'}>
                  {winners[0].displayName ?? ''}
                </Heading>
                <Text marginTop={'0.3rem'}>
                  {winners[0].firstName} {winners[0].lastName}
                </Text>
                {winners[0].wins > 0 ? (
                  <Text textColor={'red'}>
                    {winners[0].wins} win{winners[0].wins > 1 ? 's' : null}
                  </Text>
                ) : null}
              </>
            )
          ) : (
            <Text lineHeight={'6rem'}>Click roll to select a winner</Text>
          )}
        </Box>
        <Link fontSize={'18px'} textDecoration={'underline'} onClick={onOpen}>
          More options
        </Link>
        <Grid
          width={'100%'}
          templateRows={
            formik.values.rollQuantity > 1
              ? 'repeat(2, 100px)'
              : 'repeat(3, 100px)'
          }
          templateColumns="repeat(2, 1fr)"
          gap={2}
        >
          <GridItem rowSpan={1} colSpan={2}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={winners == null ? 'green' : 'blackAlpha'}
              onClick={handleRoll}
              isLoading={isRollLoading}
              isDisabled={winners != null}
              flexDir={'column'}
            >
              <Heading fontWeight={'medium'}>
                Roll{' '}
                {formik.values.rollQuantity > 1
                  ? formik.values.rollQuantity
                  : null}
              </Heading>
              {formik.values.displayOnRoll ? (
                <Text fontSize={'14px'}>and display</Text>
              ) : null}
            </Button>
          </GridItem>
          <GridItem
            rowSpan={1}
            colSpan={formik.values.rollQuantity > 1 ? 1 : 2}
          >
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={
                winners != null && !isDisplayed ? 'green' : 'blackAlpha'
              }
              onClick={handleDisplay}
              isDisabled={winners == null}
            >
              <Heading fontWeight={'medium'}>Display</Heading>
            </Button>
          </GridItem>
          {formik.values.rollQuantity === 1 ? (
            <GridItem colSpan={1}>
              <Button
                width={'100%'}
                height={'100%'}
                colorScheme={
                  winners != null && isDisplayed ? 'green' : 'blackAlpha'
                }
                id={'0'}
                onClick={handleClaim}
                isLoading={isClaimLoading}
                isDisabled={winners == null}
              >
                <Heading fontWeight={'medium'}>Claim</Heading>
              </Button>
            </GridItem>
          ) : null}
          <GridItem colSpan={1}>
            <Button
              width={'100%'}
              height={'100%'}
              colorScheme={
                winners != null && isDisplayed
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
              {/* TODO(jan): Implement logic */}
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
                <Button
                  width={'100%'}
                  height={'3rem'}
                  colorScheme={'red'}
                  onClick={handleRollAllIn}
                  isDisabled={winners != null}
                >
                  Roll all in
                </Button>
                <Text textAlign={'center'} marginTop={'0.25rem'}>
                  Previous winners are eligible to win
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
