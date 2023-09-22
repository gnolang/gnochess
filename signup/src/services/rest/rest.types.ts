import { AxiosRequestConfig } from 'axios';

export interface RequestParams {
  url: string;
  data?: any;
  config?: AxiosRequestConfig;
}
