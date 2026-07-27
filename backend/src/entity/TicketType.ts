import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meetup } from './Meetup';
import { Ticket } from './Ticket';

@Entity({ name: 'ticket_types' })
export class TicketType extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => Meetup, (meetup) => meetup.ticketTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetup_id' })
  meetup: Meetup;

  @Column({ type: 'varchar', length: 60, default: 'General Admission' })
  name: string;

  @Column({ type: 'bigint' })
  price_cents: string;

  // ISO 4217, lowercase (e.g. 'usd')
  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number | null;

  @OneToMany(() => Ticket, (ticket) => ticket.ticket_type)
  tickets: Ticket[];
}
