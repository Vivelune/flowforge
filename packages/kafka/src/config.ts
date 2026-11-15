import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the root .env explicitly. config.ts is at packages/kafka/src/, so the
// repo root is three levels up.
loadEnv({ path: path.resolve(__dirname, '../../../.env') });
console.log('[kafka config] loading env from', path.resolve(__dirname, '../../../.env'));
const configSchema = z.object({
  KAFKA_BROKERS: z
    .string()
    .min(1)
    .transform((val) => val.split(',')),
  KAFKA_CLIENT_ID: z.string().min(1),
});

export type KafkaConfig = z.infer<typeof configSchema>;

export function loadKafkaConfig(): KafkaConfig {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid Kafka configuration: ${JSON.stringify(result.error.issues, null, 2)}`);
  }
  return result.data;
}
