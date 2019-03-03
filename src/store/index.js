import { createStore } from 'relite';
import * as actions from './actions';

export default initialState => {
  // Object check in relite fails because actions is a module
  return createStore({ ...actions }, initialState);
};
