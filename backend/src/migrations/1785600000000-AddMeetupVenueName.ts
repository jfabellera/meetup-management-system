import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetupVenueName1785600000000 implements MigrationInterface {
  name = 'AddMeetupVenueName1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetups" ADD "venue_name" character varying(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "meetups" DROP COLUMN "venue_name"`);
  }
}
