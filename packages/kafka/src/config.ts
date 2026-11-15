import { z } from 'zod';

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
    throw new Error(`Invalid Kafka configuration: ${result.error.message}`);
  }
  return result.data;
}
