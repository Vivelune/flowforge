import { getKafkaClient } from './client.js';

export interface ProducerMessage {
  topic: string;
  key: string;
  value: unknown;
  headers?: Record<string, string>;
}

export async function createProducer() {
  const kafka = getKafkaClient();
  const producer = kafka.producer({
    kafkaJS: {
      idempotent: true,
      acks: -1, // all in-sync replicas
    },
  });

  await producer.connect();

  return {
    async send(message: ProducerMessage) {
      await producer.send({
        topic: message.topic,
        messages: [
          {
            key: message.key,
            value: JSON.stringify(message.value),
            headers: message.headers,
          },
        ],
      });
    },
    async disconnect() {
      await producer.disconnect();
    },
  };
}
