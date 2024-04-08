import { Flex, Text, VStack, type FlexProps } from '@chakra-ui/react';
import { useGetRaffleHistoryQuery } from '../../store/organizerSlice';
import RaffleHistoryCard from './RaffleHistoryCard';

interface Props extends FlexProps {
  meetupId: number;
}

const RaffleHistoryList = ({ meetupId, ...rest }: Props): JSX.Element => {
  const { data: raffleRecords } = useGetRaffleHistoryQuery(meetupId);

  return (
    <Flex {...rest}>
      {raffleRecords != null && raffleRecords.length > 0 ? (
        <VStack>
          {raffleRecords.map((record, index) => (
            <RaffleHistoryCard key={index} raffleRecord={record} />
          ))}
        </VStack>
      ) : (
        <Text>No previous rolls</Text>
      )}
    </Flex>
  );
};

export default RaffleHistoryList;
