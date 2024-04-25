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
import { FiArrowLeft, FiArrowRight, FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  useEditMeetupMutation,
  useGetMeetupDisplayAssetsQuery,
} from '../../store/meetupSlice';
import EditableFormCard from '../Forms/EditableFormCard';

interface Props {
  meetupId: number;
}

const MeetupDisplaySettingsCard = ({ meetupId }: Props): JSX.Element => {
  const { data: displayAssets } = useGetMeetupDisplayAssetsQuery(meetupId);
  const [updateMeetup] = useEditMeetupMutation();
  const [isEditable, setIsEditable] = useBoolean(false);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (displayAssets?.idleImageUrls == null) return;

    setUrls(displayAssets.idleImageUrls);
  }, [displayAssets]);

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

  const onMoveLeft = (event: React.MouseEvent<HTMLButtonElement>): void => {
    const index = Number(event.currentTarget.id);
    if (index === 0) return;
    setUrls((urls) => {
      const temp = [...urls];
      temp.splice(index - 1, 1, temp.splice(index, 1, temp[index - 1])[0]);
      return temp;
    });
  };

  const onMoveRight = (event: React.MouseEvent<HTMLButtonElement>): void => {
    const index = Number(event.currentTarget.id);
    if (index === urls.length - 1) return;
    setUrls((urls) => {
      const temp = [...urls];
      temp.splice(index, 1, temp.splice(index + 1, 1, temp[index])[0]);
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
    if (displayAssets?.idleImageUrls != null)
      setUrls(displayAssets.idleImageUrls);

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
                      justifyContent={'space-between'}
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
                        icon={<FiArrowLeft />}
                        aria-label={'Move left'}
                        colorScheme={'whiteAlpha'}
                        id={String(index)}
                        onClick={onMoveLeft}
                        isDisabled={index === 0}
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        aria-label={'Delete'}
                        colorScheme={'red'}
                        id={String(index)}
                        onClick={onDelete}
                      />
                      <IconButton
                        icon={<FiArrowRight />}
                        aria-label={'Move right'}
                        colorScheme={'whiteAlpha'}
                        id={String(index)}
                        onClick={onMoveRight}
                        isDisabled={index === urls.length - 1}
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
