import axios from 'axios';
import { type Request, type Response } from 'express';
import config from '../config';

export const eventbriteRedirect = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { code } = req.query;

  const codeString = code as string;

  const data = new FormData();
  data.append('grant_type', 'authorization_code');
  data.append('client_id', config.eventbriteApiKey);
  data.append('client_secret', config.eventbriteClientSecret);
  data.append('code', codeString);

  const response = await axios.post(
    'https://www.eventbrite.com/oauth/token',
    data
  );

  console.log(response.data);

  return res.status(200).end();
};
