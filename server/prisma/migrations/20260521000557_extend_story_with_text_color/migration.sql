-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "backgroundColor" TEXT NOT NULL DEFAULT '#ff0000',
ADD COLUMN     "text" TEXT,
ALTER COLUMN "image" DROP NOT NULL;
