import { getKafkaClient } from './client.js';

export interface ConsumerOptions<T> {
  groupId: string;
  topics: string[];
  handler: (payload: { topic: string; partition: number; key: string; value: T }) => Promise<void>;
}

export async function createConsumer<T = unknown>(options: ConsumerOptions<T>) {
  const kafka = getKafkaClient();

  const consumer = kafka.consumer({
    kafkaJS: {
      groupId: options.groupId,
      autoCommit: false,
      fromBeginning: true,
    },
  });

  await consumer.connect();

  await consumer.subscribe({
    topics: options.topics,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.key) {
        console.warn(`Skipping message on ${topic}:${partition} with no key`);
        return;
      }

      const parsedValue = JSON.parse(message.value?.toString() ?? '{}') as T;

      try {
        await options.handler({
          topic,
          partition,
          key: message.key.toString(),
          value: parsedValue,
        });

        // Commit only after the handler succeeds.
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ]);
      } catch (err) {
        console.error(`Error processing message on ${topic}:${partition}:`, err);

        // Do not commit. The message can be redelivered.
        throw err;
      }
    },
  });

  return consumer;
}
