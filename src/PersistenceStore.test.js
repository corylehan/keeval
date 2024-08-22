// PersistenceStore.test.js

const fs = require('fs').promises;
const path = require('path');
const PersistenceStore = require('./PersistenceStore');

describe('PersistenceStore', () => {
  const testFilePath = path.join(__dirname, 'test_persistence.json');
  let store;

  beforeEach(async () => {
    store = new PersistenceStore(testFilePath);
    await fs.writeFile(testFilePath, ''); // Clear the file before each test
  });

  afterEach(async () => {
    await fs.unlink(testFilePath); // Delete the test file after each test
  });

  describe('appendSet', () => {
    it('should append a set command to the file', async () => {
      await store.appendSet('key1', 'value1');
      const content = await fs.readFile(testFilePath, 'utf-8');
      const expectedContent = JSON.stringify({ command: 'set', key: 'key1', value: 'value1' }) + '\n';
      expect(content).toBe(expectedContent);
    });

    it('should handle different value types', async () => {
      await store.appendSet('numKey', 42);
      await store.appendSet('boolKey', true);
      await store.appendSet('objKey', { a: 1, b: 2 });
      await store.appendSet('arrKey', [1, 2, 3]);

      const commands = await store.readCommands();
      expect(commands).toHaveLength(4);
      expect(commands[0]).toEqual({ command: 'set', key: 'numKey', value: 42 });
      expect(commands[1]).toEqual({ command: 'set', key: 'boolKey', value: true });
      expect(commands[2]).toEqual({ command: 'set', key: 'objKey', value: { a: 1, b: 2 } });
      expect(commands[3]).toEqual({ command: 'set', key: 'arrKey', value: [1, 2, 3] });
    });
  });

  describe('appendDelete', () => {
    it('should append a delete command to the file', async () => {
      await store.appendDelete('key1');
      const content = await fs.readFile(testFilePath, 'utf-8');
      const expectedContent = JSON.stringify({ command: 'delete', key: 'key1' }) + '\n';
      expect(content).toBe(expectedContent);
    });
  });

  describe('readCommands', () => {
    it('should read all commands from the file', async () => {
      await store.appendSet('key1', 'value1');
      await store.appendSet('key2', 'value2');
      await store.appendDelete('key1');

      const commands = await store.readCommands();
      expect(commands).toHaveLength(3);
      expect(commands[0]).toEqual({ command: 'set', key: 'key1', value: 'value1' });
      expect(commands[1]).toEqual({ command: 'set', key: 'key2', value: 'value2' });
      expect(commands[2]).toEqual({ command: 'delete', key: 'key1' });
    });

    it('should return an empty array for an empty file', async () => {
      const commands = await store.readCommands();
      expect(commands).toEqual([]);
    });
  });

  describe('consolidate', () => {
    it('should consolidate commands to only the latest actions', async () => {
      await store.appendSet('key1', 'value1');
      await store.appendSet('key2', 'value2');
      await store.appendDelete('key1');
      await store.appendSet('key3', 'value3');
      await store.appendSet('key2', 'new_value2');

      await store.consolidate();

      const commands = await store.readCommands();
      expect(commands).toHaveLength(2);
      expect(commands).toContainEqual({ command: 'set', key: 'key2', value: 'new_value2' });
      expect(commands).toContainEqual({ command: 'set', key: 'key3', value: 'value3' });
    });

    it('should handle an empty file', async () => {
      await store.consolidate();
      const commands = await store.readCommands();
      expect(commands).toEqual([]);
    });

    it('should handle multiple operations on the same key', async () => {
      await store.appendSet('key1', 'value1');
      await store.appendSet('key1', 'value2');
      await store.appendDelete('key1');
      await store.appendSet('key1', 'value3');

      await store.consolidate();

      const commands = await store.readCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual({ command: 'set', key: 'key1', value: 'value3' });
    });
  });

  describe('edge cases', () => {
    it('should handle very large values', async () => {
      const largeValue = 'a'.repeat(1000000); // 1MB string
      await store.appendSet('largeKey', largeValue);
      const commands = await store.readCommands();
      expect(commands[0].value).toBe(largeValue);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = '!@#$%^&*()_+{}[]|;:,.<>?';
      await store.appendSet(specialKey, 'specialValue');
      const commands = await store.readCommands();
      expect(commands[0].key).toBe(specialKey);
    });

    it('should handle concurrent writes', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(store.appendSet(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);
      const commands = await store.readCommands();
      expect(commands).toHaveLength(100);
    });
  });
});
