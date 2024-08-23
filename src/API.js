// API.js

const fastify = require('fastify')({ logger: true });
const KeeVal = require('./KeeVal');
const path = require('path');

const dataFilePath = path.join(__dirname, 'data.json');
const keeVal = new KeeVal(dataFilePath, true);

fastify.get('/:key', async (request, reply) => {
  const { key } = request.params;
  const result = keeVal.get(key);
  if (result.status === 'error') {
    reply.code(404).send(result);
  } else {
    reply.send(result);
  }
});

fastify.post('/:key', async (request, reply) => {
  const { key } = request.params;
  const { value } = request.body;
  const result = await keeVal.set(key, value);
  reply.code(201).send(result);
});

fastify.delete('/:key', async (request, reply) => {
  const { key } = request.params;
  const result = await keeVal.delete(key);
  if (result.status === 'error') {
    reply.code(404).send(result);
  } else {
    reply.send(result);
  }
});

fastify.post('/consolidate', async (request, reply) => {
  await keeVal.consolidate();
  reply.code(200).send({ status: 'success', message: 'Consolidation complete' });
});

module.exports = fastify;
