// KeeVal.test.js

const fs = require('fs').promises;
const path = require('path');
const KeeVal = require('./KeeVal');

describe('KeeVal', () => {
  const testFilePath = path.join(__dirname, 'test_keeval.json');
  let keeVal;

  beforeEach(async () => {
    await fs.writeFile(testFilePath, ''); // Clear the file before each test
    keeVal = new KeeVal(testFilePath);
  });

  afterEach(async () => {
    await fs.unlink(testFilePath); // Delete the test file after each test
  });

  describe('set', () => {
    it('should set a value in memory and persistence', async () => {
      const result = await keeVal.set('key1', 'value1');
      expect(result).toEqual({ status: 'success', message: 'Value set successfully' });

      const memoryResult = keeVal.get('key1');
      expect(memoryResult).toEqual({ status: 'success', message: 'Value retrieved', value: 'value1' });

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const expectedContent = JSON.stringify({ command: 'set', key: 'key1', value: 'value1' }) + '\n';
      expect(fileContent).toBe(expectedContent);
    });

    it('should handle different value types', async () => {
      await keeVal.set('numKey', 42);
      await keeVal.set('boolKey', true);
      await keeVal.set('objKey', { a: 1, b: 2 });
      await keeVal.set('arrKey', [1, 2, 3]);

      expect(keeVal.get('numKey').value).toBe(42);
      expect(keeVal.get('boolKey').value).toBe(true);
      expect(keeVal.get('objKey').value).toEqual({ a: 1, b: 2 });
      expect(keeVal.get('arrKey').value).toEqual([1, 2, 3]);

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toHaveLength(4);
      expect(JSON.parse(lines[0])).toEqual({ command: 'set', key: 'numKey', value: 42 });
      expect(JSON.parse(lines[1])).toEqual({ command: 'set', key: 'boolKey', value: true });
      expect(JSON.parse(lines[2])).toEqual({ command: 'set', key: 'objKey', value: { a: 1, b: 2 } });
      expect(JSON.parse(lines[3])).toEqual({ command: 'set', key: 'arrKey', value: [1, 2, 3] });
    });
  });

  describe('get', () => {
    it('should retrieve a value from memory', async () => {
      await keeVal.set('key1', 'value1');
      const result = keeVal.get('key1');
      expect(result).toEqual({ status: 'success', message: 'Value retrieved', value: 'value1' });
    });

    it('should return an error for non-existent key', () => {
      const result = keeVal.get('nonexistent');
      expect(result).toEqual({ status: 'error', message: 'Key not found' });
    });
  });

  describe('delete', () => {
    it('should delete a value from memory and add delete command to persistence', async () => {
      await keeVal.set('key1', 'value1');
      const result = await keeVal.delete('key1');
      expect(result).toEqual({ status: 'success', message: 'Key-value pair deleted' });

      const memoryResult = keeVal.get('key1');
      expect(memoryResult).toEqual({ status: 'error', message: 'Key not found' });

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ command: 'set', key: 'key1', value: 'value1' });
      expect(JSON.parse(lines[1])).toEqual({ command: 'delete', key: 'key1' });
    });

    it('should return an error when deleting a non-existent key', async () => {
      const result = await keeVal.delete('nonexistent');
      expect(result).toEqual({ status: 'error', message: 'Key not found' });
    });
  });

  describe('loadFromFile', () => {
    it('should load data from file when initialized', async () => {
      await fs.writeFile(testFilePath, 
        JSON.stringify({ command: 'set', key: 'key1', value: 'value1' }) + '\n' +
        JSON.stringify({ command: 'set', key: 'key2', value: 'value2' }) + '\n' +
        JSON.stringify({ command: 'delete', key: 'key1' }) + '\n'
      );

      const loadedKeeVal = new KeeVal(testFilePath, true);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async loading to complete

      expect(loadedKeeVal.get('key1')).toEqual({ status: 'error', message: 'Key not found' });
      expect(loadedKeeVal.get('key2')).toEqual({ status: 'success', message: 'Value retrieved', value: 'value2' });
    });
  });

  describe('consolidate', () => {
    it('should consolidate the persistence file', async () => {
      await keeVal.set('key1', 'value1');
      await keeVal.set('key2', 'value2');
      await keeVal.delete('key1');
      await keeVal.set('key3', 'value3');

      await keeVal.consolidate();

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ command: 'set', key: 'key2', value: 'value2' });
      expect(JSON.parse(lines[1])).toEqual({ command: 'set', key: 'key3', value: 'value3' });
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent operations', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(keeVal.set(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);

      for (let i = 0; i < 100; i++) {
        expect(keeVal.get(`key${i}`)).toEqual({ status: 'success', message: 'Value retrieved', value: `value${i}` });
      }

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toHaveLength(100);
    });

    it('should handle large values', async () => {
      const largeValue = 'a'.repeat(1000000); // 1MB string
      await keeVal.set('largeKey', largeValue);

      expect(keeVal.get('largeKey').value).toBe(largeValue);

      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      const command = JSON.parse(fileContent);
      expect(command).toEqual({ command: 'set', key: 'largeKey', value: largeValue });
    });
  });
});
