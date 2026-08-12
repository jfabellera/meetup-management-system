import { z } from 'zod';
import { nonNegativeNumber } from './fields';

const MeetupFromEventbriteFormSchema = z.object({
  organizationId: z.string().min(1, 'Select an organization'),
  eventId: z.string().min(1, 'Select an event'),
  ticketClassId: z.string().min(1, 'Select a ticket class'),
  customQuestionId: z.string().min(1, 'Select a custom question'),
  defaultRaffleEntries: nonNegativeNumber,
});

export default MeetupFromEventbriteFormSchema;
