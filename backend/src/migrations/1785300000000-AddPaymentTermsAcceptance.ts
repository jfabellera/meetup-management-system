import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentTermsAcceptance1785300000000
  implements MigrationInterface
{
  name = 'AddPaymentTermsAcceptance1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "payment_terms_accepted_at" TIMESTAMP WITH TIME ZONE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "payment_terms_accepted_at"`
    );
  }
}
