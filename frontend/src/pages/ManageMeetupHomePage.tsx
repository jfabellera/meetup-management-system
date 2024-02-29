import { Flex, HStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import CountDownCard from '../components/DataDisplay/CountDownCard';
import FractionCard from '../components/DataDisplay/FractionCard';
import { useGetMeetupQuery } from '../store/meetupSlice';

const ManageMeetupHomePage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));
  const navigate = useNavigate();

  return (
    <Flex margin={'1rem'} justify={'center'}>
      <HStack width={'100%'} spacing={3} maxWidth={'800px'}>
        <FractionCard
          numerator={
            (meetup?.tickets?.total ?? 0) - (meetup?.tickets?.available ?? 0)
          }
          denominator={meetup?.tickets?.total ?? 0}
          label={'signed up'}
          width={'50%'}
          onClick={() => {
            navigate(`/meetup/${meetupId}/manage/attendees`);
          }}
          _hover={{
            cursor: 'pointer',
          }}
        />
        <CountDownCard
          date={meetup != null ? new Date(meetup?.date) : undefined}
          width={'50%'}
        />
      </HStack>
    </Flex>
  );
};

export default ManageMeetupHomePage;
