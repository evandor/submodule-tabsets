import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {LocalStorage} from "quasar";
import {GITHUB_REPONAME, GITHUB_TOKEN, GITHUB_USERNAME} from "boot/constants";

export class GithubBackupCommand implements Command<string> {

  constructor() {
  }

  async execute(): Promise<ExecutionResult<string>> {
    var filename = "tabsets_backup_" + new Date().getTime()
    const username = LocalStorage.getItem(GITHUB_USERNAME) as string
    const reponame = LocalStorage.getItem(GITHUB_REPONAME) as string
    const token = LocalStorage.getItem(GITHUB_TOKEN) as string
    const data = useTabsetService().exportDataAsJson()
    let existing = ''
    try {
      const existingResponse = await this.githubGetContentRequest("tabsets_backup_current", username, reponame, token);
      if (existingResponse.ok) {
        existing = await existingResponse.json()
        // const compareTo = atob(existing['content' as keyof object])
        const compareTo = decodeURIComponent(escape(window.atob(existing['content' as keyof object])));
        if (data === compareTo) {
          return Promise.resolve(new ExecutionResult("", "no change"))
        }
      }
      const result = await this.githubPutContentRequest(filename, username, reponame, token, data);
      console.log("result", result);
      const resultCurrent = await this.githubPutContentRequest("tabsets_backup_current", username, reponame, token, data);
      console.log("resultCurrent", resultCurrent);
      return Promise.resolve(new ExecutionResult("", "done"))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private async githubGetContentRequest(filename: string, username: string, reponame: string, token: string) {
    return await fetch(`https://api.github.com/repos/${username}/${reponame}/contents/${filename}`, {
      method: 'GET',
      headers: this.getHeaders(token)
    })
  }

  private async githubPutContentRequest(filename: string, username: string, reponame: string, token: string, data: string) {
    const result = await fetch(`https://api.github.com/repos/${username}/${reponame}/contents/${filename}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({
        message: 'upload from excalidraw extention',
        committer: {name: "tabsets", email: "info@tabsets.net"},
        content: btoa(unescape(encodeURIComponent(data)))
      })
    })
    return result;
  }

  private getHeaders(token: string) {
    return {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }
}

GithubBackupCommand.prototype.toString = function cmdToString() {
  return `GithubBackupCommand: {}`;
};
