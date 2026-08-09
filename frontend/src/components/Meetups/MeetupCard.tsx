import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MeetupInfo } from '@keebmeet/shared';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { EyeOffIcon, PencilIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { FiCheck, FiClock, FiImage } from 'react-icons/fi';
import { hasMeetupEnded } from '../../util/timeUtil';
import { TagBadge } from './TagBadge';

dayjs.extend(customParseFormat);

export const UNLISTED_REASON_TEXT: Record<
  NonNullable<MeetupInfo['unlisted_reason']>,
  string
> = {
  organizer: "you're an organizer",
  attendee: "you're attending",
  group: "you're in an associated group",
};

export interface MeetupCardProps {
  meetup: MeetupInfo;
  attending?: boolean;
  paymentPending?: boolean;
  imageOverlay?: ReactNode;
}

export const MeetupCard = ({
  meetup,
  attending,
  paymentPending,
  imageOverlay,
}: MeetupCardProps): ReactNode => {
  const attendedLabel = hasMeetupEnded(meetup)
    ? "You've attended!"
    : "You're attending!";

  return (
    <div
      className={`bg-card text-card-foreground relative h-full cursor-pointer overflow-hidden rounded-md border shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] active:shadow-md active:duration-100 ${
        meetup.admin_only_visible === true
          ? 'border-muted-foreground border-3 border-dashed'
          : ''
      }`}
    >
      {imageOverlay != null ? (
        <div className="absolute top-2 left-2 z-10">{imageOverlay}</div>
      ) : null}
      <AspectRatio ratio={2 / 1}>
        <ImageWithFallback
          src={meetup.image_url}
          resizeWidth={640}
          className="size-full object-cover"
        />
      </AspectRatio>
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-1 min-w-0 text-base font-semibold sm:text-lg">
            {meetup.name}
          </h3>
          <div className="text-muted-foreground ml-auto flex shrink-0 items-center gap-2">
            {attending === true ? (
              <Tooltip>
                <TooltipTrigger
                  className="flex text-green-600"
                  aria-label={attendedLabel}
                >
                  <FiCheck className="size-4.5" strokeWidth={2.5} />
                </TooltipTrigger>
                <TooltipContent>{attendedLabel}</TooltipContent>
              </Tooltip>
            ) : paymentPending === true ? (
              <Tooltip>
                <TooltipTrigger
                  className="flex text-amber-600"
                  aria-label="Payment pending"
                >
                  <FiClock className="size-4.5" strokeWidth={2.5} />
                </TooltipTrigger>
                <TooltipContent>
                  Payment pending. If not paid in time, your spot will be
                  released to others.
                </TooltipContent>
              </Tooltip>
            ) : null}
            {meetup.is_draft === true ? (
              <Tooltip>
                <TooltipTrigger className="flex" aria-label="Draft">
                  <PencilIcon className="size-4.5" />
                </TooltipTrigger>
                <TooltipContent>
                  This meetup is a draft. Only its organizers can see it.
                </TooltipContent>
              </Tooltip>
            ) : null}
            {meetup.is_unlisted === true ? (
              <Tooltip>
                <TooltipTrigger className="flex" aria-label="Unlisted">
                  <EyeOffIcon className="size-4.5" />
                </TooltipTrigger>
                <TooltipContent>
                  This meetup is unlisted
                  {meetup.unlisted_reason != null
                    ? `. You can see it because ${UNLISTED_REASON_TEXT[meetup.unlisted_reason]}.`
                    : ''}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {meetup.has_photos === true ? (
              <Tooltip>
                <TooltipTrigger className="flex" aria-label="Has photos">
                  <FiImage className="size-4.5" />
                </TooltipTrigger>
                <TooltipContent>This meetup has photos!</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {dayjs(meetup.date, 'YYYY-MM-DDTHH:mm:ss').format('MMMM DD, YYYY')}
          {' · '}
          {`${meetup.location.city}, ${
            meetup.location.state ?? meetup.location.country
          }`}
        </p>
        {meetup.tags != null && meetup.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meetup.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
