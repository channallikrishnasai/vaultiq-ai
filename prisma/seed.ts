import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash("demo123456", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@vaultiq.ai" },
    update: { passwordHash, name: "Demo User" },
    create: {
      name: "Demo User",
      email: "demo@vaultiq.ai",
      passwordHash,
      profile: {
        create: {},
      },
    },
  });

  console.log(`Seed completed. User: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
