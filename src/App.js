/* eslint-disable new-cap */
import React from 'react'
import Bird from './components/Bird'
import Piping from './components/Piping'
import Menu from './components/Menu'
import HookahSocket from './hookah-socket/';

import tilmanPutzt from  './images/tilman_seamless.mp4';

// TODO: Automatically find out URI
const URI = '192.168.178.118:80';

// Min percentage of "MAX_PRESSURE" required for flying up (default: 0.15)
const MIN_PRESSURE_RATIO = 0.15;

export default class App extends React.Component {
  state = {
    socketURI: URI,
  }

  refAudio = React.createRef();

  // The user is pulling; the value will be between 0 and 1
  onSignal = (value: number) => {
    const { FLY_UP, FLY_UP_END } = this.props.actions;
    const { isRecording } = this.props.record.getRecord();
    const isPlaying = this.props.state.game.status === 'playing';
    if (!isPlaying || isRecording)
      return;
    if (value > MIN_PRESSURE_RATIO) {
      // console.debug('UP', mathUtils.round(diff), mathUtils.round(value))
      FLY_UP(value);
    } else if (this.props.state.bird.status === 'up') {
      // console.debug('DOWN', mathUtils.round(diff), mathUtils.round(value))
      FLY_UP_END();
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.state.game.status !== 'over' &&
      newProps.state.game.status === 'over') {
        this.refAudio.current.play();
    }
  }

  onMouseUp = () => {
    const { state, actions, record } = this.props
    const { isRecording } = record.getRecord()
    const isPlaying = state.game.status === 'playing'
    const { FLY_UP_END } = actions
    if (isPlaying && !isRecording) {
      FLY_UP_END();
    }
  }

  onMouseDown = () => {
    const { state, actions, record } = this.props;
    const { FLY_UP } = actions
    const { isRecording } = record.getRecord()
    const isPlaying = state.game.status === 'playing'
    if (isPlaying && !isRecording) {
      FLY_UP()
    } else if (isRecording) {
      record.stop();
    }
  }

  render() {
    const { state, actions, record } = this.props;
    const { bird, pipings, game, player } = state
    const { START_PLAY } = actions
    const recordState = record.getRecord()
    const isPlaying = game.status === 'playing'
    const onReplay = recordState.history.length > 0 && record.replay
    return (
      <div className="game">
        <div className="title title-1">Smoky</div>
        <div className="scene" onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onTouchStart={this.onMouseDown} onTouchEnd={this.onFlyUpEnd}>
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
            <div className={`land ${isPlaying ? 'sliding' : ''}`} />
            { game.status === 'over' && (
              <Menu score={player.score} onPlay={START_PLAY} onReplay={onReplay} onReverse={record.reverse} />
            )}
            <audio controls ref={this.refAudio}>
              <source src='https://lapipe.de/files/fawaz_voice.mp3' type="audio/mpeg"/>
            </audio>

        </div>
        <div className="title title-2">Burrd</div>
        <HookahSocket socketURI={this.state.socketURI} onSignal={this.onSignal}/>
      </div>
    )
  };
}
