import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  type BoxProps,
} from '@chakra-ui/react';
import dayjs from 'dayjs';

interface CountDownProps extends BoxProps {
  date?: Date;
}

const CountDown = ({ date, ...rest }: CountDownProps): JSX.Element => {
  return (
    <Box
      background={'white'}
      borderRadius={'md'}
      boxShadow={'sm'}
      padding={'1rem'}
      {...rest}
    >
      <VStack spacing={0}>
        <HStack align={'baseline'}>
          <Heading size={'2xl'} fontWeight={'medium'}>
            {dayjs(date).diff(dayjs(), 'day')}
          </Heading>
          <Heading size={'sm'} fontWeight={'normal'}>
            {'DAYS'}
          </Heading>
        </HStack>
        <Text fontSize={'xs'} textAlign={'center'}>
          {'UNTIL'}
        </Text>
      </VStack>
    </Box>
  );
};

export default CountDown;
