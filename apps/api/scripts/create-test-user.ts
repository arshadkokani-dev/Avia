import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "demo@avia.dev";
  const password = "AviaDemo123!";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: "Avia Demo User",
      passwordHash,
    },
  });

  console.log(`Development account ready: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create development account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });