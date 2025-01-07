import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/services/Logger'
import { TabsetSharing } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'

const { info } = useLogger()

export class ShareWithTabsetCommand implements Command<any> {
  constructor(
    public tabsetId: string,
    public sharedId: string | undefined,
    public sharing: TabsetSharing,
    public author: string,
    public email: string,
    public republish: boolean = false,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const sharedBy = this.author
    return TabsetService.shareWith(this.tabsetId, this.sharing, this.sharedId, this.email, sharedBy || 'unknown')
      .then((res: any) => {
        info('sharing tabset')
        return res
      })
      .then(
        (oldSharing) =>
          Promise.resolve(
            new ExecutionResult(
              oldSharing,
              this.republish ? 'The tabset has been republished' : 'The tabset is shared now.',
            ),
          ),
        //new UnShareTabsetCommand(this.tabsetId)))
      )
      .catch((err) => Promise.reject(err))
  }
}

ShareWithTabsetCommand.prototype.toString = function cmdToString() {
  return `ShareWithTabsetCommand: {tabsetId=${this.tabsetId}}, {sharing=${this.sharing}, {author=${this.author}}`
}
