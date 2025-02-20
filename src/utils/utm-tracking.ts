interface UTM {
  campaign: string
  content: string
  medium: string
  source: string
  term: string
}

export class UTMTracking {
  static keyToUTM(key: string): null | UTM {
    try {
      const [campaign, source, medium, term, content] = key.split('-')
      return { campaign, content, medium, source, term } as UTM
    } catch (error) {
      return null
    }
  }

  static utmToKey(utm?: UTM) {
    if (!utm || Object.values(utm).every((value) => !value)) {
      return null
    }

    return `${utm.campaign}-${utm.source}-${utm.medium}-${utm.term}-${utm.content}`
  }
}
