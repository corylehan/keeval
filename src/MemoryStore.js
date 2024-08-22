/**
 * In-memory key-value store
 */
class MemoryStore {
  /**
   * Initializes the store
   */
  constructor() {
    this.store = {};
  }

  /**
   * Retrieves a value from the store
   * @param {string} key - The key to retrieve
   * @returns {Object} An object containing status, message, and value (if found)
   */
  get(key) {
    if (typeof key !== 'string') {
      return { status: 'error', message: 'Key must be a string' };
    }
    
    if (key in this.store) {
      return { status: 'success', message: 'Value retrieved', value: this.store[key] };
    } else {
      return { status: 'error', message: 'Key not found' };
    }
  }

  /**
   * Sets a value in the store
   * @param {string} key - The key to set
   * @param {*} value - The value to store (can be number, string, boolean, object, or array)
   * @returns {Object} An object containing status and message
   */
  set(key, value) {
    if (typeof key !== 'string') {
      return { status: 'error', message: 'Key must be a string' };
    }

    const validTypes = ['number', 'string', 'boolean', 'object'];
    if (!validTypes.includes(typeof value) && !Array.isArray(value)) {
      return { status: 'error', message: 'Unsupported value type' };
    }

    this.store[key] = value;
    return { status: 'success', message: 'Value set successfully' };
  }

  /**
   * Deletes a key-value pair from the store
   * @param {string} key - The key to delete
   * @returns {Object} An object containing status and message
   */
  delete(key) {
    if (typeof key !== 'string') {
      return { status: 'error', message: 'Key must be a string' };
    }

    if (key in this.store) {
      delete this.store[key];
      return { status: 'success', message: 'Key-value pair deleted' };
    } else {
      return { status: 'error', message: 'Key not found' };
    }
  }
}

module.exports = MemoryStore;
