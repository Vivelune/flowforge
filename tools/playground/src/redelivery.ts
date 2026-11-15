import { createProducer, createConsumer } from '@flowforge/kafka';

const TOPIC = 'playground-redelivery';
const GROUP = 'redelivery-group';

async function produce() {
  const producer = await createProducer();
  for (let i = 1; i <= 5; i++) {
    await producer.send({
      topic: TOPIC,
      key: `msg-${i}`,
      value: { id: i },
    });
  }
  await producer.disconnect();
}

async function consume() {
  let processed = 0;
  const consumer = await createConsumer<{ id: number }>({
    groupId: GROUP,
    topics: [TOPIC],
    handler: async ({ value }) => {
      console.log(`Processing message ${value.id}...`);
      processed++;

      if (processed === 2) {
        console.error('💥 Simulating crash before commit!');
        process.exit(1); // Exits before commitOffsets runs
      }

      if (processed === 5) {
        console.log('✅ All 5 messages processed. Check for redelivery on restart.');
        process.exit(0);
      }
    },
  });
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
