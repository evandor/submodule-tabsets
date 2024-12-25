import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/services/Logger'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { TabsetStatus } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'

const { info } = useLogger()

class UndoCommand implements Command<TabsetStatus> {
  constructor(
    public tabsetId: string,
    public oldStatus: TabsetStatus,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    return new MarkTabsetAsDefaultCommand(this.tabsetId)
      .execute()
      .then((res) => new ExecutionResult(res, 'Tabset was unmarked again'))
  }
}

export class MarkTabsetAsFavoriteCommand implements Command<TabsetStatus> {
  constructor(public tabsetId: string) {}

  async execute(): Promise<ExecutionResult<TabsetStatus>> {
    return TabsetService.markAs(this.tabsetId, TabsetStatus.FAVORITE)
      .then((res: any) => {
        info('made tabset favorite')
        return res
      })
      .then((oldStatus) =>
        Promise.resolve(
          new ExecutionResult(
            oldStatus,
            'Tabset set as favorite',
            //new Map([["Undo", new UndoCommand(this.tabsetId, oldStatus)]])
          ),
        ),
      )
      .catch((err) => Promise.reject(err))
  }
}
