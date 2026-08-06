import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetupDisplayIdleInterval1785400000000 implements MigrationInterface {
  name = 'AddMeetupDisplayIdleInterval1785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetup_display_record" ADD "idle_interval_seconds" integer NOT NULL DEFAULT '15'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetup_display_record" DROP COLUMN "idle_interval_seconds"`
    );
  }
}
