'use client';

import { Avatar, Box, Flex, Heading, IconButton, Stack, StackDivider, Text, VStack } from '@chakra-ui/react';
import Page from '../components/Page/Page';
import { useAppSelector } from '../store/hooks';
import { useGetAllOrganizerRequestQuery } from '../store/organizerRequestSlice';
import { FaFrown, FaGrinBeamSweat, FaGrinStars } from 'react-icons/fa';
import { OrganizerRequests } from '../../../backend/src/entity/OrganizerRequests';


const AdminPage = (): JSX.Element => {
    const { loading, error } = useAppSelector((state) => state.user);
    const { data: organizerRequests } = useGetAllOrganizerRequestQuery({});

    return (
        <Page>
            <Flex align={'center'} justify={'center'}>
                <Stack spacing={8} mx={'auto'} maxW={'lg'} py={6} px={6}>
                    <Stack align={'center'}>
                        <Heading fontSize={'4xl'} textAlign={'center'}>
                            Admin Dashboard
                        </Heading>
                    </Stack>
                    <VStack
                        divider={<StackDivider borderColor='gray.200' />}
                        spacing={4}
                        align='stretch'>
                        <RequestUserProfile>
                            {organizerRequests}
                        </RequestUserProfile>
                    </VStack>

                </Stack>
            </Flex>
        </Page>
    );
};

export default AdminPage;

const RequestUserProfile = (organizerRequests: OrganizerRequests[]) : JSX.Element => {
    return (<Flex>
        <Avatar src='https://bit.ly/sage-adebayo' />
        <Box ml='3'>
            <Text fontWeight='bold'>
                Segun Adebayo
            </Text>
            <Text fontSize='sm'>UI Engineer</Text>
        </Box>
        <IconButton
            variant='ghost'
            colorScheme='green'
            aria-label='Approve'
            fontSize='4xl'
            icon={<FaGrinStars />}
        />
        <IconButton
            variant='ghost'
            colorScheme='red'
            aria-label='Decline'
            fontSize='4xl'
            icon={<FaGrinBeamSweat />}
        />
    </Flex>);
};

// <Page>
//     <Heading fontSize="3xl" mb={'0.5em'}>
//         Upcoming Meetups
//     </Heading>
//     {!isLoading ? (
//         <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
//             {meetups?.map((card) => (
//                 <GridItem
//                     key={card.id}
//                     onClick={() => {
//                         setMeetupId(card.id);
//
//                         // Only open modal immediately if the selected meetup is already loaded
//                         if (meetup?.id === card.id) {
//                             onOpen();
//                         }
//                     }}
//                 >
//                     <MeetupCard
//                         name={card.name}
//                         location={`${card.location.city}, ${
//                             card.location.state ?? card.location.country
//                         }`}
//                         date={dayjs(card.date, 'YYYY-MM-DDTHH:mm:ss').format(
//                             'MMMM DD, YYYY',
//                         )}
//                         imageUrl={card.image_url}
//                     />
//                 </GridItem>
//             ))}
//         </Grid>
//     ) : (
//         <></>
//     )}
// </Page>
