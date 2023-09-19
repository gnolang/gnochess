import Ajv from 'ajv';
import RequestHelper from '../helpers/requests.helper';
import { SubscribeRequest } from './types';
import { Request, Response } from 'express';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { CONFIG } from '../config';
import subscribeUserSchema from '../schemas/users.schema';
import ajvFormats from 'ajv-formats';
import getRandomToken from '../helpers/token.helper';

const ajv = new Ajv();
ajvFormats(ajv);

// Set up mailchimp
mailchimp.setConfig({
  apiKey: CONFIG.MAILCHIMP_API_KEY,
  server: CONFIG.MAILCHIMP_API_SERVER
});

class SubscribeController {
  static async subscribeUser(request: Request, response: Response) {
    try {
      // Validate the request
      const isValid: boolean = ajv.validate(subscribeUserSchema, request.body);
      if (!isValid) {
        return RequestHelper.sendError(response, 400, { errors: ajv.errors });
      }

      // Extract the subscribe request
      const subscribeRequest: SubscribeRequest = request.body;

      // Subscribe the user
      await mailchimp.lists.addListMember(
        CONFIG.MAILCHIMP_AUDIENCE_ID, {
          email_address: subscribeRequest.email,
          status: 'subscribed',
          merge_fields: {
            FNAME: subscribeRequest.firstName,
            LNAME: subscribeRequest.lastName,
            MERGE5: subscribeRequest.participate ? 'Yes' : 'No',
            MMERGE3: getRandomToken(),
            MMERGE4: 'dummyhandle', // TODO GitHub
            MMERGE6: 'dummyhandle', // TODO Social handle
            MMERGE8: 'General Gno.land', // TODO dropdown
            MMERGE9: 'Yes', // TODO News about gnoland
            MMERGE10: 'Yes' // TODO Terms and Conditions
          }
          // TODO add tags
        });

      // Trigger an email for the user
      //@ts-ignore
      const journeyResponse = await mailchimp.customerJourneys.trigger(
        CONFIG.MAILCHIMP_JOURNEY_ID,
        CONFIG.MAILCHIMP_JOURNEY_STEP,
        {
          email_address: subscribeRequest.email
        }
      );

      if (journeyResponse != null) {
        throw new Error(journeyResponse);
      }

      return RequestHelper.sendSuccess(response, { message: 'User subscribed' });
    } catch (err) {
      console.error(err);

      return RequestHelper.sendError(response, 500, { errors: { message: 'Unable to subscribe user' } });
    }
  }
}

export default SubscribeController;