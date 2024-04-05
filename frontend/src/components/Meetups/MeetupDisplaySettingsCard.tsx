import {
  AspectRatio,
  Box,
  Grid,
  GridItem,
  IconButton,
  Image,
  Input,
  useBoolean,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  useEditMeetupMutation,
  useGetMeetupIdleImagesQuery,
} from '../../store/meetupSlice';
import EditableFormCard from '../Forms/EditableFormCard';

interface Props {
  meetupId: number;
}

const MeetupDisplaySettingsCard = ({ meetupId }: Props): JSX.Element => {
  const { data: idleImages } = useGetMeetupIdleImagesQuery(meetupId);
  const [updateMeetup] = useEditMeetupMutation();
  const [isEditable, setIsEditable] = useBoolean(false);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (idleImages == null) return;

    setUrls(idleImages);
  }, [idleImages]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setUrls((urls) => {
      const temp = [...urls];
      temp[Number(event.target.id)] = event.target.value;
      return temp;
    });
  };

  const onAdd = (): void => {
    setUrls((urls) => {
      return [...urls, ''];
    });
  };

  const onDelete = (event: React.MouseEvent<HTMLButtonElement>): void => {
    const index = Number(event.currentTarget.id);
    setUrls((urls) => {
      const temp = [...urls];
      temp.splice(index, 1);
      return temp;
    });
  };

  const onSubmit = (): void => {
    void (async () => {
      await updateMeetup({
        meetupId,
        payload: { display_idle_image_urls: urls },
      });
    })();

    setIsEditable.off();
  };

  const onCancel = (): void => {
    if (idleImages != null) setUrls(idleImages);

    setIsEditable.off();
  };

  return (
    <EditableFormCard
      title={'Display Settings'}
      isEditable={isEditable}
      onEditEnter={setIsEditable.on}
      onEditCancel={onCancel}
      onEditSubmit={onSubmit}
      isFormInvalid={false}
    >
      {urls != null ? (
        <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
          {urls.map((imageUrl, index) => (
            <GridItem key={index}>
              <AspectRatio ratio={16 / 9}>
                <Box border={'1px'}>
                  <Image src={imageUrl} />
                  {isEditable ? (
                    <Box
                      display={'flex'}
                      justifyContent={'center'}
                      alignItems={'center'}
                      position="absolute"
                      height={'100%'}
                      width={'100%'}
                      padding={'1rem'}
                      bg="rgba(0, 0, 0, 0.5)"
                      opacity={0}
                      transition="opacity 0.3s"
                      _hover={{ opacity: 1 }}
                    >
                      <IconButton
                        icon={<FiTrash2 />}
                        aria-label={'Delete'}
                        colorScheme={'red'}
                        id={String(index)}
                        onClick={onDelete}
                      />
                    </Box>
                  ) : null}
                </Box>
              </AspectRatio>
              {isEditable ? (
                <Input
                  id={String(index)}
                  marginTop={'1rem'}
                  value={urls[index]}
                  onChange={onChange}
                />
              ) : null}
            </GridItem>
          ))}
          {isEditable ? (
            <GridItem padding={'1rem'}>
              <AspectRatio ratio={16 / 9}>
                <IconButton
                  fontSize={'2rem'}
                  icon={<FiPlus />}
                  aria-label={'add'}
                  onClick={onAdd}
                />
              </AspectRatio>
            </GridItem>
          ) : null}
        </Grid>
      ) : null}
    </EditableFormCard>
  );
};

export default MeetupDisplaySettingsCard;
