import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createFindProfileIdByNormalizedAuthEmail } from "@/core/identity/profile/services/find-profile-id-by-normalized-auth-email";
import { assertOrganizationsTestDatabase } from "@/core/modules/organizations/tests/assert-test-database";
import { Prisma } from "@/generated/prisma/client";

const TEST_PREFIX = "identity-email-projection-test-";

function testUsername(id: string): string {
  return `${TEST_PREFIX}${id.slice(0, 16)}`;
}

async function cleanupProfileProjectionRecords(): Promise<void> {
  assertOrganizationsTestDatabase();

  const { prisma } = await import("@/lib/prisma");
  await prisma.profile.deleteMany({
    where: {
      username: {
        startsWith: TEST_PREFIX,
      },
    },
  });
}

describe("Profile Auth email projection", () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase();
    await cleanupProfileProjectionRecords();
  });

  afterEach(cleanupProfileProjectionRecords);
  afterAll(cleanupProfileProjectionRecords);

  it("resolves a Profile by its canonical normalized Auth email", async () => {
    const { prisma } = await import("@/lib/prisma");
    const id = randomUUID();

    await prisma.profile.create({
      data: {
        id,
        username: testUsername(id),
        authEmailNormalized: "person@example.com",
      },
    });

    const findProfileId = createFindProfileIdByNormalizedAuthEmail(prisma);

    await expect(findProfileId("person@example.com")).resolves.toBe(id);
    await expect(findProfileId("Person@Example.com")).resolves.toBeNull();
    await expect(findProfileId("missing@example.com")).resolves.toBeNull();
  });

  it("supports transaction-scoped lookup clients", async () => {
    const { prisma } = await import("@/lib/prisma");
    const id = randomUUID();

    await prisma.profile.create({
      data: {
        id,
        username: testUsername(id),
        authEmailNormalized: "transaction@example.com",
      },
    });

    const resolved = await prisma.$transaction((client) => {
      const findProfileId = createFindProfileIdByNormalizedAuthEmail(client);
      return findProfileId("transaction@example.com");
    });

    expect(resolved).toBe(id);
  });

  it("enforces unique normalized Auth email projections", async () => {
    const { prisma } = await import("@/lib/prisma");
    const firstId = randomUUID();
    const secondId = randomUUID();

    await prisma.profile.create({
      data: {
        id: firstId,
        username: testUsername(firstId),
        authEmailNormalized: "unique@example.com",
      },
    });

    try {
      await prisma.profile.create({
        data: {
          id: secondId,
          username: testUsername(secondId),
          authEmailNormalized: "unique@example.com",
        },
      });
      expect.unreachable("Expected duplicate Auth email projection to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((error as Prisma.PrismaClientKnownRequestError).code).toBe(
        "P2002",
      );
    }
  });
});
