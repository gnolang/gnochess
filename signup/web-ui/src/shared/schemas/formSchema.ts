import * as yup from 'yup';

const formValidationSchema = yup.object({
  firstName: yup
    .string()
    .matches(/^[A-Za-z ]*$/, 'Please enter valid first name')
    .max(40)
    .required(),
  lastName: yup
    .string()
    .matches(/^[A-Za-z ]*$/, 'Please enter valid last name')
    .max(40)
    .required(),
  email: yup
    .string()
    .email('Email is not valid')
    .max(40)
    .required('Last name is required'),
  githubHandle: yup
    .string()
    .max(40),
  socialHandle: yup
    .string()
    .max(40),
  interests: yup
    .string()
    .max(40)
    .required('Interests are required'),
  participate: yup.boolean().required('Participation not defined'),
  receiveNews: yup.boolean().required('Receive news not defined'),
  termsAndConditions: yup.boolean().when('participate', {
    is: (participate: boolean) => participate,
    then: schema => schema.isTrue('You must accept the terms and conditions').required(),
    otherwise: schema => schema.isFalse('You must opt-in to GnoChess').required()
  })
});

export default formValidationSchema;
