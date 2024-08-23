// KeeVal.js

const MemoryStore = require('./MemoryStore');
const PersistenceStore = require('./PersistenceStore');

class KeeVal {
  constructor(filePath, loadFromFile = false) {
    this.memoryStore = new MemoryStore();
    this.persistenceStore = new PersistenceStore(filePath);
    if (loadFromFile) {
      this.loadFromFile();
    }
  }

  async loadFromFile() {
    const commands = await this.persistenceStore.readCommands();
    for (const command of commands) {
      if (command.command === 'set') {
        this.memoryStore.set(command.key, command.value);
      } else if (command.command === 'delete') {
        this.memoryStore.delete(command.key);
      }
    }
  }

  async set(key, value) {
    const result = this.memoryStore.set(key, value);
    if (result.status === 'success') {
      await this.persistenceStore.appendSet(key, value);
    }
    return result;
  }

  get(key) {
    return this.memoryStore.get(key);
  }

  async delete(key) {
    const result = this.memoryStore.delete(key);
    if (result.status === 'success') {
      await this.persistenceStore.appendDelete(key);
    }
    return result;
  }

  async consolidate() {
    await this.persistenceStore.consolidate();
  }
}

module.exports = KeeVal;
