import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { type Request, type Response } from 'express';
import { type ParsedQs } from 'qs';
import { ILike, type FindOptionsOrder, type FindOptionsWhere } from 'typeorm';
import { EventbriteRecord } from '../entity/EventbriteRecord';
import { Meetup } from '../entity/Meetup';
import { Ticket } from '../entity/Ticket';
import { type User } from '../entity/User';
import { EventbriteAttendee } from '../interfaces/eventbriteInterfaces';
import {
  getEventbriteAttendees,
  getEventbriteEvent,
  getEventbriteTicket,
} from '../util/eventbriteApi';
import { geocode, getUtcOffset } from '../util/externalApis';
import { decrypt } from '../util/security';
import { createMeetupSchema, editMeetupSchema } from '../util/validator';

dayjs.extend(utc);

export interface MeetupInfo {
  id: number;
  name: string;
  date: string;
  location: {
    full_address?: string;
    address_line_1?: string;
    address_line_2?: string;
    city: string;
    state: string | null;
    country: string;
    postal_code?: string;
  };
  organizers?: string[];
  tickets?: {
    total: number;
    available: number;
  };
  duration_hours?: number;
  image_url: string;
}

export interface TicketInfo {
  id: number;
  created_at: Date;
  is_checked_in: boolean;
  checked_in_at?: Date;
  user?: {
    email: string;
    first_name: string;
    last_name: string;
    nick_name: string;
  };
}

enum TicketInfoDetailLevel {
  Simple,
  Detailed,
}

enum MeetupInfoDetailLevel {
  Simple,
  Detailed,
}

const mapMeetupInfo = async (
  meetup: Meetup,
  type: MeetupInfoDetailLevel
): Promise<MeetupInfo> => {
  const meetupInfo: MeetupInfo = {
    id: meetup.id,
    name: meetup.name,
    date: dayjs(meetup.date).utcOffset(meetup.utc_offset).format(),
    duration_hours: meetup.duration_hours,
    location: {
      city: meetup.city,
      state: meetup.state,
      country: meetup.country,
    },
    image_url: meetup.image_url,
  };

  if (type === MeetupInfoDetailLevel.Detailed) {
    meetupInfo.location.full_address = meetup.address;

    meetupInfo.organizers = meetup.organizers.map(
      (organizer) => organizer.nick_name
    );

    // Get ticket details
    const ticketCount = await Ticket.count({
      where: {
        meetup: {
          id: meetup.id,
        },
      },
    });

    meetupInfo.tickets = {
      total: meetup.capacity,
      available: meetup.capacity - ticketCount,
    };
  }

  return meetupInfo;
};

const createMeetupsFilter = (query: ParsedQs): FindOptionsWhere<Meetup> => {
  const findOptionsWhere: FindOptionsWhere<Meetup> = {};

  if (query.by_organizer_id != null) {
    const organizerId = Number(query.by_organizer_id);
    findOptionsWhere.organizers = {
      id: organizerId,
    };
  }

  if (query.by_city != null) {
    const city = String(query.by_city);
    findOptionsWhere.city = ILike(city);
  }

  if (query.by_state != null) {
    const state = String(query.by_state);
    findOptionsWhere.state = ILike(state);
  }

  if (query.by_country != null) {
    const country = String(query.by_country);
    findOptionsWhere.country = ILike(country);
  }

  return findOptionsWhere;
};

const createMeetupsSorting = (query: ParsedQs): FindOptionsOrder<Meetup> => {
  const findOptionsOrder: FindOptionsOrder<Meetup> = {};

  if (query.sort_by != null) {
    const sortBy = query.sort_by as string;

    if (sortBy === 'date_asc') findOptionsOrder.date = 'ASC';
    else if (sortBy === 'date_desc') findOptionsOrder.date = 'DESC';
    else if (sortBy === 'id_asc') findOptionsOrder.id = 'ASC';
    else if (sortBy === 'id_desc') findOptionsOrder.id = 'DESC';
    else findOptionsOrder.date = 'ASC';
  } else {
    findOptionsOrder.date = 'ASC';
  }

  return findOptionsOrder;
};

