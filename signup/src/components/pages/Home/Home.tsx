import { IHomeProps } from './home.types.ts';
import { FC, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  Spinner,
  useMediaQuery,
  useToast
} from '@chakra-ui/react';
import Title from '../../atoms/Title/Title.tsx';
import { BsSend } from 'react-icons/bs';
import { useFormik } from 'formik';
import formValidationSchema from '../../../shared/schemas/formSchema.ts';
import banner from '../../../assets/img/banner.png';
import { ISubscribeData } from '../../../services/subscribe/subscribe.types.ts';
import SubscribeService from '../../../services/subscribe/subscribe.ts';

const Home: FC<IHomeProps> = () => {
  const [isMdOrSmaller] = useMediaQuery('(max-width: 62em)');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const toast = useToast();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      githubHandle: '',
      socialHandle: '',
      interests: 'General Gno.land',
      receiveNews: false,
      participate: false,
      termsAndConditions: false
    },
    enableReinitialize: true,
    validationSchema: formValidationSchema,
    onSubmit: async (values: ISubscribeData, { resetForm }) => {
      setSubmitting(true);

      try {
        await SubscribeService.subscribeUser(values);

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
      maxWidth={isMdOrSmaller ? '100%' : '60%'}
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
          <Box display={'flex'} flexDirection={'column'} mt={6}>
            <FormControl
              isInvalid={
                !!formik.errors.githubHandle && formik.touched.githubHandle
              }
            >
              <FormLabel>GitHub handle</FormLabel>
              <Input
                variant={'outline'}
                placeholder={'johndoe'}
                size={'lg'}
                id={'githubHandle'}
                name={'githubHandle'}
                value={formik.values.githubHandle}
                onChange={formik.handleChange}
              />
              <FormErrorMessage>{formik.errors.githubHandle}</FormErrorMessage>
            </FormControl>
          </Box>
          <Box display={'flex'} flexDirection={'column'} mt={6}>
            <FormControl
              isInvalid={
                !!formik.errors.socialHandle && formik.touched.socialHandle
              }
            >
              <FormLabel>Social handle</FormLabel>
              <Input
                variant={'outline'}
                placeholder={'@johndoe'}
                size={'lg'}
                id={'socialHandle'}
                name={'socialHandle'}
                value={formik.values.socialHandle}
                onChange={formik.handleChange}
              />
              <FormErrorMessage>{formik.errors.socialHandle}</FormErrorMessage>
            </FormControl>
          </Box>
          <Box display={'flex'} flexDirection={'column'} mt={6}>
            <FormControl
              isInvalid={!!formik.errors.interests && formik.touched.interests}
            >
              <FormLabel>What are your interests</FormLabel>
              <Select
                variant={'outline'}
                size={'lg'}
                id={'interests'}
                name={'interests'}
                value={formik.values.interests}
                onChange={formik.handleChange}
              >
                <option>General Gno.land</option>
                <option>Joining the team</option>
                <option>Grants Program</option>
              </Select>
              <FormErrorMessage>{formik.errors.interests}</FormErrorMessage>
            </FormControl>
          </Box>
          <Box mt={6}>
            <FormControl
              isInvalid={
                !!formik.errors.receiveNews && formik.touched.receiveNews
              }
            >
              <Checkbox
                size={'lg'}
                colorScheme={'green'}
                id={'receiveNews'}
                name={'receiveNews'}
                onChange={formik.handleChange}
                isChecked={formik.values.receiveNews}
              >
                Do you want to receive news on Gno.land?
              </Checkbox>
              <FormHelperText>
                Note: By filling out this form you agree for New Tendermint Inc
                and AiB Inc. to use your registration email to send you updates
                on its projects and products as well as future events
              </FormHelperText>
              <FormErrorMessage>{formik.errors.receiveNews}</FormErrorMessage>
            </FormControl>
          </Box>
          <Box mt={6}>
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
          <Box my={6}>
            <FormControl
              isInvalid={
                !!formik.errors.termsAndConditions &&
                formik.touched.termsAndConditions
              }
            >
              <Checkbox
                size={'lg'}
                colorScheme={'green'}
                id={'termsAndConditions'}
                name={'termsAndConditions'}
                onChange={formik.handleChange}
                isChecked={formik.values.termsAndConditions}
              >
                Please confirm you accept the{' '}
                <a
                  href={'https://gnochess.com/docs/gnochess-terms-and-conditions-9-21-23.pdf'}
                  target={'_blank'}
                  style={{
                    textDecoration: 'underline'
                  }}
                >
                  Terms and Conditions
                </a>
                {' '}and the{' '}
                <a
                  href={'https://gnochess.com/docs/gnochess-privacy-policy-9-21-23.pdf'}
                  target={'_blank'}
                  style={{
                    textDecoration: 'underline'
                  }}
                >
                  Privacy Policy
                </a>
              </Checkbox>
              <FormHelperText>
                Note: Required if participating in GnoChess
              </FormHelperText>
              <FormErrorMessage>
                {formik.errors.termsAndConditions}
              </FormErrorMessage>
            </FormControl>
          </Box>
          <Box>
            <Button
              rightIcon={<BsSend />}
              variant='outline'
              padding={6}
              isLoading={submitting}
              loadingText={'Submitting'}
              spinner={<Spinner size={'md'} color='green' />}
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
