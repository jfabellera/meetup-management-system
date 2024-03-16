import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meetup } from './Meetup';

@Entity({ name: 'eventbrite_record' })
export class EventbriteRecord extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  event_id: number;

  @Column({ type: 'bigint' })
  ticket_class_id: number;

  @Column({ type: 'bigint' })
  display_name_question_id: number;

  @Column({ type: 'varchar', length: 255 })
  url: string;

  @OneToOne(() => Meetup, (meetup) => meetup.id)
  @JoinColumn({ name: 'meetup_id' })
  meetup: Meetup;
}
