import { createProducer, createConsumer } from '@flowforge/kafka';

const TOPIC = 'playground-ordering';
const RUNS = 5;
const EVENTS_PER_RUN = 20;

async function main() {
  console.log('--- Ordering Experiment ---');
  const producer = await createProducer();

  // 1. Produce messages
  console.log(`Producing ${RUNS} runs x ${EVENTS_PER_RUN} events...`);
  for (let r = 1; r <= RUNS; r++) {
    const runId = `run-${r}`;
    for (let seq = 1; seq <= EVENTS_PER_RUN; seq++) {
      await producer.send({
        topic: TOPIC,
        key: runId,
        value: { runId, seq },
      });
    }
  }
  await producer.disconnect();

  // 2. Consume and verify
  console.log('Consuming and verifying order...');
  const lastSeen = new Map<string, number>();
  let violations = 0;
  let received = 0;

  const consumer = await createConsumer<{ runId: string; seq: number }>({
    groupId: 'ordering-group',
    topics: [TOPIC],
    handler: async ({ key, value }) => {
      received++;
      const last = lastSeen.get(key) ?? 0;
      if (value.seq <= last) {
        console.error(`❌ Violation for ${key}: got seq ${value.seq} after ${last}`);
        violations++;
      }
      lastSeen.set(key, value.seq);

      if (received === RUNS * EVENTS_PER_RUN) {
        console.log(`Total received: ${received}`);
        console.log(`Violations: ${violations}`);
        if (violations === 0) {
          console.log('✅ Ordering preserved per key.');
        } else {
          console.error('❌ Ordering violations detected.');
        }
        process.exit(violations === 0 ? 0 : 1);
      }
    },
  });

  // Safety timeout
  setTimeout(() => {
    console.error('Timeout: did not receive all messages.');
    process.exit(1);
  }, 10000);
}

main().catch(console.error);
