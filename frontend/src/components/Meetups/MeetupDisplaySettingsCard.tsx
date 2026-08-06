import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useBoolean } from '@/hooks/useBoolean';
import { usePendingUploads } from '@/hooks/usePendingUploads';
import { cn } from '@/lib/utils';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useEffect,
  useState,
  type KeyboardEventHandler,
  type ReactNode,
} from 'react';
import { FiPlus } from 'react-icons/fi';
import {
  useEditMeetupMutation,
  useGetMeetupDisplayAssetsQuery,
  useUploadMeetupImageMutation,
} from '../../store/meetupSlice';
import EditableFormCard from '../Forms/EditableFormCard';
import ImageUploadField from '../shared/ImageUploadField';

interface Props {
  meetupId: string;
}

interface IdleImage {
  id: string;
  url: string;
}

const idleGridClass =
  'grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]';

let nextIdleImageId = 0;
const createIdleImage = (url: string): IdleImage => ({
  id: `idle-${nextIdleImageId++}`,
  url,
});

const toIdleImages = (urls: string[]): IdleImage[] =>
  // Always keep at least one slot so there's something to upload into.
  (urls.length > 0 ? urls : ['']).map(createIdleImage);

interface SortableIdleImageProps {
  image: IdleImage;
  editable: boolean;
  onUploaded: (url: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
  onRemove: () => void;
}

const SortableIdleImage = ({
  image,
  editable,
  onUploaded,
  onUploadingChange,
  onRemove,
}: SortableIdleImageProps): ReactNode => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id: image.id, disabled: !editable });

  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  // Enter/Space on the remove button would otherwise bubble up and lift the card.
  const onCardKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.target !== event.currentTarget) return;
    (onKeyDown as KeyboardEventHandler<HTMLDivElement> | undefined)?.(event);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'min-w-0',
        editable &&
          'cursor-grab select-none [-webkit-touch-callout:none] active:cursor-grabbing [&_img]:[-webkit-user-drag:none]',
        isDragging && 'z-10 opacity-80'
      )}
      {...attributes}
      {...pointerListeners}
      onKeyDown={onCardKeyDown}
    >
      <ImageUploadField
        previewUrl={image.url}
        editable={editable}
        hideOverlay={isSorting}
        aspectRatio={16 / 9}
        className="max-w-none py-0"
        previewWidth={360}
        useUploadMutation={useUploadMeetupImageMutation}
        onUploaded={(_imageKey, imageUrl) => onUploaded(imageUrl)}
        onUploadingChange={onUploadingChange}
        onRemove={onRemove}
      />
    </div>
  );
};

