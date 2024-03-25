import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventbriteRecord } from './EventbriteRecord';
import { Ticket } from './Ticket';
import { User } from './User';

@Entity({ name: 'meetups' })
export class Meetup extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'timestamp with time zone' })
  date: string;

  @ManyToMany(() => User, (user) => user.id)
  @JoinTable()
  organizers: User[];

  @Column({ type: 'boolean', default: true })
  has_raffle: boolean;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'int' })
  utc_offset: number;

  @Column({ type: 'varchar', length: 255 })
  image_url: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  description: string;

  @Column({ type: 'int', default: 1 })
  default_raffle_entries: number;

  @OneToMany(() => Ticket, (ticket) => ticket.meetup)
  tickets: Ticket[];

  @OneToOne(() => EventbriteRecord, (ebRecord) => ebRecord.meetup)
  eventbriteRecord?: EventbriteRecord;
}
