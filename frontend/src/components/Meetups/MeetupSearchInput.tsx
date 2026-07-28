import { type ReactNode } from 'react';
import { ExpandableSearch } from '../ExpandableSearch';

interface MeetupSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  expandInline?: boolean;
  fullWidth?: boolean;
}

export const MeetupSearchInput = (props: MeetupSearchInputProps): ReactNode => (
  <ExpandableSearch
    placeholder="Search meetups"
    label="Search meetups"
    {...props}
  />
);
