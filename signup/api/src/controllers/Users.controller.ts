import Ajv from 'ajv';
import RequestHelper from '../helpers/requests.helper';
import { SubscribeRequest } from './types';
import { Request, Response } from 'express';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { CONFIG } from '../config';
import subscribeUserSchema from '../schemas/users.schema';

const ajv = new Ajv();

// Set up mailchimp
mailchimp.setConfig({
  apiKey: CONFIG.MAILCHIMP_API_KEY,
  server: CONFIG.MAILCHIMP_API_SERVER
});

const mailchimpClient = require('@mailchimp/mailchimp_transactional')(
  CONFIG.MAILCHIMP_API_KEY
);

class UsersController {
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
      const addResponse = await mailchimp.lists.addListMember(
        CONFIG.MAILCHIMP_AUDIENCE_ID, {
          email_address: subscribeRequest.email,
          status: 'subscribed',
          merge_fields: {
            // TODO validate these fields
            FNAME: subscribeRequest.firstName,
            LNAME: subscribeRequest.lastName,
            MERGE5: subscribeRequest.participate ? 'Yes' : 'No'
          }
        });

      // TODO check error response
      console.log(addResponse);

      if (subscribeRequest.participate) {
        // The user wants to participate in GnoChess,
        // send him the token over email
        const sendResponse = await mailchimpClient.messages.sendTemplate({
          template_name: 'GNOCHESS_TOKEN_TEMPLATE',
          template_content: [{
            TOKEN: 'DUMMY TOKEN' // TODO check this
          }],
          message: {}
        });

        // TODO check error response
        console.log(sendResponse);
      }

      return RequestHelper.sendSuccess(response, 'user subscribed');
    } catch (err) {
      console.error(err.message);

      return RequestHelper.sendError(response, 500, 'Server error');
    }
  }
}

export default UsersController;