export const getAllMeetups = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { detail_level } = req.query;

  const detailLevel =
    detail_level != null &&
    (detail_level as string).toLowerCase() === 'detailed'
      ? MeetupInfoDetailLevel.Detailed
      : MeetupInfoDetailLevel.Simple;

  // Build filters and sorting
  const findOptionsWhere = createMeetupsFilter(req.query);
  const findOptionsOrder = createMeetupsSorting(req.query);

  // Query
  const meetups: Array<Promise<MeetupInfo>> = (
    await Meetup.find({
      relations: {
        organizers: true,
      },
      where: findOptionsWhere,
      order: findOptionsOrder,
    })
  ).map(async (meetup: Meetup): Promise<MeetupInfo> => {
    const meetupInfo = await mapMeetupInfo(meetup, detailLevel);
    return meetupInfo;
  });

  return res.json(await Promise.all(meetups));
};

export const getMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params;
  const { detail_level } = req.query;

  const detailLevel =
    detail_level != null && (detail_level as string).toLowerCase() === 'simple'
      ? MeetupInfoDetailLevel.Simple
      : MeetupInfoDetailLevel.Detailed;

  const meetup = await Meetup.findOne({
    relations: {
      organizers: true,
    },
    where: {
      id: parseInt(meetup_id),
    },
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetup ID.' });
  }

  const meetupInfo = await mapMeetupInfo(meetup, detailLevel);

  return res.json(meetupInfo);
};

export const createMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = createMeetupSchema.safeParse(req.body);
  const user = res.locals.requestor as User;

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  const newMeetup = Meetup.create({
    name: result.data.name,
    date: result.data.date,
    address: result.data.address,
    organizers: [],
    has_raffle: result.data.has_raffle,
    capacity: result.data.capacity,
    duration_hours: result.data.duration_hours,
    image_url: result.data.image_url,
  });

  // Add requestor to front of organizer list
  newMeetup.organizers.unshift(res.locals.requestor);

  // Remove duplicates
  newMeetup.organizers = Array.from(new Set(newMeetup.organizers));

  // Check if meetup name is taken
  const existingMeetup = await Meetup.findOne({
    where: {
      name: ILike(result.data.name),
    },
  });

  // TODO(jan): Check if organizers are organizers?

  if (existingMeetup != null) {
    return res.status(409).json({ message: 'Meetup name is taken.' });
  }

  // Get UTC offset for the inputted address
  try {
    const geocodeResult = await geocode(req.body.address);

    newMeetup.address = geocodeResult.fullAddress;
    newMeetup.city = geocodeResult.city;
    if (geocodeResult.state != null) newMeetup.state = geocodeResult.state;
    newMeetup.country = geocodeResult.country;

    newMeetup.utc_offset = await getUtcOffset(
      geocodeResult.latitude,
      geocodeResult.longitude,
      new Date(result.data.date)
    );
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }

  // Apply offset to date to be correct UTC
  newMeetup.date = dayjs
    .utc(newMeetup.date)
    .subtract(newMeetup.utc_offset, 'hour')
    .toISOString();

  // Create Eventbrite record if necessary
  if (
    result.data.eventbrite_event_id != null &&
    result.data.eventbrite_ticket_id != null &&
    result.data.eventbrite_question_id != null &&
    user.encrypted_eventbrite_token != null
  ) {
    // TODO(jan): Validate these
    const newEventbriteRecord = EventbriteRecord.create({
      event_id: result.data.eventbrite_event_id,
      ticket_class_id: result.data.eventbrite_ticket_id,
      display_name_question_id: result.data.eventbrite_question_id,
    });

    const ebEvent = await getEventbriteEvent(
      decrypt(user.encrypted_eventbrite_token),
      result.data.eventbrite_event_id
    );

    if (ebEvent == null) {
      return res
        .status(400)
        .json({ message: 'Unable to get Eventbrite info.' });
    }

    newEventbriteRecord.url = ebEvent.url ?? '';
    newEventbriteRecord.meetup = await newMeetup.save();

    await newEventbriteRecord.save();
  } else {
    await newMeetup.save();
  }

  return res.status(201).json(newMeetup);
};

