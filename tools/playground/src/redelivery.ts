import { createProducer, createConsumer } from '@flowforge/kafka';

const TOPIC = 'playground-redelivery';
const GROUP = 'redelivery-group';
const CRASH_ON_ID = 3;

async function produce() {
  const producer = await createProducer();
  for (let i = 1; i <= 5; i++) {
    await producer.send({
      topic: TOPIC,
      key: `msg-${i}`,
      value: { id: i },
    });
    console.log(`Produced message ${i}`);
  }
  await producer.disconnect();
}

async function consume() {
  const seen = new Set<number>();

  await createConsumer<{ id: number }>({
    groupId: GROUP,
    topics: [TOPIC],
    handler: async ({ value }) => {
      console.log(`Processing message ${value.id}...`);
      seen.add(value.id);

      // Deterministic crash: process message 3, then die before commitOffsets runs
      if (value.id === CRASH_ON_ID) {
        console.error(`💥 Simulating crash before commit on message ${CRASH_ON_ID}!`);
        process.exit(1);
      }

      // Only exit once all 5 messages have been observed
      if (seen.size === 5) {
        console.log('✅ All 5 messages processed.');
        process.exit(0);
      }
    },
  });

  setTimeout(() => {
    console.error(`Timeout. Seen so far: [${[...seen].sort().join(', ')}]`);
    process.exit(1);
  }, 20000);
}

async function main() {
  console.log('--- Redelivery Experiment ---');
  const cmd = process.argv[2];
  if (cmd === 'produce') {
    await produce();
  } else if (cmd === 'consume') {
    await consume();
  } else {
    console.log('Usage: tsx src/redelivery.ts [produce|consume]');
  }
}

main().catch(console.error);
