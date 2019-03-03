// recorder
function getInitialRecord() {
    return {
        history: [],
        isRecording: false,
        shouldStop: false,
    }
}

let record = getInitialRecord()
let render = () => {}

export function getRecord() {
    return record
}

export function start() {
    record = getInitialRecord()
}

export function stop() {
    record.shouldStop = true
}

export function setRender(renderFunction) {
    render = renderFunction
}

export function finish() {
    record.isRecording = true
}

export function save(state) {
    if (record.isRecording) {
        return
    }
    record.history.push(state)
}

export function replay() {
    let { history } = record
    let count = 0
    let read = () => {
        if (record.shouldStop && count < 30) {
          record.shouldStop = false;
        }
        if (record.shouldStop) {
          record.shouldStop = false;
          render(history[history.length - 1]);
          return
        }
        if (count >= history.length) {
            return
        }
        render(history[count])
        count += 1
        requestAnimationFrame(read)
    }
    read()
}

export function reverse() {
    let { history } = record
    let count = 0
    let read = () => {
        if (record.shouldStop && count < 30) {
          record.shouldStop = false;
        }
        if (record.shouldStop) {
          record.shouldStop = false;
          render(history[history.length - 1]);
          return
        }
        if (count >= history.length) {
            record.shouldStop = false;
            render(history[history.length - 1])
            return
        }
        render(history[history.length - 1 - count])
        count += 1
        requestAnimationFrame(read)
    }
    read()
}
