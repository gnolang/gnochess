export interface ISubscribeData {
  firstName: string;
  lastName: string;
  email: string;
  participate: boolean;
}

export interface ISubscribeResponse {
  message: string;
  errors?: {
    message: string
  };
}