import axios from 'axios';
import Config from '../../config.ts';
import { RequestParams } from './rest.types.ts';

const baseUrl = Config.API_BASE_URL;

export class RestService {
  static async post<T>(params: RequestParams) {
    return axios
      .post<T>(`${baseUrl}/api/${params.url}`, params.data, params.config)
      .then((response) => response.data);
  }
}