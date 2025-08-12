#!/usr/bin/env node

/**
 * Memory Bank Auto-Update Script
 * Automatically updates documentation based on codebase changes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MEMORY_DIR = '.cursor/memory';
const PROJECT_ROOT = process.cwd();

class MemoryUpdater {
  constructor() {
    this.lastUpdate = this.getLastUpdateTime();
    this.hasChanges = false;
  }

  getLastUpdateTime() {
    try {
      const statsFile = path.join(MEMORY_DIR, 'last-update.json');
      if (fs.existsSync(statsFile)) {
        const data = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        return new Date(data.timestamp);
      }
    } catch (error) {
      console.log('No previous update timestamp found');
    }
    return new Date(0); // If no previous update, start from epoch
  }

  saveUpdateTime() {
    const statsFile = path.join(MEMORY_DIR, 'last-update.json');
    const stats = {
      timestamp: new Date().toISOString(),
      filesChecked: [
        'package.json',
        'src/**/*.ts',
        'src/**/*.js',
        '.cursor/rules/**/*.md'
      ]
    };
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }

  async checkForChanges() {
    try {
      // Get recent commits since last update
      const gitLog = execSync(`git log --since="${this.lastUpdate.toISOString()}" --oneline`, { encoding: 'utf8' });
      
      if (gitLog.trim()) {
        console.log('Recent changes detected:');
        console.log(gitLog);
        this.hasChanges = true;
        return true;
      }
    } catch (error) {
      console.log('Could not check git history, will update anyway');
      this.hasChanges = true;
      return true;
    }
    
    return false;
  }

  updateActiveDeployment() {
    try {
      // Get current branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      // Get recent commits
      const recentCommits = execSync('git log --oneline -10', { encoding: 'utf8' });
      
      // Get current git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      
      // Get all branches
      const branches = execSync('git branch -a', { encoding: 'utf8' });

      const activeDevelopmentPath = path.join(MEMORY_DIR, 'active-development.md');
      
      if (fs.existsSync(activeDevelopmentPath)) {
        let content = fs.readFileSync(activeDevelopmentPath, 'utf8');
        
        // Update current branch section
        content = content.replace(
          /\\*\\*Branch\\*\\*: `[^`]+`/,
          `**Branch**: \`${currentBranch}\``
        );
        
        // Update recent commits section
        const commitsSection = recentCommits.split('\\n')
          .filter(line => line.trim())
          .map(line => line.trim())
          .join('\\n');
        
        content = content.replace(
          /(### Latest Commits \\(Last 10\\)[\\s\\S]*?```)[\\s\\S]*?(```)/,
          `$1\\n${commitsSection}\\n$2`
        );
        
        // Add timestamp
        const timestamp = new Date().toISOString();
        content = content.replace(
          /(# Active Development Status)/,
          `$1\\n\\n*Last updated: ${timestamp}*`
        );
        
        fs.writeFileSync(activeDevelopmentPath, content);
        console.log('✅ Updated active-development.md');
      }
    } catch (error) {
      console.error('Error updating active development:', error.message);
    }
  }

  updateCodebaseContext() {
    try {
      // Check if new files were added to key directories
      const srcFiles = this.getDirectoryStructure('src');
      const hasNewStructure = this.checkStructureChanges(srcFiles);
      
      if (hasNewStructure) {
        console.log('📁 New code structure detected, consider updating codebase-context.md');
      }
    } catch (error) {
      console.error('Error checking codebase structure:', error.message);
    }
  }

  getDirectoryStructure(dir) {
    const structure = {};
    const fullPath = path.join(PROJECT_ROOT, dir);
    
    if (!fs.existsSync(fullPath)) return structure;
    
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        structure[item.name] = this.getDirectoryStructure(path.join(dir, item.name));
      } else {
        structure[item.name] = 'file';
      }
    }
    
    return structure;
  }

  checkStructureChanges(currentStructure) {
    try {
      const structureFile = path.join(MEMORY_DIR, 'last-structure.json');
      
      if (!fs.existsSync(structureFile)) {
        fs.writeFileSync(structureFile, JSON.stringify(currentStructure, null, 2));
        return false;
      }
      
      const lastStructure = JSON.parse(fs.readFileSync(structureFile, 'utf8'));
      const hasChanges = JSON.stringify(currentStructure) !== JSON.stringify(lastStructure);
      
      if (hasChanges) {
        fs.writeFileSync(structureFile, JSON.stringify(currentStructure, null, 2));
      }
      
      return hasChanges;
    } catch (error) {
      console.error('Error checking structure changes:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🔍 Checking for codebase changes...');
    
    const hasChanges = await this.checkForChanges();
    
    if (!hasChanges) {
      console.log('✅ No changes detected since last update');
      return;
    }
    
    console.log('📝 Updating memory bank documentation...');
    
    this.updateActiveDeployment();
    this.updateCodebaseContext();
    
    this.saveUpdateTime();
    
    console.log('✅ Memory bank update completed');
  }
}

// Run the updater
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new MemoryUpdater();
  updater.run().catch(console.error);
}

export { MemoryUpdater };