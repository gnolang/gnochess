import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';
import mailchimp from '@mailchimp/mailchimp_marketing';
import type { Handler, HandlerEvent } from '@netlify/functions';

import { CONFIG } from './config';
import { SubscribeRequest } from './types';
import subscribeUserSchema from './schemas/users.schema';
import { RedisClient } from './services/redis';
import RequestHelper from './helpers/requests.helper';
import getRandomToken from './helpers/token.helper';

const ajv = new Ajv();
ajvFormats(ajv);

// Login to redis
const redisClient = new RedisClient(CONFIG.REDIS_URL);

// Set up mailchimp
mailchimp.setConfig({
  apiKey: CONFIG.MAILCHIMP_API_KEY,
  server: CONFIG.MAILCHIMP_API_SERVER
});

export async function handler(event: HandlerEvent): Handler {
  try {
    // Validate the request
    const subscribeRequest: SubscribeRequest = JSON.parse(event.body);

    const isValid: boolean = ajv.validate(
      subscribeUserSchema,
      subscribeRequest
    );
    if (!isValid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ errors: ajv.errors })
      };
    }

    // Make sure the ToC is accepted if the game is played
    if (subscribeRequest.termsAndConditions !== subscribeRequest.participate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ errors: { message: 'Bad request' } })
      };
    }

    const token = getRandomToken();

    // Subscribe the user
    await mailchimp.lists.addListMember(CONFIG.MAILCHIMP_AUDIENCE_ID, {
      email_address: subscribeRequest.email,
      status: 'subscribed',
      merge_fields: {
        FNAME: subscribeRequest.firstName,
        LNAME: subscribeRequest.lastName,
        MERGE5: subscribeRequest.participate ? 'Yes' : 'No',
        MMERGE3: token,
        MMERGE4: subscribeRequest.githubHandle,
        MMERGE6: subscribeRequest.socialHandle,
        MMERGE8: subscribeRequest.interests,
        MMERGE9: subscribeRequest.receiveNews ? 'Yes' : 'No',
        MMERGE10: subscribeRequest.termsAndConditions ? 'Yes' : 'No'
      }
      // TODO add tags
    });

    await redisClient.storeUserToken(subscribeRequest.email, token);

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
    // Success return
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User subscribed' })
    };
  } catch (err) {
    console.error({
      req: event.body,
      message: err
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ errors: { message: 'Unabled to subsribe user' } })
    };
  }
}
