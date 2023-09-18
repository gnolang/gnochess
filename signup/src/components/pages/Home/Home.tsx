import { IFormData, IHomeProps } from './home.types.ts';
import { FC, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Spinner,
  useMediaQuery,
  useToast
} from '@chakra-ui/react';
import Title from '../../atoms/Title/Title.tsx';
import { BsSend } from 'react-icons/bs';
import { useFormik } from 'formik';
import formValidationSchema from '../../../shared/schemas/formSchema.ts';
import banner from '../../../assets/img/banner.png';

const Home: FC<IHomeProps> = () => {
  const [isMdOrSmaller] = useMediaQuery('(max-width: 62em)');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const toast = useToast();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      participate: true
    },
    enableReinitialize: true,
    validationSchema: formValidationSchema,
    onSubmit: (values: IFormData, { resetForm }) => {
      setSubmitting(true);

      try {
        // TODO execute POST
        console.log(values);
        resetForm();

        toast({
          title: 'Sign up successful!',
          status: 'success'
        });
      } catch (e) {
        toast({
          title: 'Unable to submit form',
          status: 'error'
        });
      }

      setSubmitting(false);
    }
  });

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      my={'auto'}
      mx={'auto'}
      maxWidth={isMdOrSmaller ? '100%' : '40%'}
      width={'100%'}
      padding={8}
      borderRadius={'30px'}
      backgroundColor={'white'}
    >
      <Box
        display={'flex'}
        alignItems={'center'}
        width={'100%'}
        flexDirection={'column'}
      >
        <Title
          text={'Welcome to GnoChess!'}
          size={isMdOrSmaller ? '2xl' : '3xl'}
        />
        <img
          src={banner}
          alt={'Banner'}
          style={{
            width: '100%',
            height: 'auto'
          }}
        />
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <Box display={'flex'} flexDirection={'column'}>
          <Box
            display={'flex'}
            flexDirection={isMdOrSmaller ? 'column' : 'row'}
            justifyContent={'space-between'}
            mt={6}
          >
            <Box
              display={'flex'}
              flexDirection={'column'}
              width={isMdOrSmaller ? '100%' : '48%'}
            >
              <FormControl
                isRequired
                isInvalid={
                  !!formik.errors.firstName && formik.touched.firstName
                }
              >
                <FormLabel>First name</FormLabel>
                <Input
                  variant={'outline'}
                  placeholder={'John'}
                  size={'lg'}
                  id={'firstName'}
                  name={'firstName'}
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                />
                <FormErrorMessage>{formik.errors.firstName}</FormErrorMessage>
              </FormControl>
            </Box>

            <Box
              display={'flex'}
              flexDirection={'column'}
              width={isMdOrSmaller ? '100%' : '48%'}
              mt={isMdOrSmaller ? 6 : 0}
            >
              <FormControl
                isRequired
                isInvalid={!!formik.errors.lastName && formik.touched.lastName}
              >
                <FormLabel>Last name</FormLabel>
                <Input
                  variant={'outline'}
                  placeholder={'Doe'}
                  size={'lg'}
                  id={'lastName'}
                  name={'lastName'}
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                />
                <FormErrorMessage>{formik.errors.lastName}</FormErrorMessage>
              </FormControl>
            </Box>
          </Box>
          <Box display={'flex'} flexDirection={'column'} mt={6}>
            <FormControl
              isRequired
              isInvalid={!!formik.errors.email && formik.touched.email}
            >
              <FormLabel>Email</FormLabel>
              <Input
                variant={'outline'}
                placeholder={'johndoe@tendermint.com'}
                size={'lg'}
                id={'email'}
                type={'email'}
                name={'email'}
                value={formik.values.email}
                onChange={formik.handleChange}
              />
              <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
            </FormControl>
          </Box>
          <Box my={6}>
            <Checkbox
              size={'lg'}
              colorScheme={'green'}
              id={'participate'}
              name={'participate'}
              onChange={formik.handleChange}
              isChecked={formik.values.participate}
            >
              Participate in GnoChess
            </Checkbox>
          </Box>
          <Box>
            <Button
              rightIcon={<BsSend />}
              variant="outline"
              padding={6}
              isLoading={submitting}
              loadingText={'Submitting'}
              spinner={<Spinner size={'md'} color="green" />}
              spinnerPlacement={'end'}
              type={'submit'}
            >
              Sign up
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default Home;
