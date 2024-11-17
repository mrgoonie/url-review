// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import Axios from "axios";

const prisma = new PrismaClient();

async function main() {
  console.log("✔️ Seed done!");
}

// Execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
