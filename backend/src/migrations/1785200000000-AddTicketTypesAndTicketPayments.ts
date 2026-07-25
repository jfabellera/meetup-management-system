import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketTypesAndTicketPayments1785200000000
  implements MigrationInterface
{
  name = 'AddTicketTypesAndTicketPayments1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ticket_types" ("id" BIGSERIAL NOT NULL, "meetup_id" bigint NOT NULL, "name" character varying(60) NOT NULL DEFAULT 'General Admission', "price_cents" bigint NOT NULL, "currency" character varying(3) NOT NULL, "capacity" integer, CONSTRAINT "PK_ticket_type_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_types" ADD CONSTRAINT "FK_ticket_types_meetup" FOREIGN KEY ("meetup_id") REFERENCES "meetups"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );

    await queryRunner.query(`ALTER TABLE "tickets" ADD "ticket_type_id" bigint`);
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "payment_status" character varying(16) NOT NULL DEFAULT 'confirmed'`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "stripe_payment_intent_id" character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "amount_paid_cents" bigint`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "application_fee_cents" bigint`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "currency" character varying(3)`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "stripe_refund_id" character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "hold_expires_at" TIMESTAMP WITH TIME ZONE`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "UQ_tickets_stripe_payment_intent_id" UNIQUE ("stripe_payment_intent_id")`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_ticket_type" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE SET NULL ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_ticket_type"`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "UQ_tickets_stripe_payment_intent_id"`
    );
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "hold_expires_at"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "stripe_refund_id"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "currency"`);
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP COLUMN "application_fee_cents"`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP COLUMN "amount_paid_cents"`
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP COLUMN "stripe_payment_intent_id"`
    );
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "payment_status"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "ticket_type_id"`);

    await queryRunner.query(
      `ALTER TABLE "ticket_types" DROP CONSTRAINT "FK_ticket_types_meetup"`
    );
    await queryRunner.query(`DROP TABLE "ticket_types"`);
  }
}
