const MemoryStore = require('./MemoryStore');

describe('MemoryStore', () => {
  let store;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe('set', () => {
    it('should set a number value', () => {
      expect(store.set('num', 42)).toEqual({ status: 'success', message: 'Value set successfully' });
    });

    it('should set a string value', () => {
      expect(store.set('str', 'hello')).toEqual({ status: 'success', message: 'Value set successfully' });
    });

    it('should set a boolean value', () => {
      expect(store.set('bool', true)).toEqual({ status: 'success', message: 'Value set successfully' });
    });

    it('should set an object value', () => {
      expect(store.set('obj', { a: 1, b: 2 })).toEqual({ status: 'success', message: 'Value set successfully' });
    });

    it('should set an array value', () => {
      expect(store.set('arr', [1, 2, 3])).toEqual({ status: 'success', message: 'Value set successfully' });
    });

    it('should return an error for invalid key type', () => {
      expect(store.set(42, 'value')).toEqual({ status: 'error', message: 'Key must be a string' });
    });

    it('should return an error for unsupported value type', () => {
      expect(store.set('key', () => {})).toEqual({ status: 'error', message: 'Unsupported value type' });
    });
  });

  describe('get', () => {
    beforeEach(() => {
      store.set('num', 42);
      store.set('str', 'hello');
      store.set('bool', true);
      store.set('obj', { a: 1, b: 2 });
      store.set('arr', [1, 2, 3]);
    });

    it('should retrieve a number value', () => {
      expect(store.get('num')).toEqual({ status: 'success', message: 'Value retrieved', value: 42 });
    });

    it('should retrieve a string value', () => {
      expect(store.get('str')).toEqual({ status: 'success', message: 'Value retrieved', value: 'hello' });
    });

    it('should retrieve a boolean value', () => {
      expect(store.get('bool')).toEqual({ status: 'success', message: 'Value retrieved', value: true });
    });

    it('should retrieve an object value', () => {
      expect(store.get('obj')).toEqual({ status: 'success', message: 'Value retrieved', value: { a: 1, b: 2 } });
    });

    it('should retrieve an array value', () => {
      expect(store.get('arr')).toEqual({ status: 'success', message: 'Value retrieved', value: [1, 2, 3] });
    });

    it('should return an error for non-existent key', () => {
      expect(store.get('nonexistent')).toEqual({ status: 'error', message: 'Key not found' });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      store.set('key', 'value');
    });

    it('should delete an existing key-value pair', () => {
      expect(store.delete('key')).toEqual({ status: 'success', message: 'Key-value pair deleted' });
      expect(store.get('key')).toEqual({ status: 'error', message: 'Key not found' });
    });

    it('should return an error when deleting a non-existent key', () => {
      expect(store.delete('nonexistent')).toEqual({ status: 'error', message: 'Key not found' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as key', () => {
      expect(store.set('', 'empty')).toEqual({ status: 'success', message: 'Value set successfully' });
      expect(store.get('')).toEqual({ status: 'success', message: 'Value retrieved', value: 'empty' });
    });

    it('should handle null and undefined values', () => {
      expect(store.set('null', null)).toEqual({ status: 'success', message: 'Value set successfully' });
      expect(store.set('undefined', undefined)).toEqual({ status: 'success', message: 'Value set successfully' });
      expect(store.get('null')).toEqual({ status: 'success', message: 'Value retrieved', value: null });
      expect(store.get('undefined')).toEqual({ status: 'success', message: 'Value retrieved', value: undefined });
    });

    it('should handle very large objects', () => {
      const largeObj = {};
      for (let i = 0; i < 10000; i++) {
        largeObj[`key${i}`] = `value${i}`;
      }
      expect(store.set('large', largeObj)).toEqual({ status: 'success', message: 'Value set successfully' });
      expect(store.get('large')).toEqual({ status: 'success', message: 'Value retrieved', value: largeObj });
    });

    it('should handle deeply nested objects', () => {
      const nestedObj = { a: { b: { c: { d: { e: 'deep' } } } } };
      expect(store.set('nested', nestedObj)).toEqual({ status: 'success', message: 'Value set successfully' });
      expect(store.get('nested')).toEqual({ status: 'success', message: 'Value retrieved', value: nestedObj });
    });
  });
});
