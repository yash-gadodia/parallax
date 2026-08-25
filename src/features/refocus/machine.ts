export type Step =
  // solo (unchanged flow, plus a safety routing outcome)
  | 'intro'
  // capture: how hot is it, before either partner writes anything
  | 'heatCheck'
  | 'coolDown'
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
