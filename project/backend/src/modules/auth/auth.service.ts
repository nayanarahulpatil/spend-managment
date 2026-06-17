import { Injectable, UnauthorizedException, UnprocessableEntityException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../database/redis.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password, mfa_token } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check brute-force lockout
    if (user.lockedAt) {
      const lockDurationMs = 15 * 60 * 1000; // 15 mins
      const isLockExpired = Date.now() - new Date(user.lockedAt).getTime() > lockDurationMs;
      if (!isLockExpired) {
        throw new HttpException('Account locked. Contact admin', 423);
      } else {
        // Auto unlock after lock duration
        await this.usersService.update(user._id.toString(), { lockedAt: null, failedLoginAttempts: 0 });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updates.lockedAt = new Date();
      }
      await this.usersService.update(user._id.toString(), updates);

      if (attempts >= 5) {
        throw new HttpException('Account locked. Contact admin', 423);
      }
      throw new UnauthorizedException('Invalid email or password');
    }
    // Reset failed login attempts on success
    await this.usersService.update(user._id.toString(), { failedLoginAttempts: 0, lockedAt: null });

    const payload = { sub: user._id, email: user.email, role: user.role };
    
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwtSecret'),
      expiresIn: '15m',
    });
    
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwtRefreshSecret'),
      expiresIn: '7d',
    });

    // Save refresh token session to Redis
    const tokenHash = this.hashToken(refresh_token);
    await this.redisService.set(`refresh:${user._id}:${tokenHash}`, user._id.toString(), 7 * 24 * 60 * 60);

    return {
      access_token,
      refresh_token,
      role: user.role,
    };
  }

  async refresh(refreshToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwtRefreshSecret'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token is invalid or user is inactive');
      }

      const tokenHash = this.hashToken(refreshToken);

      // Verify not blacklisted
      const isBlacklisted = await this.redisService.get(`blacklist:${tokenHash}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revoked');
      }

      // Verify session exists in Redis
      const sessionExists = await this.redisService.get(`refresh:${user._id}:${tokenHash}`);
      if (!sessionExists) {
        throw new UnauthorizedException('Invalid token');
      }

      // Invalidate old refresh token (rotation)
      await this.redisService.del(`refresh:${user._id}:${tokenHash}`);
      await this.redisService.set(`blacklist:${tokenHash}`, '1', 7 * 24 * 60 * 60);

      // Generate new tokens
      const newPayload = { sub: user._id, email: user.email, role: user.role };
      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('jwtSecret'),
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('jwtRefreshSecret'),
        expiresIn: '7d',
      });

      // Save new refresh token session to Redis
      const newHash = this.hashToken(newRefreshToken);
      await this.redisService.set(`refresh:${user._id}:${newHash}`, user._id.toString(), 7 * 24 * 60 * 60);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwtRefreshSecret'),
      });
      const tokenHash = this.hashToken(refreshToken);

      // Delete from active sessions and add to blacklist
      await this.redisService.del(`refresh:${payload.sub}:${tokenHash}`);
      await this.redisService.set(`blacklist:${tokenHash}`, '1', 7 * 24 * 60 * 60);
    } catch {
      // Fail silently for invalid token logout
    }
  }

  async forceLogout(userId: string): Promise<void> {
    await this.redisService.delPattern(`refresh:${userId}:*`);
  }
}
