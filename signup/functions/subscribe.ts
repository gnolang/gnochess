import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';
import mailchimp from '@mailchimp/mailchimp_marketing';
import type { Handler, HandlerEvent } from '@netlify/functions';

import { CONFIG } from './config';
import subscribeUserSchema from './schemas/users.schema';
import { RedisClient } from './services/redis';
import getRandomToken from './helpers/token.helper';

interface SubscribeRequest {
  firstName: string;
  lastName: string;
  email: string;
  githubHandle: string;
  socialHandle: string;
  interests: string;
  receiveNews: boolean;
  participate: boolean;
  termsAndConditions: boolean;
}

const ajv = new Ajv();
ajvFormats(ajv);

// Login to redis
const redisClient = new RedisClient(CONFIG.REDIS_URL);

// Set up mailchimp
mailchimp.setConfig({
  apiKey: CONFIG.MAILCHIMP_API_KEY,
  server: CONFIG.MAILCHIMP_API_SERVER
});

const headers =
  process.env.NODE_ENV !== 'production'
    ? {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    : {};

export async function handler(event: HandlerEvent): Handler {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  } else if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405
    };
  }

  try {
    // Validate the request
    const subscribeRequest: SubscribeRequest = JSON.parse(event.body);

    // Intentional; TODO Remove
    console.log(subscribeRequest);

    const isValid: boolean = ajv.validate(
      subscribeUserSchema,
      subscribeRequest
    );
    if (!isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ errors: 'Unable to validate request' })
      };
    }

    // Make sure the ToC is accepted if the game is played
    if (subscribeRequest.termsAndConditions !== subscribeRequest.participate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ errors: { message: 'Request is invalid' } })
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
      headers,
      body: JSON.stringify({ message: 'User subscribed' })
    };
  } catch (err) {
    console.error({
      req: event.body,
      message: err
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ errors: { message: 'Unable to subscribe user' } })
    };
  }
}
