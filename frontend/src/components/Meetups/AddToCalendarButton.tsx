import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import config from '@/config';
import { buildMeetupCalendarLinks, type MeetupInfo } from '@keebmeet/shared';
import { type ReactNode } from 'react';
import { FiCalendar } from 'react-icons/fi';

interface AddToCalendarButtonProps {
  meetup: MeetupInfo;
}

export const AddToCalendarButton = ({
  meetup,
}: AddToCalendarButtonProps): ReactNode => {
  const links = buildMeetupCalendarLinks({
    id: meetup.id,
    title: meetup.name,
    description: meetup.description,
    location:
      meetup.location.full_address ??
      [meetup.location.city, meetup.location.state, meetup.location.country]
        .filter((part) => part != null && part !== '')
        .join(', '),
    // date carries its UTC offset, so it's the correct absolute instant.
    start: meetup.date,
    durationHours: meetup.duration_hours ?? 0,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            title="Add to calendar"
            aria-label="Add to calendar"
          />
        }
      >
        <FiCalendar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={
            <a href={links.google} target="_blank" rel="noopener noreferrer" />
          }
        >
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a href={links.outlook} target="_blank" rel="noopener noreferrer" />
          }
        >
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem
          // An endpoint, not a data: URI, so mobile opens the calendar app.
          render={
            <a href={`${config.apiUrl}/meetups/${meetup.slug}/calendar.ics`} />
          }
        >
          Apple / other (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
