import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { type Request, type Response } from 'express';
import Joi from 'joi';
import { ArrayContains, ILike, In, type FindOptionsWhere } from 'typeorm';
import { Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { User } from '../entity/User';
import { getUtcOffset } from '../util/utcOffset';
import { validateMeetup } from '../util/validator';

dayjs.extend(utc);

/**
 * This contains basic information about a meetup, mainly details necessary for
 * the homepage
 */
export interface SimpleMeetupInfo {
  id: number;
  name: string;
  date: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  image_url: string;
}

/**
 * This contains all important information about a meetup
 */
export interface FullMeetupInfo {
  id: number;
  name: string;
  date: string;
  location: {
    full_address: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string | null;
    country: string;
    postal_code: string;
  };
  organizers: string[];
  tickets: {
    total: number;
    available: number;
  };
  image_url: string;
}

export const getAllMeetups = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { organizer_ids } = req.body;

  // Build filters
  const findOptionsWhere: FindOptionsWhere<Meetup> = {};

  if (
    Joi.array().items(Joi.number()).required().validate(organizer_ids).error ==
    null
  ) {
    findOptionsWhere.organizer_ids = ArrayContains<number>(organizer_ids);
  }

  // TODO(jan): Add additional filters and sorting options

  // Query
  const meetups: SimpleMeetupInfo[] = (
    await Meetup.find({
      where: findOptionsWhere,
      order: {
        date: 'ASC',
      },
    })
  ).map((meetup: Meetup): SimpleMeetupInfo => {
    const simplifiedMeetupInfo: SimpleMeetupInfo = {
      id: meetup.id,
      name: meetup.name,
      date: dayjs(meetup.date).utcOffset(meetup.utc_offset).format(),
      location: {
        city: meetup.city,
        state: meetup.state,
        country: meetup.country,
      },
      image_url: meetup.image_url,
    };

    return simplifiedMeetupInfo;
  });

  return res.json(meetups);
};

export const getMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params;

  const meetup = await Meetup.findOneBy({
    id: parseInt(meetup_id),
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetup ID.' });
  }

  const meetupInfo: FullMeetupInfo = {
    id: meetup.id,
    name: meetup.name,
    date: dayjs(meetup.date).utcOffset(meetup.utc_offset).format(),
    location: {
      full_address: '',
      address_line_1: meetup.address_line_1,
      address_line_2: meetup.address_line_2,
      city: meetup.city,
      state: meetup.state,
      country: meetup.country,
      postal_code: meetup.postal_code,
    },
    organizers: [],
    tickets: {
      total: meetup.capacity,
      available: 0,
    },
    image_url: meetup.image_url,
  };

  // Build full address
  const addressComponents: string[] = [];
  if (meetup.address_line_1 !== '')
    addressComponents.push(meetup.address_line_1);
  if (meetup.address_line_2 !== '')
    addressComponents.push(meetup.address_line_2);
  if (meetup.city !== '') addressComponents.push(meetup.city);
  if (meetup.state !== '') addressComponents.push(meetup.state);
  if (meetup.country !== '') addressComponents.push(meetup.country);
  if (meetup.postal_code !== '') addressComponents.push(meetup.postal_code);

  meetupInfo.location.full_address = addressComponents.join(', ');

  // Get organizer names
  const organizers = await User.find({
    select: ['nick_name'],
    where: {
      id: In(meetup.organizer_ids),
    },
  });

  meetupInfo.organizers = organizers.map((organizer) => organizer.nick_name);

  // Calculate available tickets
  const ticketCount = await Ticket.count({
    where: {
      meetup_id: meetup.id,
    },
  });

  meetupInfo.tickets.available = meetupInfo.tickets.total - ticketCount;

  return res.json(meetupInfo);
};

export const createMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { error, value } = validateMeetup(req.body);

  if (error != null) {
    return res.status(400).json(error.details);
  }

  // Add requestor to front of organizer list
  value.organizer_ids.unshift(parseInt(res.locals.requestor.id));

  // Remove duplicates
  value.organizer_ids = Array.from(new Set(value.organizer_ids));

  // Check if meetup name is taken
  const existingMeetup = await Meetup.findOne({
    where: {
      name: ILike(value.name),
    },
  });

  // TODO(jan): Check if organizers are organizers?

  if (existingMeetup != null) {
    return res.status(409).json({ message: 'Meetup name is taken.' });
  }

  // Get UTC offset for the inputted address
  try {
    value.utc_offset = await getUtcOffset(
      `${value.address_line_1} ${value.address_line_2} ${value.city} ${value.state} ${value.country} ${value.postal_code}`,
      new Date(value.date)
    );
  } catch (error: any) {
    // TODO(jan): Better error handling
    return res.status(500).json({
      message:
        'There was an issue determining the timezone for the provided address',
    });
  }

  // Apply offset to date to be correct UTC
  value.date = dayjs.utc(value.date).subtract(value.utc_offset, 'hour');

  const newMeetup = Meetup.create(value);
  await newMeetup.save();

  return res.status(201).json(newMeetup);
};

export const updateMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params;
  const { name, date, organizer_ids, has_raffle } = req.body;

  const meetup = await Meetup.findOneBy({
    id: parseInt(meetup_id),
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetup ID.' });
  }

  // Check if meetup name is taken
  const existingMeetup = await Meetup.findOne({
    where: {
      name: ILike(name),
    },
  });

  if (existingMeetup != null) {
    return res.status(409).json({ message: 'Meetup name is taken.' });
  }

  meetup.name = name ?? meetup.name;
  meetup.date = date ?? meetup.date;
  meetup.has_raffle = has_raffle ?? meetup.has_raffle;

  // Only allow "head" organizer to update organizer list
  if (
    meetup.organizer_ids[0] === parseInt(res.locals.requestor.id) &&
    organizer_ids != null
  ) {
    meetup.organizer_ids = organizer_ids;

    // Cast as number[]
    meetup.organizer_ids = meetup.organizer_ids.map((value) => Number(value));

    // Add requestor to front of organizer list (prevent head organizer from removing themselves)
    meetup.organizer_ids.unshift(parseInt(res.locals.requestor.id));

    // Remove duplicates
    meetup.organizer_ids = Array.from(new Set(meetup.organizer_ids));
  } else if (organizer_ids != null) {
    return res.status(401).json({
      message: 'Only the head organizer can edit the organizer list.',
    });
  }

  const { error } = validateMeetup(meetup);

  if (error != null) {
    return res.status(400).json(error.details);
  }

  await meetup.save();

  return res.status(201).json(meetup);
};

export const deleteMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params;

  const meetup = await Meetup.findOneBy({
    id: parseInt(meetup_id),
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetup ID.' });
  }

  if (Number(meetup.organizer_ids[0]) !== parseInt(res.locals.requestor.id)) {
    return res.status(401).json({
      message: 'Only the head organizer is authorized to delete this meetup.',
    });
  }

  await meetup.remove();

  return res.status(204).end();
};
