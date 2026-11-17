import { getKafkaClient } from './client.js';

export interface TopicSpec {
  topic: string;
  numPartitions: number;
  replicationFactor: number;
}

function buildSpecs(): TopicSpec[] {
  const replication = Number(process.env.KAFKA_REPLICATION ?? 1);
  return [
    { topic: 'workflow.runs', numPartitions: 6, replicationFactor: replication },
    { topic: 'workflow.steps', numPartitions: 6, replicationFactor: replication },
    { topic: 'workflow.results', numPartitions: 6, replicationFactor: replication },
    { topic: 'workflow.steps.dlq', numPartitions: 3, replicationFactor: replication },
  ];
}

export async function ensureTopics(): Promise<void> {
  const kafka = getKafkaClient();
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = new Set(await admin.listTopics());
    for (const spec of buildSpecs()) {
      if (existing.has(spec.topic)) {
        console.log(`[kafka] topic ${spec.topic} already exists`);
        continue;
      }
      await admin.createTopics({
        topics: [
          {
            topic: spec.topic,
            numPartitions: spec.numPartitions,
            replicationFactor: spec.replicationFactor,
          },
        ],
      });
      console.log(
        `[kafka] created topic ${spec.topic} (${spec.numPartitions}p, rf=${spec.replicationFactor})`,
      );
    }
  } finally {
    await admin.disconnect();
  }
}
