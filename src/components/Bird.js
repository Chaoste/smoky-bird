import React from 'react'

const getRotate = (status) => {
	if (status === 'up') {
		return -40
	} else if (status === 'down') {
		return 40
	}
	return 0
}

export const Bird = (props) => {
	let { status, height = 0 } = props  // isFlying is not used
  const style = {
  	transform: `translate(0, ${-height}px) rotate(${getRotate(status)}deg)`
  }
	const statusClass = 'up' ? status === 'up' : 'down' ? status === 'down' : ''
	return (
		<div className={`bird ${statusClass}`} style={style}></div>
	)
}

export default Bird;
