export const round = x => Math.round(x * 100) / 100;

export const clip = (x, low, high) => Math.min(Math.max(x, low), high);

export const calcMean = arr =>
  round(arr.reduce((p, c) => p + c, 0) / arr.length);

export const calcVariance = arr => {
  const mean = calcMean(arr);
  const sum = arr.reduce((p, c) => (c - mean) * (c - mean) + c, 0);
  return round(sum / arr.length);
};

export const calcMedian = arr => {
  const numsLen = arr.length;
  arr.sort();
  if (numsLen % 2 === 0) {
    // Is even -> Average of two middle arr
    return (arr[numsLen / 2 - 1] + arr[numsLen / 2]) / 2;
  }
  // Is odd -> Middle number only
  return arr[(numsLen - 1) / 2];
};

export const getOutlierFences = arr => {
  // Statistical approch: Outlier fences are defined by std (IQR)
  const median = calcMedian(arr);
  const variance = calcVariance(arr);
  const std = Math.sqrt(variance);
  const lowerFence = median - 2.698 * std;
  const upperFence = median + 2.698 * std;
  return [lowerFence, upperFence];
};

export const getNoiseBounds = arr => {
  const [lowerFence, upperFence] = getOutlierFences(arr);
  const filtered = arr.filter(x => lowerFence <= x && x <= upperFence);
  return [Math.min(...filtered), Math.max(...filtered)];
};
