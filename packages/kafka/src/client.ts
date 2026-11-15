import { KafkaJS } from '@confluentinc/kafka-javascript';
import { loadKafkaConfig } from './config.js';

let kafkaClient: KafkaJS.Kafka | null = null;

export function getKafkaClient(): KafkaJS.Kafka {
  if (kafkaClient) return kafkaClient;
  const config = loadKafkaConfig();
  kafkaClient = new KafkaJS.Kafka({
    kafkaJS: {
      brokers: config.KAFKA_BROKERS,
      clientId: config.KAFKA_CLIENT_ID,
    },
  });
  return kafkaClient;
}
