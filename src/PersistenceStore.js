// PersistenceStore.js

const fs = require('fs').promises;
const path = require('path');

class PersistenceStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async appendSet(key, value) {
    const command = JSON.stringify({ command: 'set', key, value }) + '\n';
    await this.appendToFile(command);
  }

  async appendDelete(key) {
    const command = JSON.stringify({ command: 'delete', key }) + '\n';
    await this.appendToFile(command);
  }

  async appendToFile(command) {
    // Use a queue to ensure writes are performed sequentially
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.appendFile(this.filePath, command, 'utf8');
    });
    await this.writeQueue;
  }

  async readCommands() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      return content
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async consolidate() {
    const commands = await this.readCommands();
    const latestCommands = new Map();

    for (const command of commands) {
      if (command.command === 'set') {
        latestCommands.set(command.key, command);
      } else if (command.command === 'delete') {
        latestCommands.delete(command.key);
      }
    }

    const consolidatedCommands = Array.from(latestCommands.values());
    await fs.writeFile(this.filePath, consolidatedCommands.map(cmd => JSON.stringify(cmd)).join('\n') + '\n');
  }
}

module.exports = PersistenceStore;
