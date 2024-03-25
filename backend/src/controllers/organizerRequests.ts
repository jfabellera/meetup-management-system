import { Request, Response } from 'express';
import { OrganizerRequests } from '../entity/OrganizerRequests';

export const getAllOrganizerRequests = async (req: Request, res: Response): Promise<Response> => {
  const organizerRequests: OrganizerRequests[] = await OrganizerRequests.find();

  return res.json(organizerRequests);
};

export const createOrganizerRequest = async (req: Request, res: Response) => {
  const user_id = parseInt(res.locals.requestor.id);

  const existingRequest = await OrganizerRequests.findOneBy({ user_id });

  if (existingRequest != null) {
    return res.status(409).json({ message: 'Request from user already exists.' });
  }

  const newOrganizerRequest = OrganizerRequests.create({ user_id });
  await newOrganizerRequest.save();

  return res.status(201).json(newOrganizerRequest);
};

export const deleteOrganizerRequest = async (req: Request, res: Response) => {
  const { request_id } = req.params;

  const organizerRequest = await OrganizerRequests.findOneBy({
    id: parseInt(request_id),
  });

  if (organizerRequest == null) {
    return res.status(404).json({ message: 'Invalid organizer request ID.' });
  }

  await organizerRequest.remove();

  return res.status(204).end();
};
