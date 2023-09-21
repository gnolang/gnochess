const subscribeUserSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Subscribe user validation schema",
  type: "object",
  required: [
    "firstName",
    "lastName",
    "email",
    "participate",
    "interests",
    "receiveNews",
    "termsAndConditions",
  ],
  properties: {
    firstName: {
      type: "string",
      minLength: 1,
      maxLength: 40,
    },
    lastName: {
      type: "string",
      minLength: 1,
      maxLength: 40,
    },
    email: {
      type: "string",
      format: "email",
      minLength: 1,
    },
    githubHandle: {
      type: "string",
      maxLength: 40,
    },
    socialHandle: {
      type: "string",
      maxLength: 40,
    },
    interests: {
      type: "string",
      minLength: 1,
      maxLength: 40,
      enum: ["General Gno.land", "Joining the team", "Grants Program"],
    },
    participate: {
      type: "boolean",
    },
    receiveNews: {
      type: "boolean",
    },
    termsAndConditions: {
      type: "boolean",
    },
  },
};

export default subscribeUserSchema;
