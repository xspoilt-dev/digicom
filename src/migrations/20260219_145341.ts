import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cash_on_delivery', 'partial_delivery_charge', 'full_payment');
  ALTER TABLE "orders" ADD COLUMN "payment_method" "enum_orders_payment_method" DEFAULT 'cash_on_delivery' NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "payment_trx_id" varchar;
  ALTER TABLE "orders" ADD COLUMN "payment_amount" numeric;
  ALTER TABLE "site_settings" ADD COLUMN "payment_instructions_partial_payment" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "payment_instructions_full_payment" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "payment_method";
  ALTER TABLE "orders" DROP COLUMN "payment_trx_id";
  ALTER TABLE "orders" DROP COLUMN "payment_amount";
  ALTER TABLE "site_settings" DROP COLUMN "payment_instructions_partial_payment";
  ALTER TABLE "site_settings" DROP COLUMN "payment_instructions_full_payment";
  DROP TYPE "public"."enum_orders_payment_method";`)
}
