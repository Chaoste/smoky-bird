import * as mathUtils from './math.js';

export const setup = (uri) => {
  console.debug(`Setting up a WebSocket connection to ${uri}`)
  const socket = new WebSocket(`ws://${uri}`);
  return socket;
}

export const registerEventHandlers = (connection, ) => {
  // When the connection is open, send some data to the server
  connection.on('connection', () => {
    connection.send('Ping'); // Send the message 'Ping' to the server
  });

  // Log errors
  connection.on('disconnect', (reason) => {
    console.error('WebSocket Error ' + reason);
  });
};

export const send = (connection, msg) => {
  // Sending String
  connection.send(msg);
}

export const calibrate = (signals: Array<number>): Object => {
  const mean = mathUtils.calcMean(signals);
  const vari = mathUtils.calcVariance(signals);
  console.debug(`After ${signals.length} signals: mean=${mean}, var=${vari}`);
  return {
    calibration: {
      amount: signals.length,
      mean: mean,
      variance: vari,
    },
  };
}

// this.setState(socketUtils.calibrate(signals));
