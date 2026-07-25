import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeConnectAccount1785100000000
  implements MigrationInterface
{
  name = 'AddStripeConnectAccount1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "stripe_account_id" character varying(32)`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "stripe_charges_enabled" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "stripe_payouts_enabled" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "stripe_details_submitted" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "stripe_details_submitted"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "stripe_payouts_enabled"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "stripe_charges_enabled"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "stripe_account_id"`
    );
  }
}
