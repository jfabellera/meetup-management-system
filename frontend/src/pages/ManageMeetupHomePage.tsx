import { Flex, HStack } from '@chakra-ui/react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CountDownCard from '../components/DataDisplay/CountDownCard';
import FractionCard from '../components/DataDisplay/FractionCard';
import { useGetMeetupQuery } from '../store/meetupSlice';

dayjs.extend(isBetween);

const ManageMeetupHomePage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));
  const navigate = useNavigate();

  const hasMeetupStarted = useMemo(
    () => (meetup != null ? dayjs().isAfter(meetup.date) : false),
    [meetup],
  );

  const hasMeetupEnded = useMemo(
    () =>
      meetup != null
        ? dayjs().isAfter(
            dayjs(meetup.date).add(meetup.duration_hours ?? 0, 'hours'),
          )
        : false,
    [meetup],
  );

  return (
    <Flex margin={'1rem'} justify={'center'}>
      {meetup != null ? (
        <HStack width={'100%'} spacing={3} maxWidth={'800px'}>
          <FractionCard
            numerator={
              (meetup.tickets?.total ?? 0) - (meetup.tickets?.available ?? 0)
            }
            denominator={meetup.tickets?.total ?? 0}
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
            date={
              hasMeetupStarted || hasMeetupEnded
                ? dayjs(meetup.date).add(meetup.duration_hours ?? 0, 'hours')
                : dayjs(meetup.date)
            }
            futureText={!hasMeetupStarted ? 'left' : 'until end'}
            pastText={'ago'}
            width={'50%'}
            simple={!hasMeetupStarted || hasMeetupEnded}
          />
        </HStack>
      ) : null}
    </Flex>
  );
};

export default ManageMeetupHomePage;
