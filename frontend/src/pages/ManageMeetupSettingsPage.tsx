import { useParams } from 'react-router-dom';
import MeetupDetailsSettingsCard from '../components/Meetups/MeetupDetailsSettingsCard';

const ManageMeetupSettingsPage = (): JSX.Element => {
  const { meetupId } = useParams();

  return (
    <>
      <MeetupDetailsSettingsCard meetupId={Number(meetupId)} />
    </>
  );
};

export default ManageMeetupSettingsPage;
