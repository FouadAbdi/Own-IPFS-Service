#!/usr/bin/env node

const { program } = require('commander');
const IPFSService = require('./src/service');
const Storage = require('./src/storage');
const IPFSHash = require('./src/hash');
const fs = require('fs-extra');
const path = require('path');

program
  .name('own-ipfs')
  .description('Own IPFS Service CLI')
  .version('1.0.0');

program
  .command('start')
  .description('Start the IPFS service')
  .option('-p, --port <port>', 'Port to run on', '8080')
  .option('-d, --data <dir>', 'Data directory', './data')
  .action(async (options) => {
    const service = new IPFSService(parseInt(options.port), options.data);
    await service.start();
  });

program
  .command('add <file>')
  .description('Add a file to IPFS')
  .option('-d, --data <dir>', 'Data directory', './data')
  .action(async (filePath, options) => {
    try {
      if (!await fs.pathExists(filePath)) {
        console.error('File does not exist:', filePath);
        process.exit(1);
      }
      
      const storage = new Storage(options.data);
      const content = await fs.readFile(filePath);
      const filename = path.basename(filePath);
      
      const hash = await storage.store(content, filename);
      console.log('Added file:', hash);
    } catch (error) {
      console.error('Error adding file:', error.message);
      process.exit(1);
    }
  });

program
  .command('cat <hash>')
  .description('Retrieve and display file content')
  .option('-d, --data <dir>', 'Data directory', './data')
  .option('-o, --output <file>', 'Output file path')
  .action(async (hash, options) => {
    try {
      const storage = new Storage(options.data);
      const content = await storage.retrieve(hash);
      
      if (!content) {
        console.error('File not found:', hash);
        process.exit(1);
      }
      
      if (options.output) {
        await fs.writeFile(options.output, content);
        console.log('File saved to:', options.output);
      } else {
        process.stdout.write(content);
      }
    } catch (error) {
      console.error('Error retrieving file:', error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all stored files')
  .option('-d, --data <dir>', 'Data directory', './data')
  .action(async (options) => {
    try {
      const storage = new Storage(options.data);
      const files = await storage.list();
      
      if (files.length === 0) {
        console.log('No files stored');
        return;
      }
      
      console.log('Stored files:');
      files.forEach(file => {
        console.log(`${file.hash} - ${file.filename} (${file.size} bytes)`);
      });
    } catch (error) {
      console.error('Error listing files:', error.message);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show storage statistics')
  .option('-d, --data <dir>', 'Data directory', './data')
  .action(async (options) => {
    try {
      const storage = new Storage(options.data);
      const stats = await storage.getStats();
      
      console.log('Storage Statistics:');
      console.log(`Total Files: ${stats.totalFiles}`);
      console.log(`Total Size: ${stats.totalSizeFormatted}`);
    } catch (error) {
      console.error('Error getting stats:', error.message);
      process.exit(1);
    }
  });

program
  .command('hash <input>')
  .description('Generate hash for content')
  .action((input) => {
    const hash = IPFSHash.generate(input);
    console.log('Hash:', hash);
  });

program.parse();
