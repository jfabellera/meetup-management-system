import { Flex, HStack } from '@chakra-ui/react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CountDownCard from '../components/DataDisplay/CountDownCard';
import FractionCard from '../components/DataDisplay/FractionCard';
import { useGetMeetupQuery } from '../store/meetupSlice';
import { useGetMeetupAttendeesQuery } from '../store/organizerSlice';

dayjs.extend(isBetween);

const ManageMeetupHomePage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? ''));
  const { data: attendees } = useGetMeetupAttendeesQuery(
    parseInt(meetupId ?? ''),
  );
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

  const isMeetupNow = useMemo(
    () => hasMeetupStarted && !hasMeetupEnded,
    [hasMeetupStarted, hasMeetupEnded],
  );

  return (
    <Flex margin={'1rem'} justify={'center'}>
      {meetup != null && attendees != null ? (
        <HStack width={'100%'} spacing={3} maxWidth={'800px'}>
          {/* Show how many have checked in if meetup is currently happening, otherwise show how many have signed up */}
          <FractionCard
            numerator={
              isMeetupNow
                ? attendees.filter((attendee) => attendee.is_checked_in).length
                : (meetup.tickets?.total ?? 0) -
                  (meetup.tickets?.available ?? 0)
            }
            denominator={
              isMeetupNow ? attendees.length : meetup.tickets?.total ?? 0
            }
            label={isMeetupNow ? 'checked in' : 'signed up'}
            onClick={() => {
              navigate(
                `/meetup/${meetupId}/manage/${
                  isMeetupNow ? 'checkin' : 'attendees'
                }`,
              );
            }}
            width={'50%'}
            _hover={{
              cursor: 'pointer',
            }}
          />
          {/* Show detailed countdown until meetup end if meetup is currently happening, otherwise show relative time until start of meetup or end of meetup */}
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
