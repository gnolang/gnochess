const subscribeUserSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Subscribe user validation schema',
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'participate'],
  properties: {
    firstName: {
      type: 'string',
      minLength: 1,
      maxLength: 40
    },
    lastName: {
      type: 'string',
      minLength: 1,
      maxLength: 40
    },
    email: {
      type: 'string',
      format: 'email',
      minLength: 1
    },
    participate: {
      type: 'boolean'
    }
  }
};

export default subscribeUserSchema;