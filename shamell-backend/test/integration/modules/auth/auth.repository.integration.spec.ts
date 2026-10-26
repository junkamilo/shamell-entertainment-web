/**
 * Integration: AuthRepository against the local test PostgreSQL
 * (docker-compose.test.yml, container shamell-postgres-test).
 * Run: npm run test:db:up && npm run test:integration:local
 */
import { LocalTestDatabase } from '@test-support/database/local-test-database';
import { AuthRepository } from '@app/modules/auth/services/auth.repository';
import * as cryptoUtil from '@app/modules/auth/utils/auth-crypto.util';

const run = process.env.AUTH_INTEGRATION === '1';

(run ? describe : describe.skip)(
  'AuthRepository — integration with local PostgreSQL',
  () => {
    const dbHarness = new LocalTestDatabase();
    let repository: AuthRepository;
    let superAdminId: string;

    beforeAll(async () => {
      await dbHarness.start();
      await dbHarness.truncate('admin_invites', 'users');
      repository = new AuthRepository(dbHarness.prisma as never);

      // admin_invites.invitedById is a real FK to users.
      const superAdmin = await repository.createSuperAdmin({
        fullName: 'Super Admin',
        email: 'super@shamell.com',
        password: await cryptoUtil.hashPassword('Password123!'),
      });
      superAdminId = superAdmin.id;
    }, 30_000);

    afterAll(async () => {
      await dbHarness.stop();
    });

    it('rejects a duplicate user email through the real unique constraint (P2002)', async () => {
      await expect(
        repository.createSuperAdmin({
          fullName: 'Duplicate',
          email: 'super@shamell.com',
          password: await cryptoUtil.hashPassword('Password123!'),
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });

    it('rejects an invite whose inviter does not exist (FK constraint)', async () => {
      await expect(
        repository.createAdminInvite({
          email: 'fk@shamell.com',
          fullName: 'Admin FK',
          codeHash: cryptoUtil.sha256Hex('123456'),
          invitedById: 'non-existent-user',
          expiresAt: new Date(Date.now() + 60_000),
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('a consumed invite cannot be reused and the failed transaction rolls back', async () => {
      const invite = await repository.createAdminInvite({
        email: 'consumo@shamell.com',
        fullName: 'Admin Consumo',
        codeHash: cryptoUtil.sha256Hex('987654'),
        invitedById: superAdminId,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await repository.consumeInviteAndCreateAdmin({
        inviteId: invite.id,
        email: 'consumo@shamell.com',
        fullName: 'Admin Consumo',
        passwordHash: await cryptoUtil.hashPassword('Password123!'),
      });

      await expect(
        repository.consumeInviteAndCreateAdmin({
          inviteId: invite.id,
          email: 'reuso@shamell.com',
          fullName: 'Admin Reuso',
          passwordHash: await cryptoUtil.hashPassword('OtraPassword!'),
        }),
      ).rejects.toThrow('INVITE_ALREADY_USED');

      // The user created inside the aborted transaction must not persist.
      await expect(
        repository.findUserIdByEmail('reuso@shamell.com'),
      ).resolves.toBeNull();
      await expect(
        repository.findUserByEmail('consumo@shamell.com'),
      ).resolves.toMatchObject({ role: 'ADMIN' });
    });

    it('findValidInviteByEmail ignores expired invites', async () => {
      await repository.createAdminInvite({
        email: 'expirada@shamell.com',
        fullName: 'Admin Expirado',
        codeHash: cryptoUtil.sha256Hex('111111'),
        invitedById: superAdminId,
        expiresAt: new Date(Date.now() - 1_000),
      });

      await expect(
        repository.findValidInviteByEmail('expirada@shamell.com'),
      ).resolves.toBeNull();
    });

    it('findValidInviteByEmail returns the latest pending invite', async () => {
      await repository.createAdminInvite({
        email: 'vigente@shamell.com',
        fullName: 'Admin Vigente',
        codeHash: cryptoUtil.sha256Hex('222222'),
        invitedById: superAdminId,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        repository.findValidInviteByEmail('vigente@shamell.com'),
      ).resolves.toMatchObject({
        email: 'vigente@shamell.com',
        codeHash: cryptoUtil.sha256Hex('222222'),
        consumedAt: null,
      });
    });

    it('two concurrent consumptions of the same invite activate exactly one account (row lock)', async () => {
      const invite = await repository.createAdminInvite({
        email: 'race@shamell.com',
        fullName: 'Admin Race',
        codeHash: cryptoUtil.sha256Hex('333333'),
        invitedById: superAdminId,
        expiresAt: new Date(Date.now() + 60_000),
      });
      const passwordHash = await cryptoUtil.hashPassword('Password123!');

      // Different emails so the users.email constraint cannot decide the race:
      // only the consumedAt check inside the transaction can.
      const results = await Promise.allSettled([
        repository.consumeInviteAndCreateAdmin({
          inviteId: invite.id,
          email: 'race-a@shamell.com',
          fullName: 'Admin Race',
          passwordHash,
        }),
        repository.consumeInviteAndCreateAdmin({
          inviteId: invite.id,
          email: 'race-b@shamell.com',
          fullName: 'Admin Race',
          passwordHash,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0].reason as Error).message).toBe('INVITE_ALREADY_USED');

      const created = await dbHarness.prisma.user.count({
        where: { email: { in: ['race-a@shamell.com', 'race-b@shamell.com'] } },
      });
      expect(created).toBe(1);
    });

    it('the password column never stores plain text (bcrypt hash)', async () => {
      const plain = 'PlainText123!';
      const invite = await repository.createAdminInvite({
        email: 'hash@shamell.com',
        fullName: 'Admin Hash',
        codeHash: cryptoUtil.sha256Hex('444444'),
        invitedById: superAdminId,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await repository.consumeInviteAndCreateAdmin({
        inviteId: invite.id,
        email: 'hash@shamell.com',
        fullName: 'Admin Hash',
        passwordHash: await cryptoUtil.hashPassword(plain),
      });

      const row = await dbHarness.prisma.user.findUniqueOrThrow({
        where: { email: 'hash@shamell.com' },
        select: { password: true },
      });
      expect(row.password).not.toBe(plain);
      expect(row.password).not.toContain(plain);
      expect(row.password).toMatch(/^\$2[aby]\$10\$/);
      await expect(
        cryptoUtil.comparePassword(plain, row.password!),
      ).resolves.toBe(true);
    });
  },
);
