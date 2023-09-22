import { ChakraProvider } from '@chakra-ui/react';
import AppRouter from './router/AppRouter.tsx';

const App = () => {
  return (
    <ChakraProvider
      toastOptions={{
        defaultOptions: {
          position: 'bottom-right',
          isClosable: true,
          duration: 30000
        }
      }}
    >
      <AppRouter />
    </ChakraProvider>
  );
};

export default App;
