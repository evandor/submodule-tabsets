import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {TABSET_NAME_MAX_LENGTH} from "src/tabsets/models/Tabset";

export class TabsetColumn {

  constructor(
    public id: string,
    public title: string,
    public open: boolean = false) {

    this.title = this.title.replace(STRIP_CHARS_IN_USER_INPUT, '')
    if (this.title.length >= 20) {
      this.title = this.title.substring(0, 17) + "..."
    }

  }

}
