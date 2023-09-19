import { ISubscribeData, ISubscribeResponse } from './subscribe.types.ts';
import { RestService } from '../rest/rest.ts';

class SubscribeService {
  public static async subscribeUser(
    data: ISubscribeData
  ): Promise<ISubscribeResponse> {
    try {
      return await RestService.post<ISubscribeResponse>({
        url: 'subscribe',
        data
      });
    } catch (err) {
      console.warn(err);
      throw err;
    }
  }
}

export default SubscribeService;