import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@avia.dev",
    },
    update: {},
    create: {
      email: "demo@avia.dev",
      name: "Avia Demo User",
      passwordHash: "development-only-placeholder",
    },
  });

  console.log("User:", user);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });