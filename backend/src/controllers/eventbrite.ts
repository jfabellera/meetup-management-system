import axios from 'axios';
import { type Request, type Response } from 'express';
import { type User } from '../entity/User';
import type {
  EventbriteEvent,
  EventbriteOrganization,
  EventbriteQuestion,
} from '../interfaces/eventbriteInterfaces';
import { decrypt } from '../util/security';

const rejectNoToken = (res: Response): Response => {
  return res
    .status(400)
    .json({ message: 'No Eventbrite access token tied to user.' });
};

export const getEventbriteOrganizations = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const user = res.locals.requestor as User;

  if (user.encrypted_eventbrite_token == null) return rejectNoToken(res);

  try {
    const ebToken = decrypt(user.encrypted_eventbrite_token);

    const response = await axios.get(
      'https://www.eventbriteapi.com/v3/users/me/organizations/',
      {
        headers: {
          Authorization: `Bearer ${ebToken}`,
        },
      },
    );

    const organizations: EventbriteOrganization[] =
      response.data.organizations?.map((organization: any) => {
        return {
          name: organization.name,
          id: organization.id,
        } satisfies EventbriteOrganization;
      });

    return res.status(200).json(organizations);
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to get organizations.' });
  }
};

export const getEventbriteEvents = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { organization_id } = req.params;
  const user = res.locals.requestor as User;

  if (user.encrypted_eventbrite_token == null) return rejectNoToken(res);

  try {
    const ebToken = decrypt(user.encrypted_eventbrite_token);

    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/organizations/${organization_id}/events/`,
      {
        headers: {
          Authorization: `Bearer ${ebToken}`,
        },
      },
    );

    const events: EventbriteEvent[] = response.data.events?.map(
      (event: any) => {
        return {
          name: event.name.text,
          id: event.id,
        } satisfies EventbriteEvent;
      },
    );

    return res.status(200).json(events);
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to get events.' });
  }
};

export const getEventbriteQuestions = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { event_id } = req.params;
  const user = res.locals.requestor as User;

  if (user.encrypted_eventbrite_token == null) return rejectNoToken(res);

  try {
    const ebToken = decrypt(user.encrypted_eventbrite_token);

    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/events/${event_id}/questions/`,
      {
        headers: {
          Authorization: `Bearer ${ebToken}`,
        },
      },
    );

    const questions: EventbriteQuestion[] = response.data.questions?.map(
      (question: any) => {
        return {
          name: question.question.text,
          id: question.id,
        } satisfies EventbriteQuestion;
      },
    );

    return res.status(200).json(questions);
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to get custom questions.' });
  }
};
