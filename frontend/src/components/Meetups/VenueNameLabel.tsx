import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type ReactNode } from 'react';
import { FiInfo } from 'react-icons/fi';

const VenueNameLabel = (): ReactNode => (
  <span className="flex items-center gap-1.5">
    Venue Name
    <span className="text-muted-foreground font-normal">(optional)</span>
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="text-muted-foreground flex"
        aria-label="Why add a venue name?"
      >
        <FiInfo className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>
        Shown with the address so attendees can find the venue more easily.
      </TooltipContent>
    </Tooltip>
  </span>
);

export default VenueNameLabel;
