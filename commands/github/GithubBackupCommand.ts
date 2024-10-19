import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {GithubCommands} from "src/tabsets/commands/github/GithubCommands";

export class GithubBackupCommand extends GithubCommands<string> {

  constructor(
    public filenames: string[] = ["tabsets_backup_current"]
  ) {
    super();
  }

  async execute(): Promise<ExecutionResult<string>> {
    const data = useTabsetService().exportDataAsJson()
    let existing = ''
    try {
      for (let i = 0; i < this.filenames.length; i++) {
        const existingResponse = await this.githubGetContentRequest(this.filenames[0]);
        let sha: string | undefined = undefined
        if (existingResponse.ok) {
          existing = await existingResponse.json()
          sha = existing['sha' as keyof object]
        }
        const r = await this.githubPutContentRequest(this.filenames[i], data, sha);
        console.log("got", r)
      }
      return Promise.resolve(new ExecutionResult("", "done"))
    } catch (error) {
      return Promise.reject(error)
    }
  }

}

GithubBackupCommand.prototype.toString = function cmdToString() {
  return `GithubBackupCommand: {}`;
};
