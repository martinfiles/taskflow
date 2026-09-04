import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => fallback ?? key),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('hashPassword / verifyPassword', () => {
    it('hashes a password and verifies it correctly', async () => {
      const hash = await service.hashPassword('Password123!');
      expect(hash).not.toEqual('Password123!');
      await expect(service.verifyPassword('Password123!', hash)).resolves.toBe(
        true,
      );
      await expect(service.verifyPassword('wrong', hash)).resolves.toBe(false);
    });
  });

  describe('register', () => {
    it('throws ConflictException if the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

      await expect(
        service.register({
          email: 'a@b.com',
          password: 'Password123!',
          name: 'A',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a user with a bcrypt-hashed password and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'u1', avatarUrl: null, ...data }),
      );

      const result = await service.register({
        email: 'new@b.com',
        password: 'Password123!',
        name: 'New',
      });

      expect(prisma.user.create).toHaveBeenCalled();
      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(
        await bcrypt.compare('Password123!', createdData.passwordHash),
      ).toBe(true);
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.user.email).toBe('new@b.com');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for a non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'missing@b.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException for an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatarUrl: null,
        passwordHash,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns tokens for correct credentials', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatarUrl: null,
        passwordHash,
      });

      const result = await service.login({
        email: 'a@b.com',
        password: 'correct-password',
      });
      expect(result.accessToken).toBe('signed-token');
    });
  });
});
