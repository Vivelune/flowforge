import { Kafka } from '@confluentinc/kafka-javascript/types/kafkajs.js';
import { loadKafkaConfig } from './config.js';

let kafkaClient: Kafka | null = null;

export function getKafkaClient(): Kafka {
  if (kafkaClient) return kafkaClient;
  const config = loadKafkaConfig();
  kafkaClient = new Kafka({
    kafkaJS: {
      brokers: config.KAFKA_BROKERS,
      clientId: config.KAFKA_CLIENT_ID,
    },
  });
  return kafkaClient;
}
