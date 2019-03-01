import React from 'react'
import classnames from 'classnames'
import Bird from './components/Bird'
import Piping from './components/Piping'
import Menu from './components/Menu'
import throttle from 'lodash/throttle';
import * as socketUtils from './utils/socket.js';
import * as mathUtils from './utils/math.js';

import tilmanPutzt from  './images/tilman_seamless.mp4';

const URI = '192.168.178.118:80';
const SIGNAL_WINDOW_SIZE = 50;

const MAX_VAL = 50;
const USE_SOCKET = true;
const MIN_PRESSURE_RATIO = 0.06; // 10% of max required to trigger FLY_UP

export default class App extends React.Component {
  connection = undefined;
  state = {
    lastSignals: [],
    calibration: {
      amount: 0,
      mean: 0,
      variance: 0,
    }
  }
  refAudio = React.createRef();

  componentWillMount() {
    if (USE_SOCKET) {
      this.connection = socketUtils.setup(URI);
      this.connection.onopen = () => {
        console.log('Hello')
        this.connection.send('PENIS'); // Send the message 'Ping' to the server
      };
      this.connection.onerror = (err) => {
        console.error('WS Error', err)
      }
      this.connection.onmessage = (e) => {
        this.receiveSignal(parseInt(e.data, 10));
      };
    }
  }

  componentWillUnmount() {
    if (this.connection)
      this.connection.close();
  }

  receiveSignal = (value: number) => {
    const lastSignals = [ ...this.state.lastSignals, value ].slice(-SIGNAL_WINDOW_SIZE);
    this.setState({ lastSignals });
    if (this.state.calibration.amount < SIGNAL_WINDOW_SIZE) {
      if (lastSignals.length > 1 && lastSignals.length % 10 === 0) {
        const calibrationUpdate = socketUtils.calibrate(lastSignals);
        this.setState(calibrationUpdate);
        if (lastSignals.length === SIGNAL_WINDOW_SIZE) {
          console.info('Calibration finished', calibrationUpdate)
        }
      }
    } else {
      this.triggerInput(lastSignals);
    }
  }

  triggerInput = throttle((signals) => {
    const { FLY_UP, FLY_UP_END } = this.props.actions;
    const { isRecording } = this.props.record.getRecord();
    const isPlaying = this.props.state.game.status === 'playing';
    if (isPlaying && !isRecording) {
      const diff = mathUtils.calcMean(signals) - this.state.calibration.mean;
      // this.state.calibration.variance
      const factor = mathUtils.clip(diff / MAX_VAL, -1.5, 1.5);
      if (factor > MIN_PRESSURE_RATIO) {
        console.debug('UP', mathUtils.round(diff), mathUtils.round(factor))
        FLY_UP(factor);
      } else if (this.props.state.bird.status === 'up') {
        console.debug('DOWN', mathUtils.round(diff), mathUtils.round(factor))
        FLY_UP_END();
      } else {
        console.debug('NOOP', mathUtils.round(diff), mathUtils.round(factor))
      }
    }
  }, 30)

  componentWillReceiveProps(newProps) {
    if (this.props.state.game.status !== 'over' &&
      newProps.state.game.status === 'over') {
        console.log('PLAY')
        this.refAudio.current.play();
    }
  }

  render() {
    const { state, actions, record } = this.props;
    const { bird, pipings, game, player } = state
    const { FLY_UP, FLY_UP_END, START_PLAY } = actions
    const recordState = record.getRecord()
    const { isRecording, history } = recordState
    const isPlaying = game.status === 'playing'
    const onMouseDown = () => {
      if (isPlaying && !isRecording) {
        FLY_UP()
      } else if (isRecording) {
        record.stop();
      }
    }
    const onFlyUpEnd = isPlaying && !isRecording && (() => FLY_UP_END())
    const onReplay = history.length > 0 && record.replay
    const landClasses = classnames({
      land: true,
      sliding: isPlaying,
    })
    return (
      <div className="game">
        <div className="title title-1">Smoky</div>
        <div className="scene" onMouseDown={onMouseDown} onMouseUp={onFlyUpEnd} onTouchStart={onMouseDown} onTouchEnd={onFlyUpEnd}>
          <video autoPlay loop>
            <source src={tilmanPutzt} type="video/mp4"/>
            Your browser does not support the video tag.
          </video>
            { isPlaying &&
              <div className="score">{player.score}</div>
            }
            <Bird {...bird} isFlying={isPlaying}  />
            {
              pipings.list.map(piping => <Piping key={piping.timestamp} {...piping} />)
            }
            <div className={landClasses} />
            { game.status === 'over' && (
              <Menu score={player.score} onPlay={START_PLAY} onReplay={onReplay} onReverse={record.reverse} />
            )}
            <audio controls ref={this.refAudio}>
              <source src='https://lapipe.de/files/fawaz_voice.mp3' type="audio/mpeg"/>
            </audio>

        </div>
        <div className="title title-2">Burrd</div>
      </div>
    )
  };
}
