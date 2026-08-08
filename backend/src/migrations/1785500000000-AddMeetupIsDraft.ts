import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMeetupIsDraft1785500000000 implements MigrationInterface {
  name = 'AddMeetupIsDraft1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meetups" ADD "is_draft" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "meetups" DROP COLUMN "is_draft"`);
  }
}