const MeetupDisplaySettingsCard = ({ meetupId }: Props): ReactNode => {
  const { data: displayAssets, isLoading } = useGetMeetupDisplayAssetsQuery(
    meetupId,
    { skip: meetupId === '' }
  );
  const [updateMeetup, { isLoading: isSaving }] = useEditMeetupMutation();
  const { isUploading, onUploadingChange } = usePendingUploads();
  const [isEditable, setIsEditable] = useBoolean(false);
  const [idleImages, setIdleImages] = useState<IdleImage[]>([]);
  const [raffleBackgroundUrl, setRaffleBackgroundUrl] = useState<string>('');
  const [batchRaffleBackgroundUrl, setBatchRaffleBackgroundUrl] =
    useState<string>('');

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIdleImages(toIdleImages(displayAssets?.idleImageUrls ?? []));
    setRaffleBackgroundUrl(displayAssets?.raffleWinnerBackgroundImageUrl ?? '');
    setBatchRaffleBackgroundUrl(
      displayAssets?.batchRaffleWinnerBackgroundImageUrl ?? ''
    );
  }, [displayAssets]);

  const setIdleUrl = (id: string, url: string): void => {
    setIdleImages((images) =>
      images.map((image) => (image.id === id ? { ...image, url } : image))
    );
  };

  const onAdd = (): void => {
    setIdleImages((images) => [...images, createIdleImage('')]);
  };

  // Removes an idle slot entirely, except the last remaining slot which is just
  // cleared — so there's always at least one field.
  const onRemove = (id: string): void => {
    setIdleImages((images) => {
      if (images.length <= 1)
        return images.map((image) => ({ ...image, url: '' }));
      return images.filter((image) => image.id !== id);
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    if (over == null || active.id === over.id) return;
    setIdleImages((images) =>
      arrayMove(
        images,
        images.findIndex((image) => image.id === active.id),
        images.findIndex((image) => image.id === over.id)
      )
    );
  };

  const onSubmit = (): void => {
    void (async () => {
      await updateMeetup({
        meetupId,
        payload: {
          display_idle_image_urls: idleImages
            .map((image) => image.url)
            .filter((url) => url !== ''),
          display_raffle_background_url: raffleBackgroundUrl,
          display_batch_raffle_background_url: batchRaffleBackgroundUrl,
        },
      });

      // Only leave edit mode once the save resolves, so the Save button (and
      // its spinner) stays visible while the request is in flight.
      setIsEditable.off();
    })();
  };

  const onCancel = (): void => {
    if (displayAssets?.idleImageUrls != null)
      setIdleImages(toIdleImages(displayAssets.idleImageUrls));

    setIsEditable.off();
  };

  // Read-only slots are only worth rendering once they hold an image.
  const visibleIdleImages = isEditable
    ? idleImages
    : idleImages.filter((image) => image.url !== '');

  return (
    <EditableFormCard
      title={'Display Settings'}
      isEditable={isEditable}
      onEditEnter={setIsEditable.on}
      onEditCancel={onCancel}
      onEditSubmit={onSubmit}
      isSubmitLoading={isSaving}
      isFormInvalid={false}
      isSubmitDisabled={isUploading}
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          <h3 className="mb-1 text-lg font-medium">Idle Images</h3>
          {visibleIdleImages.length === 0 ? (
            <p className="text-muted-foreground text-sm">No images uploaded.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              // Without this a dragged card can overflow the settings card.
              modifiers={[restrictToParentElement]}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={visibleIdleImages.map((image) => image.id)}
                strategy={rectSortingStrategy}
              >
                <div className={idleGridClass}>
                  {visibleIdleImages.map((image) => (
                    <SortableIdleImage
                      key={image.id}
                      image={image}
                      editable={isEditable}
                      onUploaded={(imageUrl) => setIdleUrl(image.id, imageUrl)}
                      onUploadingChange={onUploadingChange}
                      onRemove={() => onRemove(image.id)}
                    />
                  ))}
                  {isEditable ? (
                    <div>
                      <AspectRatio ratio={16 / 9}>
                        <Button
                          variant="outline"
                          aria-label="add"
                          className="size-full"
                          onClick={onAdd}
                        >
                          <FiPlus className="size-8" />
                        </Button>
                      </AspectRatio>
                    </div>
                  ) : null}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="flex flex-wrap items-end justify-around gap-4">
            <div className="flex-1">
              <h3 className="mt-4 mb-1 text-lg font-medium">
                Raffle Winner Background
              </h3>
              {!isEditable && raffleBackgroundUrl === '' ? (
                <p className="text-muted-foreground text-sm">
                  No image uploaded.
                </p>
              ) : (
                <ImageUploadField
                  previewUrl={raffleBackgroundUrl}
                  editable={isEditable}
                  aspectRatio={16 / 9}
                  className="max-w-none py-0"
                  previewWidth={360}
                  useUploadMutation={useUploadMeetupImageMutation}
                  onUploaded={(_imageKey, imageUrl) =>
                    setRaffleBackgroundUrl(imageUrl)
                  }
                  onUploadingChange={onUploadingChange}
                  onRemove={() => setRaffleBackgroundUrl('')}
                />
              )}
            </div>

            <div className="flex-1">
              <h3 className="mt-4 mb-1 text-lg font-medium">
                Raffle Winner Background (Batch)
              </h3>
              {!isEditable && batchRaffleBackgroundUrl === '' ? (
                <p className="text-muted-foreground text-sm">
                  No image uploaded.
                </p>
              ) : (
                <ImageUploadField
                  previewUrl={batchRaffleBackgroundUrl}
                  editable={isEditable}
                  aspectRatio={16 / 9}
                  className="max-w-none py-0"
                  previewWidth={360}
                  useUploadMutation={useUploadMeetupImageMutation}
                  onUploaded={(_imageKey, imageUrl) =>
                    setBatchRaffleBackgroundUrl(imageUrl)
                  }
                  onUploadingChange={onUploadingChange}
                  onRemove={() => setBatchRaffleBackgroundUrl('')}
                />
              )}
            </div>
          </div>
        </>
      )}
    </EditableFormCard>
  );
};

export default MeetupDisplaySettingsCard;
