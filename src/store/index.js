import { createStore } from 'relite'
import * as actions from './actions'

export default (initialState) => {
    return createStore(actions, initialState)
}
