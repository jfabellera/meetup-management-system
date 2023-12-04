import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity({ name: 'tickets' })
export class Ticket extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  meetup_id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'boolean' })
  is_checked_in: boolean;

  @Column({ type: 'int' })
  raffle_entries: number;

  @Column({ type: 'int' })
  raffle_wins: number;
}
