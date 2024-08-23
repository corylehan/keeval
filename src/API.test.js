const supertest = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const app = require('./API');

const dataFilePath = path.join(__dirname, 'data.json');

describe('KeeVal API', () => {
  let request;

  beforeAll(async () => {
    await app.ready();
    request = supertest(app.server);
  });

  beforeEach(async () => {
    await fs.writeFile(dataFilePath, ''); // Clear the file before each test
  });

  afterAll(async () => {
    await app.close();
    await fs.unlink(dataFilePath);
  });

  describe('POST /:key', () => {
    it('should set a value', async () => {
      const response = await request
        .post('/testKey')
        .send({ value: 'testValue' })
        .expect(201);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Value set successfully'
      });
    });

    it('should handle different value types', async () => {
      await request.post('/numKey').send({ value: 42 }).expect(201);
      await request.post('/boolKey').send({ value: true }).expect(201);
      await request.post('/objKey').send({ value: { a: 1, b: 2 } }).expect(201);
      await request.post('/arrKey').send({ value: [1, 2, 3] }).expect(201);

      const numResponse = await request.get('/numKey').expect(200);
      const boolResponse = await request.get('/boolKey').expect(200);
      const objResponse = await request.get('/objKey').expect(200);
      const arrResponse = await request.get('/arrKey').expect(200);

      expect(numResponse.body.value).toBe(42);
      expect(boolResponse.body.value).toBe(true);
      expect(objResponse.body.value).toEqual({ a: 1, b: 2 });
      expect(arrResponse.body.value).toEqual([1, 2, 3]);
    });
  });

  describe('GET /:key', () => {
    it('should retrieve a value', async () => {
      await request.post('/testKey').send({ value: 'testValue' }).expect(201);

      const response = await request.get('/testKey').expect(200);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Value retrieved',
        value: 'testValue'
      });
    });

    it('should return 404 for non-existent key', async () => {
      const response = await request.get('/nonexistent').expect(404);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Key not found'
      });
    });
  });

  describe('DELETE /:key', () => {
    it('should delete a value', async () => {
      await request.post('/testKey').send({ value: 'testValue' }).expect(201);

      const deleteResponse = await request.delete('/testKey').expect(200);
      expect(deleteResponse.body).toEqual({
        status: 'success',
        message: 'Key-value pair deleted'
      });

      await request.get('/testKey').expect(404);
    });

    it('should return 404 when deleting non-existent key', async () => {
      const response = await request.delete('/nonexistent').expect(404);

      expect(response.body).toEqual({
        status: 'error',
        message: 'Key not found'
      });
    });
  });

  describe('POST /consolidate', () => {
    it('should consolidate the data', async () => {
      await request.post('/key1').send({ value: 'value1' }).expect(201);
      await request.post('/key2').send({ value: 'value2' }).expect(201);
      await request.delete('/key1').expect(200);

      const response = await request.post('/consolidate').expect(200);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Consolidation complete'
      });

      const fileContent = await fs.readFile(dataFilePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0])).toEqual({ command: 'set', key: 'key2', value: 'value2' });
    });
  });

  describe('Edge cases', () => {
    it('should handle large values', async () => {
      const largeValue = 'a'.repeat(1000000); // 1MB string
      await request.post('/largeKey').send({ value: largeValue }).expect(201);

      const response = await request.get('/largeKey').expect(200);
      expect(response.body.value).toBe(largeValue);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = encodeURIComponent('!@#$%^&*()_+{}[]|;:,.<>?');
      await request.post(`/${specialKey}`).send({ value: 'specialValue' }).expect(201);

      const response = await request.get(`/${specialKey}`).expect(200);
      expect(response.body.value).toBe('specialValue');
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(request.post(`/concurrent${i}`).send({ value: `value${i}` }));
      }
      await Promise.all(promises);

      for (let i = 0; i < 100; i++) {
        const response = await request.get(`/concurrent${i}`).expect(200);
        expect(response.body.value).toBe(`value${i}`);
      }
    });
  });
});
