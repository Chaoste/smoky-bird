import React from 'react'
import classnames from 'classnames'
import Bird from './components/Bird'
import Piping from './components/Piping'
import Menu from './components/Menu'
import throttle from 'lodash/throttle';

import tilmanPutzt from  './images/tilman_seamless.mp4';

const SIGNAL_WINDOW_SIZE = 100;

const round = (x) => Math.round(x * 100) / 100;

const calcMean = arr => round(arr.reduce( ( p, c ) => p + c, 0 ) / arr.length);

const calcVariance = (arr) => {
  const mean = calcMean(arr);
  const sum = arr.reduce(( p, c ) => (p - mean) * (p - mean) + c, 0);
  return round(sum / arr.length);
}

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
    // this.connection = new WebSocket(`ws://${IP}`, ['soap', 'xmpp']);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  componentWillUnmount() {
    if (this.connection)
      this.connection.close();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  registerEventHandlers() {
    // When the connection is open, send some data to the server
    this.connection.onopen = function () {
      this.connection.send('Ping'); // Send the message 'Ping' to the server
    };

    // Log errors
    this.connection.onerror = function (error) {
      console.log('WebSocket Error ' + error);
    };

    // Log messages from the server
    this.connection.onmessage = function (e) {
      console.log('Server: ' + e.data);
    };
  };

  send(msg) {
    // Sending String
    this.connection.send(msg);
    // Sending canvas ImageData as ArrayBuffer
    // var img = canvas_context.getImageData(0, 0, 400, 320);
    // var binary = new Uint8Array(img.data.length);
    // for (var i = 0; i < img.data.length; i++) {
    //   binary[i] = img.data[i];
    // }
    // this.connection.send(binary.buffer);

    // Sending file as Blob
    // var file = document.querySelector('input[type="file"]').files[0];
    // this.connection.send(file);
  }

  calibrate = (signals: Array<number>) => {
    const mean = calcMean(signals);
    const vari = calcVariance(signals);
    console.info(`After ${signals.length} signals: mean=${mean}, var=${vari}`);
    this.setState({
      calibration: {
        amount: signals.length,
        mean: mean,
        variance: vari,
      },
    });
  }

  receiveSignal = (value: number) => {
    const lastSignals = [ ...this.state.lastSignals, value ].slice(-SIGNAL_WINDOW_SIZE);
     this.setState({ lastSignals });
     if (this.state.calibration.amount !== SIGNAL_WINDOW_SIZE &&
       lastSignals.length > 1 && lastSignals.length % 10 === 0) {
         this.calibrate(lastSignals);
     } else {
       this.triggerInput(lastSignals);
     }
  }

  triggerInput = throttle((signals) => {
    let { FLY_UP, FLY_UP_END } = this.props.actions;
    const { isRecording } = this.props.record.getRecord();
    const isPlaying = this.props.game.status === 'playing';
    const diff = calcMean(signals) - this.state.calibration;
    if (isPlaying && !isRecording) {
      if (Math.abs(diff) <= this.state.calibration.variance) {
        const transformed = diff / 1500;
        const factor = Math.min(Math.max(transformed, -1), 1);
        FLY_UP(factor);
      } else if (this.props.state.bird.state === 'up') {
        FLY_UP_END();
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
    let { bird, pipings, game, player } = state
    let { FLY_UP, FLY_UP_END, START_PLAY } = actions
    let recordState = record.getRecord()
    let { isRecording, history } = recordState
    let isPlaying = game.status === 'playing'
    const onMouseDown = () => {
      if (isPlaying && !isRecording) {
        FLY_UP()
      } else if (isRecording) {
        record.stop();
      }
    }
    let onFlyUpEnd = isPlaying && !isRecording && (() => FLY_UP_END())
    let onReplay = history.length > 0 && record.replay
    let landClasses = classnames({
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
