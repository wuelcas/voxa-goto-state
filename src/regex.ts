export const onState = /onState[(]['"][^"]+['"]/g;
export const toState = /to\s?[:=]\s['"][\w\W]+['"]/g;
export const quotationMarks = /["']/g;
export const spacesTabsAndLineBreaks = /\s{2,}|\t|\r\n|\n|\r|/g;
export const toKeywordWithoutState = /to\s?[:=]\s['"]['"]?/g;
