import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useEditMeetupMutation, useGetMeetupQuery } from '@/store/meetupSlice';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  meetupId: string;
}

export const MeetupDraftBanner = ({ meetupId }: Props): ReactNode => {
  const { data: meetup } = useGetMeetupQuery(meetupId);
  const [editMeetup, { isLoading: isPublishing }] = useEditMeetupMutation();
  const [open, setOpen] = useState(false);

  const onPublish = async (): Promise<void> => {
    const result = await editMeetup({
      meetupId: meetup?.id ?? '',
      payload: { is_draft: false },
    });

    if ('error' in result && result.error != null) {
      const error = result.error as { data?: { message?: string } };
      toast.error('Error publishing meetup', {
        description: error.data?.message,
      });
      return;
    }

    setOpen(false);
    toast.success('Meetup published');
  };

  if (meetup?.is_draft !== true) return null;

  return (
    <Card className="flex-row flex-wrap items-center justify-between gap-3 border-amber-500/50 bg-amber-500/5 p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="font-semibold">This meetup is a draft</h2>
        <p className="text-muted-foreground text-sm">
          Only you and your co-organizers can see this meetup. Nobody can RSVP
          to it yet.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Publish</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish this meetup?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                void onPublish();
              }}
              disabled={isPublishing}
            >
              Publish meetup
              {isPublishing && <Spinner />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MeetupDraftBanner;
