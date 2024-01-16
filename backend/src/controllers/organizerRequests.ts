import { Request, Response } from 'express';
import { OrganizerRequests } from '../entity/OrganizerRequests';

export const getAllOrganizerRequests = async (req: Request, res: Response) => {
    const organizerRequests = await OrganizerRequests.find();

    return res.json(organizerRequests);
};

export const createOrganizerRequest = async (req: Request, res: Response) => {
    const request_id = parseInt(req.params.meetup_id);
    const user_id = parseInt(res.locals.requestor.id);

    const existingRequest = await OrganizerRequests.findOneBy({
        user_id: user_id,
    });

    if (existingRequest) {
        return res.status(409).json({ message: 'Request from user already exists.' });
    }
    const value = { id: request_id, user_id: user_id };

    const newOrganizerRequest = OrganizerRequests.create(value);
    await newOrganizerRequest.save();

    return res.status(201).json(newOrganizerRequest);
};

export const deleteOrganizerRequest = async (req: Request, res: Response) => {
    const { request_id } = req.params;

    const organizerRequest = await OrganizerRequests.findOneBy({
        id: parseInt(request_id),
    });

    if (!organizerRequest) {
        return res.status(404).json({ message: 'Invalid organizer request ID.' });
    }

    await organizerRequest.remove();

    return res.status(204).end();
};
