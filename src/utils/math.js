export const round = (x) => Math.round(x * 100) / 100;

export const clip = (x, low, high) => Math.min(Math.max(x, low), high);

export const calcMean = arr => round(arr.reduce( ( p, c ) => p + c, 0 ) / arr.length);

export const calcVariance = (arr) => {
  const mean = calcMean(arr);
  const sum = arr.reduce(( p, c ) => (c - mean) * (c - mean) + c, 0);
  return round(sum / arr.length);
}
