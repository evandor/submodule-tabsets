import { Placeholders, PlaceholdersType } from 'src/tabsets/models/Placeholders'
import { Tab } from 'src/tabsets/models/Tab'

class PH {
  constructor(
    public replacement: string,
    public values: Map<string, string>,
  ) {}
}

class PlaceholderUtils {
  defaultPlaceholders: Map<RegExp, PH> = new Map([
    [
      /^(.*)(github\.com)\/([^\/]*)\/([^\/]*)\/($)/gm,
      new PH('$1$2/$3/$4/${path}', new Map([['path', 'actions,issues']])),
    ],
    [/^(.*)(sueddeutsche\.de)\/($)/gm, new PH('$1$2/$3${path}', new Map([['path', 'muenchen,sport,bayern']]))],
  ])

  applyForDefaultDomains(tab: Tab): Tab {
    const url = tab.url
    if (url) {
      for (const regex of this.defaultPlaceholders.keys()) {
        if (url.match(regex)) {
          console.log('got match', url, regex)
          const val = this.defaultPlaceholders.get(regex)
          if (val) {
            console.log('found val', val)
            const substitutions = [...val.values.keys()]
            console.log('found substitutions', substitutions)
            const replacement = url.replace(regex, val['replacement' as keyof object])
            console.log('replacement', replacement)
            tab.url = replacement
            tab = this.apply(tab, substitutions, val.values)
          }
        }
      }
    }
    return tab
  }

  apply(tab: Tab, placeholders: string[], placeholderValues: Map<string, string>) {
    let config: { [k: string]: any } = {}
    for (const p of placeholders) {
      config[p] = placeholderValues.get(p)
    }
    console.log('got config', config, Object.keys(config))
    if (Object.keys(config).length > 0) {
      tab.placeholders = new Placeholders(PlaceholdersType.URL_SUBSTITUTION, tab.id, config)
    } else {
      tab.placeholders = undefined
    }
    return tab
  }

  // expand(tab: Tab): string[] {
  //   if (!tab.placeholders) {
  //     return tab.url ? [tab.url] : []
  //   }
  //   const placeholders = tab.placeholders
  //   if (placeholders.type !== PlaceholdersType.URL_SUBSTITUTION) {
  //     return tab.url ? [tab.url] : []
  //   }
  //   const urls: string[] = []
  //   const keys = Object.keys(placeholders.config) // e.g.path, day
  //   for (const key of keys) {
  //     // console.log(key, person[key]);
  //     const v = (placeholders.config[key as keyof object] as string).split(',')
  //     //matrix.push(key, v)
  //   }
  //   return urls
  // }
}

export default new PlaceholderUtils()
