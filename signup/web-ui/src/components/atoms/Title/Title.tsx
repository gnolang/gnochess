import { ITitleProps } from './title.types.ts';
import { FC } from 'react';
import { Text } from '@chakra-ui/react';

const Title: FC<ITitleProps> = ({ text, size = '2xl' }) => {
  return (
    <Text fontSize={size} as={'b'} color={'black'}>
      {text}
    </Text>
  );
};

export default Title;
