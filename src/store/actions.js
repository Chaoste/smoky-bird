/* eslint-disable no-use-before-define, new-cap */

export const START_PLAY = state => {
  const game = { ...state.game };
  game.status = 'playing';
  const nextState = {
    ...state,
    ...state.initialState,
    game,
  };
  return FLY_UP(nextState);
};

export const FLY_UP = (state, force) => {
  // TODO: Remove, user can't pull if at the top
  if (state.bird.height >= state.game.range.max) {
    return state;
  }

  const bird = { ...state.bird };
  bird.status = 'up';
  bird.force = force !== undefined ? force : 1;
  bird.originalHeight = bird.height;
  bird.timestamp = Date.now();

  return {
    ...state,
    bird,
  };
};

export const PLAYING = state => {
  const gameStatus = state.game.status;
  if (gameStatus === 'over') {
    return state;
  }
  let nextState = flying(state);
  nextState = sliding(nextState);
  nextState = collisitionDetection(nextState);
  return nextState;
};

export const FLY_UP_END = state => {
  const bird = { ...state.bird };
  bird.status = 'down';
  bird.force = 0;
  bird.originalHeight = bird.height;
  bird.timestamp = Date.now();

  return {
    ...state,
    bird,
  };
};

const flying = state => {
  const bird = { ...state.bird };

  const { timestamp, dropTime, force } = bird;
  const time = Date.now() - timestamp;

  if (bird.status === 'up') {
    bird.height = bird.originalHeight + (bird.flyHeight * force * time) / 1000;
  } else {
    const shift =
      (time * (state.game.range.max - state.game.range.min)) / dropTime;
    bird.height = bird.originalHeight - shift;
  }

  return {
    ...state,
    bird,
  };
};

const sliding = state => {
  const pipings = { ...state.pipings };
  const now = Date.now();
  if (now - pipings.timestamp >= pipings.interval) {
    const { game } = state;
    const heightRange = game.range.max - game.range.min;
    const shift =
      pipings.range.y.min +
      (pipings.range.y.max - pipings.range.y.min) * Math.random();
    const piping = {
      timestamp: now,
      x: pipings.range.x.min,
      upper: heightRange - shift - pipings.range.gap,
      below: shift,
      bottom: shift,
      top: shift + pipings.range.gap,
    };
    pipings.list = pipings.list.concat(piping);
    pipings.timestamp = now;
  }

  const { bird, game } = state;
  const collisitionRange = getCollisitionRange(
    bird.size.width,
    game.size.width,
    pipings.size.width
  );
  const player = { ...state.player };

  pipings.list = pipings.list
    .map(piping => {
      piping = { ...piping };
      if (piping.x < pipings.range.x.max) {
        let ratio = (now - piping.timestamp) / pipings.speed;
        if (ratio > 1) {
          ratio = 1;
        }
        piping.x = ratio * pipings.range.x.max;
      } else {
        piping.x = pipings.range.x.max;
      }

      if (piping.x > collisitionRange.to && !piping.isPassed) {
        piping.isPassed = true;
        player.score += 1;
      }

      return piping;
    })
    .filter(piping => {
      return piping.x < pipings.range.x.max;
    });

  return {
    ...state,
    pipings,
    player,
  };
};

const getCollisitionRange = (birdWidth, gameWidth, pipingWidth) => {
  const from = (gameWidth - birdWidth) / 2;
  const to = from + birdWidth / 2 + pipingWidth;
  return { from, to };
};

const collisitionDetection = state => {
  const { game, bird, pipings } = state;

  const collisitionRange = getCollisitionRange(
    bird.size.width,
    game.size.width,
    pipings.size.width
  );

  const list = pipings.list.filter(piping => {
    return piping.x > collisitionRange.from && piping.x < collisitionRange.to;
  });

  const birdBottom = bird.height;
  const birdTop = bird.height + bird.size.height;

  for (let i = 0, len = list.length; i < len; i += 1) {
    const piping = list[i];
    if (birdBottom < piping.bottom || birdTop > piping.top) {
      return {
        ...state,
        game: {
          ...game,
          status: 'over',
        },
      };
    }
  }
  return state;
};
