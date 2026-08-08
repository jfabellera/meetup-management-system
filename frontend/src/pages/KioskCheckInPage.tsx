import { useEffect, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMeetupLiveUpdates } from '../hooks/useMeetupLiveUpdates';
import { useGetMeetupQuery } from '../store/meetupSlice';
import { exitKioskMode, useKioskMeetup } from '../util/kioskMode';
import CheckInPage from './CheckInPage';

const EXIT_COMBO = ['BracketLeft', 'BracketRight', 'Backslash'];

const KioskCheckInPage = (): ReactNode => {
  const kioskMeetup = useKioskMeetup();
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(kioskMeetup ?? '', {
    skip: kioskMeetup == null,
  });

  useMeetupLiveUpdates(meetup);

  useEffect(() => {
    const held = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!EXIT_COMBO.includes(event.code)) return;
      held.add(event.code);
      if (EXIT_COMBO.every((code) => held.has(code))) {
        held.clear();
        exitKioskMode();
        toast.info('Kiosk mode exited');
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      held.delete(event.code);
    };
    // Keyups can be missed while the window is unfocused.
    const handleBlur = (): void => {
      held.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  if (kioskMeetup != null && meetupId !== kioskMeetup) {
    return <Navigate to={`/meetup/${kioskMeetup}/manage/checkin`} replace />;
  }

  return (
    <div className="bg-muted flex h-svh flex-col overflow-y-auto">
      <h1 className="mt-4 line-clamp-2 w-full shrink-0 px-6 text-center text-3xl font-bold">
        {meetup?.name}
      </h1>
      <div className="grow">
        <CheckInPage />
      </div>
    </div>
  );
};

export default KioskCheckInPage;
