import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { type MeetupInfo } from '@keebmeet/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useUpdateMeetupTagsMutation } from '../../store/meetupSlice';
import TagCombobox from './TagCombobox';

interface EditMeetupTagsDialogProps {
  meetup: MeetupInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditMeetupTagsDialog = ({
  meetup,
  open,
  onOpenChange,
}: EditMeetupTagsDialogProps): ReactNode => {
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [updateTags, { isLoading }] = useUpdateMeetupTagsMutation();

  useEffect(() => {
    if (open) setTagIds(meetup.tags?.map((tag) => tag.id) ?? []);
  }, [open, meetup]);

  const save = (): void => {
    void (async () => {
      try {
        await updateTags({ meetupId: meetup.id, tag_ids: tagIds }).unwrap();
        toast.success('Tags updated.');
        onOpenChange(false);
      } catch {
        toast.error('Could not update tags. Please try again.');
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit tags</DialogTitle>
          <DialogDescription>
            Change the tags on {meetup.name}.
          </DialogDescription>
        </DialogHeader>
        <TagCombobox value={tagIds} onChange={setTagIds} />
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={save} disabled={isLoading}>
            Save
            {isLoading && <Spinner />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
