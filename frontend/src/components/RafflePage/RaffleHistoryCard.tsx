import {
  Box,
  Flex,
  Spacer,
  Stack,
  Tag,
  Text,
  type BoxProps,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import RelativeTime from 'dayjs/plugin/relativeTime';
import { type RaffleRecordResponse } from '../../../../backend/src/interfaces/rafflesInterfaces';

dayjs.extend(RelativeTime);

interface Props extends BoxProps {
  raffleRecord: RaffleRecordResponse;
}

const RaffleHistoryCard = ({ raffleRecord, ...rest }: Props): JSX.Element => {
  return (
    <Box
      width={'100%'}
      padding={'1rem'}
      background={'white'}
      borderRadius={'md'}
      boxShadow={'sm'}
      //   _hover={{ cursor: 'pointer' }}
      {...rest}
    >
      <Stack gap={1.5}>
        {raffleRecord.winners.map((winner, index) => (
          <Flex key={index} justifyContent={'space-between'}>
            <Text noOfLines={1}>{winner.displayName}</Text>
            {raffleRecord.winnersClaimed.includes(winner.ticketId) ? (
              <Tag colorScheme={'green'}>Claimed</Tag>
            ) : null}
          </Flex>
        ))}
        <Flex justifyContent={'space-between'} marginTop={'0.5rem'}>
          {raffleRecord.wasDisplayed ? (
            <Tag colorScheme={'yellow'}>Displayed</Tag>
          ) : (
            <Spacer />
          )}
          <Text>{dayjs(raffleRecord.createdAt).fromNow(true)}</Text>
        </Flex>
      </Stack>
    </Box>
  );
};

export default RaffleHistoryCard;
