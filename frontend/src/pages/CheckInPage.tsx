import { Box, Flex, Heading, Input } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

const CheckInPage = (): JSX.Element => {
  const [searchValue, setSearchValue] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      searchRef.current?.focus();

      if (event.key === 'Escape') {
        setSearchValue('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setSearchValue(event.target.value);
  };

  return (
    <Flex direction={'column'} textAlign={'center'} margin={'1rem'}>
      <Heading
        size={'lg'}
        fontWeight={'medium'}
        marginBottom={'0.5rem'}
        textAlign={'center'}
      >
        Check-in
      </Heading>
      <Box
        padding={'0.5rem'}
        background={'white'}
        borderRadius={'md'}
        boxShadow={'sm'}
      >
        <Input
          ref={searchRef}
          variant={'ghost'}
          placeholder={'Start typing a username, name, or email...'}
          value={searchValue}
          onChange={handleSearchChange}
        />
      </Box>
    </Flex>
  );
};

export default CheckInPage;
