// backend/services/gitService.js
const simpleGit = require('simple-git');

class GitService {
  async initRepo(projectPath) {
    const git = simpleGit(projectPath);
    await git.init();
    await git.add('.');
    await git.commit('Initial commit - AI generated');
  }

  async createBranch(projectPath, branchName) {
    const git = simpleGit(projectPath);
    await git.checkoutLocalBranch(branchName);
  }

  async commitChanges(projectPath, message) {
    const git = simpleGit(projectPath);
    await git.add('.');
    await git.commit(message);
  }

  async getDiff(projectPath) {
    const git = simpleGit(projectPath);
    return await git.diff();
  }

  async getHistory(projectPath, limit = 10) {
    const git = simpleGit(projectPath);
    return await git.log({ maxCount: limit });
  }
}