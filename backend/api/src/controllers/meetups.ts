import { Request, Response } from 'express'
import { Meetup } from '../entity/Meetup'
import { validateMeetup } from '../util/validator'
import { ILike } from 'typeorm'


export const getAllMeetups = async (req: Request, res: Response) => {
    const meetups = await Meetup.find();

    return res.json(meetups);
}

export const getMeetup = async (req: Request, res: Response) => {
    const { meetup_id } = req.params;

    const meetup = await Meetup.findOneBy({
        id: parseInt(meetup_id)
    });

    if (!meetup) {
        return res.status(404).json({ message: 'Invalid meetup ID.'});
    }

    return res.json(meetup);
}

export const createMeetup = async (req: Request, res: Response) => {
    const { error, value } = validateMeetup(req.body);

    if (error) {
        return res.status(400).json(error.details);
    }

    // Add requestor to front of organizer list
    value.organizer_ids.unshift(parseInt(res.locals.requestor.id));

    // Remove duplicates 
    value.organizer_ids = Array.from(new Set(value.organizer_ids));

    // Check if meetup name is taken
    const existingMeetup = await Meetup.findOne({
        where: {
            name:  ILike(value.name)
        }
    });

    // TODO(jan): Check if organizers are organizers?

    if (existingMeetup) {
        return res.status(409).json({ message: 'Meetup name is taken.' });
    }

    const newMeetup = Meetup.create(value);
    await newMeetup.save();

    return res.status(201).json(newMeetup);
}

export const updateMeetup = async (req: Request, res: Response) => {
    const { meetup_id } = req.params;
    const { name, date, organizer_ids, has_raffle } = req.body;

    const meetup = await Meetup.findOneBy({
        id: parseInt(meetup_id)
    });

    if (!meetup) {
        return res.status(404).json({ message: 'Invalid meetup ID.' });
    }
    
    // Check if meetup name is taken
    const existingMeetup = await Meetup.findOne({
        where: {
            name:  ILike(name)
        }
    });

    if (existingMeetup) {
        return res.status(409).json({ message: 'Meetup name is taken.' });
    }

    meetup.name = name ?? meetup.name;
    meetup.date = date ?? meetup.date;
    meetup.has_raffle = has_raffle ?? meetup.has_raffle;

    // Only allow "head" organizer to update organizer list
    if (meetup.organizer_ids[0] == parseInt(res.locals.requestor.id) && organizer_ids) {
        meetup.organizer_ids = organizer_ids;

        // Cast as number[]
        meetup.organizer_ids = meetup.organizer_ids.map((value) => Number(value));

        // Add requestor to front of organizer list (prevent head organizer from removing themselves)
        meetup.organizer_ids.unshift(parseInt(res.locals.requestor.id));

        // Remove duplicates 
        meetup.organizer_ids = Array.from(new Set(meetup.organizer_ids));
    } else if (organizer_ids) {
        return res.status(401).json({ message: 'Only the head organizer can edit the organizer list.' });
    }

    const { error, value } = validateMeetup(meetup);
    
    if (error) {
        return res.status(400).json(error.details);
    }

    await meetup.save();

    return res.status(201).json(meetup);
}

export const deleteMeetup = async (req: Request, res: Response) => {
    const { meetup_id } = req.params;

    const meetup = await Meetup.findOneBy({
        id: parseInt(meetup_id)
    });

    if (!meetup) {
        return res.status(404).json({ message: 'Invalid meetup ID.' });
    }

    if (meetup.organizer_ids[0] != parseInt(res.locals.requestor.id)) {
        return res.status(401).json({ message: 'Only the head organizer is authorized to delete this meetup.' });
    }

    meetup.remove();

    return res.status(204).end();
}
