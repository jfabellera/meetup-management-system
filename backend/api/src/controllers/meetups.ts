import { Request, Response } from 'express'
import { Meetup } from '../entity/Meetup'
import { validateMeetup } from '../util/validator'
import { ILike } from 'typeorm'


export const getAllMeetups = async (req: Request, res: Response) => {
    const meetups = await Meetup.find();

    return res.json(meetups);
}

export const getMeetup = async (req: Request, res: Response) => {
    const { id } = req.params;

    const meetup = await Meetup.findOneBy({
        id: parseInt(id)
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

    // Check if meetup name is taken
    const existingMeetup = await Meetup.findOne({
        where: {
            name:  ILike(value.name)
        }
    });

    if (existingMeetup) {
        return res.status(409).json({ message: 'Meetup name is taken.' });
    }

    const newMeetup = Meetup.create(value);
    await newMeetup.save();

    return res.status(201).json(newMeetup);
}

export const updateMeetup = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, date, organizer_ids, has_raffle } = req.body;

    const meetup = await Meetup.findOneBy({
        id: parseInt(id)
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
    meetup.organizer_ids = organizer_ids ?? meetup.organizer_ids;
    meetup.has_raffle = has_raffle ?? meetup.has_raffle;

    const { error, value } = validateMeetup(meetup);
    
    if (error) {
        return res.status(400).json(error.details);
    }

    await meetup.save();

    return res.status(201).json(meetup);
}

export const deleteMeetup = async (req: Request, res: Response) => {
    const { id } = req.params;

    const meetup = await Meetup.findOneBy({
        id: parseInt(id)
    });

    if (!meetup) {
        return res.status(404).json({ message: 'Invalid meetup ID.' });
    }

    meetup.remove();

    return res.status(204).end();
}
