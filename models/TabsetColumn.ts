import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {TABSET_NAME_MAX_LENGTH} from "src/tabsets/models/Tabset";

export class TabsetColumn {

  constructor(
    public id: string,
    public title: string,
    public open: boolean = false) {

    if (!TabsetColumn.titleIsValid) {
      throw new Error(`Column's name '${name}' is not valid`)
    }

    if (!TabsetColumn.titleIsShortEnough) {
      throw new Error(`Column's name '${name}' is too long`)
    }

  }

  static titleIsValid = (val: string) => !STRIP_CHARS_IN_USER_INPUT.test(val)

  static titleIsShortEnough = (val: string) => val ? val.length <= TABSET_NAME_MAX_LENGTH : true


}
