import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from './Ticket';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 30 })
  first_name: string;

  @Column({ type: 'varchar', length: 30 })
  last_name: string;

  @Column({ type: 'varchar', length: 30 })
  nick_name: string;

  @Column({ type: 'boolean', default: false })
  is_organizer: boolean;

  @Column({ type: 'boolean', default: false })
  is_admin: boolean;

  @Column({ type: 'varchar', length: 60 })
  password_hash: string;

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  @Column({ type: 'varchar', length: 96, nullable: true })
  encrypted_eventbrite_token?: string;
}
