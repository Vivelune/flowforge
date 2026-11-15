import { createConsumer } from '@flowforge/kafka';

const TOPIC = 'playground-scaling';
const GROUP = 'scaling-group';

// Keep references to consumers so we can poll their assignments
const consumers: Array<{ id: number; consumer: any }> = [];

async function startConsumer(id: number) {
  const consumer = await createConsumer({
    groupId: GROUP,
    topics: [TOPIC],
    handler: async () => {
      // no-op, we just want assignments
    },
  });

  consumers.push({ id, consumer });
}

function logAssignments() {
  for (const { id, consumer } of consumers) {
    const raw = consumer.assignment();
    console.log(`Consumer ${id} raw assignment:`, JSON.stringify(raw));
  }
}

async function main() {
  console.log('--- Group Scaling Experiment ---');
  console.log('Starting 1 consumer...');
  await startConsumer(1);
  await new Promise((r) => setTimeout(r, 3000));
  logAssignments();

  console.log('\nStarting 2nd consumer...');
  await startConsumer(2);
  await new Promise((r) => setTimeout(r, 3000));
  logAssignments();

  console.log('\nStarting 3rd consumer...');
  await startConsumer(3);
  await new Promise((r) => setTimeout(r, 3000));
  logAssignments();

  console.log('\nStarting 4th consumer (expect one idle on a 3-partition topic)...');
  await startConsumer(4);
  await new Promise((r) => setTimeout(r, 3000));
  logAssignments();

  console.log('\nDone.');
  setTimeout(() => process.exit(0), 1000);
}

main().catch(console.error);
