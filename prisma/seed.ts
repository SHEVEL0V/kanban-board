import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_USER = { name: "Demo User", email: "demo@example.com", password: "password123" };

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {},
    create: { name: DEMO_USER.name, email: DEMO_USER.email, passwordHash },
  });

  const existingBoard = await prisma.board.findFirst({ where: { ownerId: user.id, title: "Product Launch" } });
  if (existingBoard) {
    await prisma.board.delete({ where: { id: existingBoard.id } });
  }

  await prisma.board.create({
    data: {
      title: "Product Launch",
      ownerId: user.id,
      columns: {
        create: [
          {
            title: "Backlog",
            order: 0,
            tasks: {
              create: [
                {
                  title: "Research competitor pricing",
                  description: "Collect pricing pages from the top 5 competitors and summarize tiers.",
                  priority: "LOW",
                  order: 0,
                },
                {
                  title: "Define onboarding flow",
                  description: "Sketch the first-run experience for new accounts.",
                  priority: "MEDIUM",
                  order: 1,
                },
                {
                  title: "Set up analytics dashboard",
                  priority: "LOW",
                  order: 2,
                },
              ],
            },
          },
          {
            title: "In Progress",
            order: 1,
            wipLimit: 3,
            tasks: {
              create: [
                {
                  title: "Implement payment integration",
                  description: "Connect Stripe checkout for monthly and annual plans.",
                  priority: "HIGH",
                  dueDate: new Date(Date.now() + 2 * DAY),
                  order: 0,
                },
                {
                  title: "Design landing page hero section",
                  description: "Final visuals for the above-the-fold section.",
                  priority: "MEDIUM",
                  dueDate: new Date(Date.now() + 5 * DAY),
                  order: 1,
                },
                {
                  title: "Write API documentation",
                  priority: "MEDIUM",
                  dueDate: new Date(Date.now() - 1 * DAY),
                  order: 2,
                },
              ],
            },
          },
          {
            title: "Review",
            order: 2,
            wipLimit: 2,
            tasks: {
              create: [
                {
                  title: "Security audit of auth flow",
                  description: "Review session handling and password storage before launch.",
                  priority: "HIGH",
                  dueDate: new Date(Date.now() + 1 * DAY),
                  order: 0,
                },
                {
                  title: "Accessibility pass on forms",
                  priority: "MEDIUM",
                  order: 1,
                },
              ],
            },
          },
          {
            title: "Done",
            order: 3,
            tasks: {
              create: [
                {
                  title: "Set up CI/CD pipeline",
                  description: "Automated lint, build and deploy on push to main.",
                  priority: "MEDIUM",
                  order: 0,
                },
                {
                  title: "Choose tech stack",
                  priority: "LOW",
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Seeded board "Product Launch" for ${DEMO_USER.email} / ${DEMO_USER.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
