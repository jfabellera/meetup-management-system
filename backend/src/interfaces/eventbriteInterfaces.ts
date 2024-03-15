export interface EventbriteOrganization {
  name: string;
  id: number;
}

export interface EventbriteEvent {
  name: string;
  id: number;
  imageUrl?: string;
  date?: string;
}

export interface EventbriteTicket {
  name: string;
  id: number;
  total?: number;
  sold?: number;
}

export interface EventbriteQuestion {
  name: string;
  id: number;
}

export interface EventbriteAttendee {
  id: number;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  isCheckedIn: boolean;
}
