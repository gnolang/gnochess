export interface ISubscribeData {
  firstName: string;
  lastName: string;
  email: string;
  githubHandle: string,
  socialHandle: string,
  interests: string,
  receiveNews: boolean,
  participate: boolean,
  termsAndConditions: boolean,
}

export interface ISubscribeResponse {
  message: string;
  errors?: {
    message: string
  };
}