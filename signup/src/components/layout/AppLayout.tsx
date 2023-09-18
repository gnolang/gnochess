import {IAppLayoutProps} from './appLayout.types';
import {FC} from 'react';
import {Box, Container, useMediaQuery} from '@chakra-ui/react';
import {Outlet} from 'react-router-dom';

const AppLayout: FC<IAppLayoutProps> = () => {
    const [isMdOrSmaller] = useMediaQuery('(max-width: 62em)');

    return (
        <Box
            display={'flex'}
            flexDirection={'column'}
            width={'100%'}
            minHeight={'100vh'}
        >
            <Container maxW={isMdOrSmaller ? '100vw' : '80vw'} my={20}>
                <Outlet/>
            </Container>
        </Box>
    );
};

export default AppLayout;
