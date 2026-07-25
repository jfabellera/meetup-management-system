import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meetup } from './Meetup';
import { TicketType } from './TicketType';
import { User } from './User';

@Entity({ name: 'tickets' })
export class Ticket extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Meetup, (meetup) => meetup.id)
  @JoinColumn({ name: 'meetup_id' })
  meetup: Meetup;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  // Discord user who RSVP'd via the embed button. Null for web/Eventbrite
  // tickets. Snowflakes are stored as strings.
  @Column({ type: 'varchar', length: 32, nullable: true })
  discord_id?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'keebmeet' })
  rsvp_method: 'keebmeet' | 'discord' | 'eventbrite';

  @Column({ type: 'boolean', default: false })
  is_checked_in: boolean;

  @Column({ type: 'int', default: 0 })
  raffle_entries: number;

  @Column({ type: 'int', default: 0 })
  raffle_wins: number;

  @Column({ type: 'varchar', default: '' })
  ticket_holder_display_name: string;

  @Column({ type: 'varchar', default: '' })
  ticket_holder_first_name: string;

  @Column({ type: 'varchar', default: '' })
  ticket_holder_last_name: string;

  @Column({ type: 'varchar', default: '' })
  ticket_holder_email: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: null, nullable: true })
  checked_in_at: Date;

  @Column({ type: 'timestamptz', default: null, nullable: true })
  checked_out_at: Date;

  // bigint → string at runtime; holds an external Eventbrite attendee id.
  @Column({ type: 'bigint', default: null, nullable: true })
  eventbrite_attendee_id?: string | null;

  @ManyToOne(() => TicketType, (ticketType) => ticketType.tickets, {
    nullable: true,
  })
  @JoinColumn({ name: 'ticket_type_id' })
  ticket_type?: TicketType | null;

  // 'confirmed' = free instant RSVP (no payment)
  @Column({ type: 'varchar', length: 16, default: 'confirmed' })
  payment_status: 'confirmed' | 'pending' | 'paid' | 'refunded';

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  stripe_payment_intent_id?: string | null;

  @Column({ type: 'bigint', nullable: true })
  amount_paid_cents?: string | null;

  @Column({ type: 'bigint', nullable: true })
  application_fee_cents?: string | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_refund_id?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  hold_expires_at?: Date | null;
}
