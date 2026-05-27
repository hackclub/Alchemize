interface Log {
    status: number, //0 pending, 1 approved, 2 rejected
    timestamp: string,
    deltaTime: number,
    message: string[]
}
function updateLog(log: Log[], deltaTime: number): Log[] {
	//4 cases:
	//1. If the log is empty, create a new log with status pending
	//2. If the last log is approved, create a new log with status pending
	//3. If the last log is rejected, convert that log to pending with the new timestamp and message and add delta time to the exisiting delta time
	//4. If the last log is pending, update the timestamp, message and add delta time to the existing delta time
	if (log.length === 0) {
		return [{
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime,
			message: ["shipped"]
		}]
	}
	const lastLog = log[log.length - 1]
	if (lastLog.status === 1) {
		return [...log, {
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime,
			message: ["shipped"]
		}]
	}
	else if (lastLog.status === 0 || lastLog.status === 2) {
		const newDeltaTime = lastLog.deltaTime + deltaTime
		return [...log.slice(0, -1), {
			...lastLog,
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime: newDeltaTime,
			message: [...lastLog.message, "shipped"]
		}]
	}else{
		return log
	}

}
