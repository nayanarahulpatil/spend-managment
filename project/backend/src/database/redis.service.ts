import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private memoryFallback: Map<string, { value: string; expiry: number }> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;

    try {
      this.client = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        // Suppress logs and failover to memory fallback silently
        this.client = null;
      });

      this.client.connect().catch(() => {
        this.client = null;
      });
    } catch (e) {
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        this.client = null;
      }
    }
    // Fallback
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.memoryFallback.set(key, { value, expiry });
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch {
        this.client = null;
      }
    }
    // Fallback
    const record = this.memoryFallback.get(key);
    if (!record) return null;
    if (Date.now() > record.expiry) {
      this.memoryFallback.delete(key);
      return null;
    }
    return record.value;
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
        return;
      } catch {
        this.client = null;
      }
    }
    this.memoryFallback.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.client) {
      try {
        return await this.client.keys(pattern);
      } catch {
        this.client = null;
      }
    }
    // Fallback pattern match
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matchedKeys: string[] = [];
    for (const key of this.memoryFallback.keys()) {
      if (regex.test(key)) {
        matchedKeys.push(key);
      }
    }
    return matchedKeys;
  }

  async delPattern(pattern: string): Promise<void> {
    const matchedKeys = await this.keys(pattern);
    for (const key of matchedKeys) {
      await this.del(key);
    }
  }
}
