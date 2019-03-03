import * as mathHelper from './mathHelper.js';

export const setup = uri => {
  return new Promise((resolve, reject) => {
    console.debug(`Setting up a WebSocket connection to ws://${uri}`);
    const connection = new WebSocket(`ws://${uri}`);
    connection.onopen = () => {
      console.debug('WebSocket connection established!');
      resolve(connection);
    };
    connection.onerror = err => {
      console.error('WS Error', err);
      reject(err);
    };
  });
};

export const registerEventHandlers = (connection, onSignal) => {
  connection.onmessage = e => {
    const value = e.data;
    if (isNaN(value)) {
      console.error(`Received invalid value: ${value}`);
    } else {
      onSignal(parseFloat(e.data, 10));
    }
  };
};

export const send = (connection, msg) => {
  // Sending String
  connection.send(msg);
};

export const calibrate = (signals: Array<number>): Object => {
  const mean = mathHelper.calcMean(signals);
  const [lowerFence, upperFence] = mathHelper.getOutlierFences(signals);
  return {
    amount: signals.length,
    mean,
    lowerFence,
    upperFence,
  };
};

// this.setState(socketUtils.calibrate(signals));
