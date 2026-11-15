import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadKafkaConfig } from './config.js';

describe('loadKafkaConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('parses comma-separated brokers', () => {
    process.env.KAFKA_BROKERS = 'localhost:19092,localhost:19093';
    process.env.KAFKA_CLIENT_ID = 'test-client';
    const config = loadKafkaConfig();
    expect(config.KAFKA_BROKERS).toEqual(['localhost:19092', 'localhost:19093']);
    expect(config.KAFKA_CLIENT_ID).toBe('test-client');
  });

  it('throws on missing env vars', () => {
    delete process.env.KAFKA_BROKERS;
    delete process.env.KAFKA_CLIENT_ID;
    expect(() => loadKafkaConfig()).toThrow(/Invalid Kafka configuration/);
  });
});
