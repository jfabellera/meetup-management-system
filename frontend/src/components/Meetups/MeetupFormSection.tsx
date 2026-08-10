import { type ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

/** Titled two-column block shared by the meetup create and settings forms. */
const MeetupFormSection = ({ title, children }: Props): ReactNode => (
  <section className="border-t pt-4 first:border-t-0 first:pt-0">
    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
      {title}
    </h3>
    <div className="grid grid-cols-1 items-start gap-x-8 gap-y-4 sm:grid-cols-2">
      {children}
    </div>
  </section>
);

export default MeetupFormSection;
