import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  EditorialStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const countries = [
  { isoCode: "ES", name: "España", slug: "espana" },
  { isoCode: "US", name: "Estados Unidos", slug: "estados-unidos" },
  { isoCode: "GB", name: "Reino Unido", slug: "reino-unido" },
  { isoCode: "FR", name: "Francia", slug: "francia" },
  { isoCode: "DE", name: "Alemania", slug: "alemania" },
  { isoCode: "NL", name: "Países Bajos", slug: "paises-bajos" },
  { isoCode: "BE", name: "Bélgica", slug: "belgica" },
  { isoCode: "IT", name: "Italia", slug: "italia" },
  { isoCode: "SE", name: "Suecia", slug: "suecia" },
  { isoCode: "NO", name: "Noruega", slug: "noruega" },
];

const genres = [
  { name: "House", normalizedName: "house", slug: "house" },
  { name: "Deep House", normalizedName: "deep house", slug: "deep-house" },
  { name: "Progressive House", normalizedName: "progressive house", slug: "progressive-house" },
  { name: "Tech House", normalizedName: "tech house", slug: "tech-house" },
  { name: "Afro House", normalizedName: "afro house", slug: "afro-house" },
  { name: "Techno", normalizedName: "techno", slug: "techno" },
  { name: "Trance", normalizedName: "trance", slug: "trance" },
  { name: "Drum and Bass", normalizedName: "drum and bass", slug: "drum-and-bass" },
  { name: "Dubstep", normalizedName: "dubstep", slug: "dubstep" },
  { name: "Disco House", normalizedName: "disco house", slug: "disco-house" },
];

async function seedCountries(): Promise<void> {
  for (const country of countries) {
    await prisma.country.upsert({
      where: { isoCode: country.isoCode },
      update: {
        name: country.name,
        slug: country.slug,
      },
      create: country,
    });
  }
}

async function seedGenres(): Promise<void> {
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {
        name: genre.name,
        normalizedName: genre.normalizedName,
      },
      create: {
        ...genre,
        editorialStatus: EditorialStatus.DRAFT,
      },
    });
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    console.info("INITIAL_ADMIN_EMAIL not set; skipping initial admin creation.");
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email,
      name: process.env.INITIAL_ADMIN_NAME ?? "Administrator",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

async function main(): Promise<void> {
  await seedCountries();
  await seedGenres();
  await seedAdmin();
}

main()
  .then(async () => {
    console.info("Database seed completed.");
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("Database seed failed.", error);
    await prisma.$disconnect();
    process.exit(1);
  });
