import axios from 'axios';
import { type Request, type Response } from 'express';
import config from '../config';
import { type User } from '../entity/User';
import { encrypt } from '../util/security';

export const eventbriteAuthorize = (req: Request, res: Response): void => {
  const { redirect_uri } = req.query;

  const redirectUri = redirect_uri as string;

  res.redirect(
    `https://www.eventbrite.com/oauth/authorize?response_type=code&client_id=${config.eventbriteApiKey}&redirect_uri=${redirectUri}`
  );
};

export const eventbriteRedirect = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { access_code } = req.body;

  const user = res.locals.requestor as User;

  const data = new FormData();
  data.append('grant_type', 'authorization_code');
  data.append('client_id', config.eventbriteApiKey);
  data.append('client_secret', config.eventbriteClientSecret);
  data.append('code', access_code);

  try {
    const response = await axios.post(
      'https://www.eventbrite.com/oauth/token',
      data
    );

    user.encrypted_eventbrite_token = encrypt(response.data.access_token);

    await user.save();
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(200).end();
};
