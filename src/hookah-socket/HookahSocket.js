/* eslint-disable new-cap */
import React from 'react'
import throttle from 'lodash/throttle';
import * as socketHelper from './socketHelper.js';
import * as mathHelper from './mathHelper.js';

import './ledLight.css';

// Hardcoded since this shouldn't change, may be greater for higher difficulty
const MAX_PRESSURE = 50;
// When the connection is open, send an introduction message to the server
const INTRODUCTION_MESSAGE = 'Hey there! Do you wanna play a game?' ;

/*
 * Props:
 *  - socketURI: If not None, a socket client will try to connect to this address (e.g. '192.168.178.118:80')
 *  - signalWindowSize: How many values should be collected for calibration (default: 50)
 *  - onSignal [required]: Triggered if value is considered to be no noise
 *  - throttlingDelay: If there are too many signals at once, we need to pause and collect
 *        the great amount of signals before triggering on Signal (default: 30 [ms])
 *  - allowNegativeSignals: If true, pushing into the hose, will trigger events with negative values (default: false)
 */
export class HookahSocket extends React.Component {
  connection = undefined;

  static defaultProps = {
    	socketURI: undefined,
      signalWindowSize: 50,
      throttlingDelay: 30,
      allowNegativeSignals: false,
  }

  state = {
    isConnecting: false,
    lastSignals: [],
    calibration: {
      amount: 0,
      mean: 0,
      lowerFence: 0,
      upperFence: 1,
    }
  }

  componentWillMount() {
    this.tryConnectingToSocket();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.socketURI != null && this.props.socketURI == null)
      this.tryConnectingToSocket();
  }

  tryConnectingToSocket() {
    if (this.props.socketURI == null || this.connection != null)
      return;
    this.setState({ isConnecting: true });
    socketHelper.setup(this.props.socketURI).then((connection) => {
      this.connection = connection;
      this.setState({ isConnecting: false });
      this.connection.send(INTRODUCTION_MESSAGE)
      socketHelper.registerEventHandlers(this.connection, this.onReceiveSignal)
    }).catch(() => {
      this.setState({ isConnecting: false });
    });
  }

  componentWillUnmount() {
    if (this.connection)
      this.connection.close();
  }

  checkCalibration = (lastSignals: Array<number>) => {
    // Enough signals collected
    if (this.state.calibration.amount >= this.props.signalWindowSize)
      return true;
    // Only calibrate every 10 signals
    if (lastSignals.length <= 1 || lastSignals.length % 10 !== 0)
      return false;
    this.setState({
      calibration: socketHelper.calibrate(lastSignals),
      lastSignals,
    }, () => {
      if (this.state.calibration.amount === this.props.signalWindowSize) {
        console.debug('Calibration is finished', this.state.calibration)
      }
    });
    return false;
  }

  onReceiveSignal = (value: number) => {
    const lastSignals = [ ...this.state.lastSignals, value ].slice(-this.props.signalWindowSize);
    // If we are done calibrating -> trigger the input processing
    if (this.checkCalibration(lastSignals)) {
      this.setState({ lastSignals });
      this.triggerInput(lastSignals);
    }
  }

  triggerInput = throttle((signals) => {
    const diff = mathHelper.calcMean(signals) - this.state.calibration.mean;
    const factor = mathHelper.clip(diff / MAX_PRESSURE, -1, 1);
    if (this.props.allowNegativeSignals && factor < this.state.calibration.lowerFence) {
      this.props.onSignal(factor);
    } else if (factor > this.state.calibration.upperFence) {
      this.props.onSignal(factor);
    }
  }, this.props.throttlingDelay)

  getStateClassName = () => {
    if (this.state.isConnecting)
      return 'yellow';
    else if (this.connection == null)
      return 'red';
    return 'green';
  }

  render() {
    const stateClassName = this.getStateClassName();
    return <div title={this.props.socketURI} className={`socketLedLight ${stateClassName}`} />
  };
}

export default HookahSocket;
