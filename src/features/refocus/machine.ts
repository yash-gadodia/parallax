export type Step =
  // solo (unchanged flow, plus a safety routing outcome)
  | 'intro'
  | 'mode'
  | 'share'
  | 'waiting'
  | 'error'
  | 'result'
  | 'soloSafety'
  // two-sided session flow (4.6)
  | 'togetherTopic'
  | 'togetherWaiting'
  | 'togetherAdd'
  | 'togetherMediating'
  | 'togetherResult'
  | 'togetherSafety'
  | 'togetherError'
  | 'togetherExpired';