export const updateMeetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params;

  const result = editMeetupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(result.error);
  }

  const meetup = await Meetup.findOneBy({
    id: parseInt(meetup_id),
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetup ID.' });
  }

  // Check if meetup name is taken
  const existingMeetup = await Meetup.findOne({
    where: {
      name: ILike(req.body.name),
    },
  });

  if (existingMeetup != null) {
    return res.status(409).json({ message: 'Meetup name is taken.' });
  }

  meetup.name = req.body.name ?? meetup.name;
  meetup.duration_hours = req.body.duration_hours ?? meetup.duration_hours;
  meetup.has_raffle = req.body.has_raffle ?? meetup.has_raffle;
  meetup.capacity = req.body.capacity ?? meetup.capacity;
  meetup.image_url = req.body.image_url ?? meetup.image_url;
  meetup.address = req.body.address ?? meetup.address;

  // TODO(jan): This is mostly copied from createMeetup. We should reduce this duplication
  if (req.body.address != null || req.body.date != null) {
    try {
      const oldLocalDateTime = dayjs
        .utc(meetup.date)
        .add(meetup.utc_offset, 'hour');
      const geocodeResult = await geocode(meetup.address);

      meetup.address = geocodeResult.fullAddress;
      meetup.city = geocodeResult.city;
      if (geocodeResult.state != null) meetup.state = geocodeResult.state;
      meetup.country = geocodeResult.country;

      meetup.utc_offset = await getUtcOffset(
        geocodeResult.latitude,
        geocodeResult.longitude,
        new Date(meetup.date)
      );

      // Apply offset to date to be correct UTC
      meetup.date = dayjs
        .utc(req.body.date ?? oldLocalDateTime)
        .subtract(meetup.utc_offset, 'hour')
        .toISOString();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // TODO(jan): Implement this correctly with new typeorm entities

  // Only allow "head" organizer to update organizer list
  // if (
  //   meetup.organizer_ids[0] === parseInt(res.locals.requestor.id) &&
  //   organizer_ids != null
  // ) {
  //   meetup.organizer_ids = organizer_ids;

  //   // Cast as number[]
  //   meetup.organizer_ids = meetup.organizer_ids.map((value) => Number(value));

  //   // Add requestor to front of organizer list (prevent head organizer from removing themselves)
  //   meetup.organizer_ids.unshift(parseInt(res.locals.requestor.id));

  //   // Remove duplicates
  //   meetup.organizer_ids = Array.from(new Set(meetup.organizer_ids));
  // } else if (organizer_ids != null) {
  //   return res.status(401).json({
  //     message: 'Only the head organizer can edit the organizer list.',
  //   });
  // }

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

  if (Number(meetup.organizers[0].id) !== parseInt(res.locals.requestor.id)) {
    return res.status(401).json({
      message: 'Only the head organizer is authorized to delete this meetup.',
    });
  }

  await meetup.remove();

  return res.status(204).end();
};

export const getMeetupAttendees = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { meetup_id } = req.params;
  const { detail_level } = req.query;
  const user = res.locals.requestor as User;

  const detailLevel =
    detail_level != null &&
    (detail_level as string).toLowerCase() === 'detailed'
      ? TicketInfoDetailLevel.Detailed
      : TicketInfoDetailLevel.Simple;

  const meetup = await Meetup.findOne({
    select: {
      tickets: {
        id: true,
        created_at: true,
        is_checked_in: true,
        checked_in_at: true,
        user: {
          first_name: true,
          last_name: true,
          nick_name: true,
          email: true,
        },
        eventbrite_attendee_id: true,
      },
    },
    relations: { tickets: { user: true }, eventbriteRecord: true },
    where: {
      id: parseInt(meetup_id),
    },
  });

  if (meetup == null) {
    return res.status(404).json({ message: 'Invalid meetupID.' });
  }

  // Get attendee list from Eventbrite if meetup is setup with Eventbrite
  let ebAttendees: EventbriteAttendee[];
  if (
    detailLevel === TicketInfoDetailLevel.Detailed &&
    meetup.eventbriteRecord != null &&
    user.encrypted_eventbrite_token != null
  ) {
    const ebToken = decrypt(user.encrypted_eventbrite_token);
    ebAttendees = await getEventbriteAttendees(
      ebToken,
      meetup.eventbriteRecord.event_id,
      meetup.eventbriteRecord.ticket_class_id,
      meetup.eventbriteRecord.display_name_question_id
    );
  }

  const response = meetup.tickets.map((ticket) => {
    const ticketInfo: TicketInfo = {
      id: ticket.id,
      created_at: ticket.created_at,
      is_checked_in: ticket.is_checked_in,
    };

    if (detailLevel === TicketInfoDetailLevel.Detailed) {
      if (ticket.eventbrite_attendee_id == null) {
        ticketInfo.user = {
          email: ticket.user.email,
          nick_name: ticket.user.nick_name,
          first_name: ticket.user.first_name,
          last_name: ticket.user.last_name,
        };
      } else {
        const ebAttendee = ebAttendees.find(
          (attendee) => attendee.id === ticket.eventbrite_attendee_id
        );

        if (ebAttendee != null) {
          ticketInfo.user = {
            email: ebAttendee.email,
            nick_name: ebAttendee.displayName,
            first_name: ebAttendee.firstName,
            last_name: ebAttendee.lastName,
          };
        }
      }
    }

    if (ticket.is_checked_in) {
      ticketInfo.checked_in_at = ticket.checked_in_at;
    }

    return ticketInfo;
  });

  return res.json(response);
};

export const syncEventbriteAttendees = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const meetup = res.locals.meetup as Meetup;
  const user = res.locals.requestor as User;

  if (
    meetup.eventbriteRecord == null ||
    user.encrypted_eventbrite_token == null
  ) {
    return res
      .status(400)
      .json({ message: 'Unable to retrieve Eventbrite data.' });
  }

  const ebToken = decrypt(user.encrypted_eventbrite_token);
  // Update meetup
  const ebEvent = await getEventbriteEvent(
    ebToken,
    meetup.eventbriteRecord.event_id
  );

  if (ebEvent?.name != null) meetup.name = ebEvent.name;
  if (ebEvent?.imageUrl != null) meetup.image_url = ebEvent.imageUrl;
  if (ebEvent?.date != null) meetup.date = ebEvent.date;

  const ebTicketClass = await getEventbriteTicket(
    ebToken,
    meetup.eventbriteRecord.event_id,
    meetup.eventbriteRecord.ticket_class_id
  );

  if (ebTicketClass?.total != null) meetup.capacity = ebTicketClass.total;

  await meetup.save();

  // Update tickets
  const ebAttendees = await getEventbriteAttendees(
    ebToken,
    meetup.eventbriteRecord.event_id,
    meetup.eventbriteRecord.ticket_class_id,
    meetup.eventbriteRecord.display_name_question_id
  );

  ebAttendees.forEach((attendee) => {
    void (async () => {
      const existingTicket = await Ticket.findOne({
        where: { eventbrite_attendee_id: attendee.id },
      });

      if (existingTicket != null) {
        // Update checked in status
        if (existingTicket.is_checked_in !== attendee.isCheckedIn) {
          existingTicket.is_checked_in = attendee.isCheckedIn;
          await existingTicket.save();
        }
        return;
      }

      // Create new ticket
      const newTicket = Ticket.create({
        meetup,
        eventbrite_attendee_id: attendee.id,
        created_at: attendee.createdAt,
      });

      await newTicket.save();
    })();
  });
  return res.status(200).end();
};
