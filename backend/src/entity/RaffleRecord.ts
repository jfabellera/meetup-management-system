import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meetup } from './Meetup';

@Entity({ name: 'raffle_record' })
export class RaffleRecord extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'boolean' })
  is_batch_roll: boolean;

  @Column({ type: 'bigint', array: true })
  winners: number[];

  @Column({ type: 'bigint', array: true, default: '{}' })
  winners_claimed: number[];

  @Column({ type: 'boolean', default: 'false' })
  was_displayed: boolean;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => Meetup, (meetup) => meetup.id)
  @JoinColumn({ name: 'meetup_id' })
  meetup: Meetup;

  @BeforeInsert()
  @BeforeUpdate()
  validateClaimedWinners = (): void => {
    if (this.winners_claimed == null) return;
    this.winners_claimed.forEach((claimedWinner) => {
      if (!this.winners.includes(claimedWinner)) {
        throw new Error(
          'All members of \twinners_claimed\t must be present in \twinners\t'
        );
      }
    });
  };
}
