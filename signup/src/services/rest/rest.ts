import axios from 'axios';
import Config from '../../config.ts';
import { RequestParams } from './rest.types.ts';

const baseUrl = Config.API_BASE_URL;

export class RestService {
  static async post<T>(params: RequestParams) {
    let url = `${window.location.protocol}//${baseUrl}/api/${params.url}`;
    if (Config.NETLIFY_FUNCTIONS_URL !== '') {
      url = `${Config.NETLIFY_FUNCTIONS_URL}/.netlify/functions/${params.url}`;
    }

    return axios
      .post<T>(url, params.data, params.config)
      .then((response) => response.data);
  }
}
