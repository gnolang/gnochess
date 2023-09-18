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
  participate: yup.boolean().defined('Participation not defined')
});

export default formValidationSchema;
