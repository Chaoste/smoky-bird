import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import createStore from './store';
import initialState from './initialState';
import * as record from './record';
import './css/index.css';

const state = {
  initialState: { ...initialState },
  ...initialState,
};

const store = createStore(
  state
  // window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const renderToDOM = state => {
  return ReactDOM.render(
    <App
      state={state || store.getState()}
      actions={store.actions}
      record={record}
    />,
    document.getElementById('root')
  );
};

record.setRender(renderToDOM);

store.subscribe(data => {
  const { actionType, currentState } = data;

  if (actionType === 'START_PLAY') {
    record.start();
    record.save(currentState.initialState);
    playing();
  } else if (actionType === 'PLAYING' || actionType === 'FLY_UP') {
    record.save(currentState);
    renderToDOM();
    if (currentState.game.status === 'over') {
      record.finish();
      stopPlaying();
    }
  }
});

let { PLAYING } = store.actions;
let requestID = null;
function playing() {
  requestID = requestAnimationFrame(playing);
  // eslint-disable-next-line new-cap
  PLAYING();
}
function stopPlaying() {
  cancelAnimationFrame(requestID);
}

renderToDOM();
