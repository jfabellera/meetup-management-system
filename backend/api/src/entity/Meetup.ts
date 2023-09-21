import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity({ name: 'meetups' })
export class Meetup extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'bigint', array: true })
  organizer_ids: number[];

  @Column({ type: 'boolean' })
  has_raffle: boolean;
}
