import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'meetups' })
export class Meetup extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'timestamp with time zone' })
  date: string;

  @Column({ type: 'bigint', array: true })
  organizer_ids: number[];

  @Column({ type: 'boolean' })
  has_raffle: boolean;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'varchar', length: 255 })
  address_line_1: string;

  @Column({ type: 'varchar', length: 255 })
  address_line_2: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  state: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ type: 'varchar', length: 20 })
  postal_code: string;

  @Column({ type: 'int' })
  utc_offset: number;

  @Column({ type: 'varchar', length: 255 })
  image_url: string;
}
