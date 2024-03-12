export interface EventbriteOrganization {
  name: string;
  id: number;
}

export interface EventbriteEvent {
  name: string;
  id: number;
}

export interface EventbriteTicket {
  name: string;
  id: number;
}

export interface EventbriteQuestion {
  name: string;
  id: number;
}

export interface EventbriteAttendee {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}
