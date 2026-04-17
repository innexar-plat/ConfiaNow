import { PrismaClient } from "@prisma/client";
import { ensureCoreSeedData } from "../src/bootstrap";

const prisma = new PrismaClient();

async function main() {
  await ensureCoreSeedData(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
