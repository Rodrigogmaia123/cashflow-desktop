-- CreateEnum
CREATE TYPE "OfferCountry" AS ENUM ('AR', 'BR', 'US', 'MX', 'CO');

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN "country" "OfferCountry";
