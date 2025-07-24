document.addEventListener('DOMContentLoaded', () => {
    const inputMethodRadios = document.querySelectorAll('input[name="inputMethod"]');
    const manualInputDiv = document.getElementById('manualInput');
    const randomInputDiv = document.getElementById('randomInput');

    const numProcessesManualInput = document.getElementById('numProcessesManual');
    const processTableBody = document.querySelector('#processTable tbody');

    const numProcessesRandomInput = document.getElementById('numProcessesRandom');
    const randomProcessPreviewTable = document.getElementById('randomProcessPreviewTable');
    const randomProcessPreviewTableBody = document.querySelector('#randomProcessPreviewTable tbody');

    const algorithmSelect = document.getElementById('algorithmSelect');
    const rrQuantumInputDiv = document.getElementById('rrQuantumInput');
    const rrQuantumInput = document.getElementById('rrTimeQuantum');
    const mlfqQuantumInputDiv = document.getElementById('mlfqQuantumInput');
    const mlfqQ0QuantumInput = document.getElementById('mlfqQ0Quantum');
    const mlfqQ1QuantumInput = document.getElementById('mlfqQ1Quantum');
    const mlfqQ2QuantumInput = document.getElementById('mlfqQ2Quantum');
    const mlfqQ3TypeSelect = document.getElementById('mlfqQ3Type');
    const mlfqQ3QuantumContainer = document.getElementById('mlfqQ3QuantumContainer');
    const mlfqQ3QuantumInput = document.getElementById('mlfqQ3Quantum');
    const contextSwitchTimeInput = document.getElementById('contextSwitchTime');
    const runSimulationButton = document.getElementById('runSimulation');

    const stepControls = document.getElementById('stepControls');
    const prevStepButton = document.getElementById('prevStep');
    const nextStepButton = document.getElementById('nextStep');
    const runAllButton = document.getElementById('runAll');
    const currentTimeDisplay = document.getElementById('currentTimeDisplay');
    const explanationDisplay = document.getElementById('explanationDisplay');
    const processStateTableBody = document.querySelector('#processStateTable tbody');

    const ganttChartContainer = document.getElementById('ganttChart');
    const metricsTableBody = document.querySelector('#metricsTable tbody');
    const avgTurnaroundTimeSpan = document.getElementById('avgTurnaroundTime');
    const avgResponseTimeSpan = document.getElementById('avgResponseTime');
    const mlfqLegendDiv = document.getElementById('mlfqLegend');

    const exportResultsButton = document.getElementById('exportResults');

    let processIdCounter = 1;
    let simulationLog = [];
    let currentStepIndex = 0;
    let finalCompletedProcesses = [];

    // --- Utility Functions ---

    class Process {
        constructor(id, arrivalTime, burstTime) {
            this.id = id;
            this.arrivalTime = arrivalTime;
            this.burstTime = burstTime;
            this.remainingBurstTime = burstTime;
            this.completionTime = 0;
            this.turnaroundTime = 0;
            this.responseTime = -1;
            this.firstExecutionTime = -1;
            this.waitingTime = 0;
            this.currentQueue = 0;
            this.timeInCurrentQueue = 0;
            this.addedToReadyQueue = false;
        }
        clone() {
            const cloned = new Process(this.id, this.arrivalTime, this.burstTime);
            cloned.remainingBurstTime = this.remainingBurstTime;
            cloned.completionTime = this.completionTime;
            cloned.turnaroundTime = this.turnaroundTime;
            cloned.responseTime = this.responseTime;
            cloned.firstExecutionTime = this.firstExecutionTime;
            cloned.waitingTime = this.waitingTime;
            cloned.currentQueue = this.currentQueue;
            cloned.timeInCurrentQueue = this.timeInCurrentQueue;
            cloned.addedToReadyQueue = this.addedToReadyQueue;
            return cloned;
        }
    }

    function populateManualProcesses(num) {
        processTableBody.innerHTML = '';
        for (let i = 0; i < num; i++) {
            const row = processTableBody.insertRow();
            row.innerHTML = `
                <td><input type="text" value="P${i + 1}" readonly></td>
                <td><input type="number" min="0" value="" class="arrival-time"></td>
                <td><input type="number" min="1" value="" class="burst-time"></td>
            `;
        }
    }

    function populateRandomProcesses(num) {
        randomProcessPreviewTableBody.innerHTML = '';
        randomProcessPreviewTable.classList.remove('hidden');
        let tempProcesses = [];
        for (let i = 0; i < num; i++) {
            const pid = `P${i + 1}`;
            const at = Math.floor(Math.random() * 10);
            const bt = Math.floor(Math.random() * 10) + 1;
            tempProcesses.push(new Process(pid, at, bt));
            const row = randomProcessPreviewTableBody.insertRow();
            row.innerHTML = `
                <td>${pid}</td>
                <td>${at}</td>
                <td>${bt}</td>
            `;
        }
        return tempProcesses;
    }

    function getProcessesFromTable(isManual) {
        const processes = [];
        const targetTableBody = isManual ? processTableBody : randomProcessPreviewTableBody;
        const rows = targetTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const pid = isManual ? row.cells[0].querySelector('input').value : row.cells[0].textContent;
            const at = parseInt(isManual ? row.cells[1].querySelector('.arrival-time').value : row.cells[1].textContent);
            const bt = parseInt(isManual ? row.cells[2].querySelector('.burst-time').value : row.cells[2].textContent);
            if (isNaN(at) || isNaN(bt) || at < 0 || bt <= 0) {
                alert(`Invalid input for Process ${pid}. Arrival Time must be non-negative and Burst Time must be positive.`);
                throw new Error("Invalid process data");
            }
            processes.push(new Process(pid, at, bt));
        });
        return processes;
    }

    function displayCurrentProcessStates(processes, currentRunningProcessId = null) {
        processStateTableBody.innerHTML = '';
        processes.sort((a, b) => a.id.localeCompare(b.id));
        processes.forEach(p => {
            const row = processStateTableBody.insertRow();
            if (p.id === currentRunningProcessId) {
                row.classList.add('running-process');
            }
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.arrivalTime}</td>
                <td>${p.burstTime}</td>
                <td>${p.remainingBurstTime}</td>
                <td>${p.currentQueue !== undefined && p.currentQueue !== -1 ? `Q${p.currentQueue}` : 'N/A'}</td>
                <td>${p.firstExecutionTime !== -1 ? 'Yes' : 'No'}</td>
            `;
        });
    }

    function displayFinalMetrics(processes) {
        metricsTableBody.innerHTML = '';
        let totalTurnaroundTime = 0;
        let totalResponseTime = 0;
        processes.sort((a, b) => a.id.localeCompare(b.id));
        processes.forEach(p => {
            p.turnaroundTime = p.completionTime - p.arrivalTime;
            p.responseTime = p.firstExecutionTime !== -1 ? (p.firstExecutionTime - p.arrivalTime) : 0;
            totalTurnaroundTime += p.turnaroundTime;
            totalResponseTime += p.responseTime;
            const row = metricsTableBody.insertRow();
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.arrivalTime}</td>
                <td>${p.burstTime}</td>
                <td>${p.completionTime}</td>
                <td>${p.turnaroundTime}</td>
                <td>${p.responseTime}</td>
            `;
        });
        avgTurnaroundTimeSpan.textContent = (totalTurnaroundTime / processes.length).toFixed(2);
        avgResponseTimeSpan.textContent = (totalResponseTime / processes.length).toFixed(2);
    }

    function exportResultsToFile() {
        if (simulationLog.length === 0 || finalCompletedProcesses.length === 0) {
            alert("No simulation results to export. Please run a simulation first and ensure it completes.");
            return;
        }
        const selectedAlgorithm = algorithmSelect.value;
        const contextSwitchTime = parseInt(contextSwitchTimeInput.value) || 0;
        let csvContent = "";
        csvContent += `CPU Scheduling Simulation Results\n`;
        csvContent += `Algorithm: ${selectedAlgorithm}\n`;
        if (selectedAlgorithm === 'RR') {
            csvContent += `Quantum: ${rrQuantumInput.value}\n`;
        } else if (selectedAlgorithm === 'MLFQ') {
            csvContent += `Q0 Quantum: ${mlfqQ0QuantumInput.value}, Q1 Quantum: ${mlfqQ1QuantumInput.value}, Q2 Quantum: ${mlfqQ2QuantumInput.value}\n`;
            csvContent += `Q3 Type: ${mlfqQ3TypeSelect.value}`;
            if (mlfqQ3TypeSelect.value === 'RR') {
                csvContent += `, Q3 Quantum: ${mlfqQ3QuantumInput.value}\n`;
            } else {
                csvContent += `\n`;
            }
        }
        csvContent += `Context Switch Delay: ${contextSwitchTime} units\n`;
        csvContent += `Date: ${new Date().toLocaleString()}\n\n`;
        csvContent += `"--- Full Gantt Chart ---\n`;
        const ganttText = getPlainTextGanttChart(simulationLog[simulationLog.length - 1].gantt, simulationLog[simulationLog.length - 1].time);
        csvContent += `${ganttText.replace(/"/g, '""').replace(/\n/g, '\\n')}"\n\n`;
        csvContent += `--- Final Process Metrics ---\n`;
        csvContent += `Process ID,Arrival Time,Burst Time,Completion Time,Turnaround Time,Response Time\n`;
        finalCompletedProcesses.sort((a, b) => a.id.localeCompare(b.id));
        finalCompletedProcesses.forEach(p => {
            csvContent += `${p.id},${p.arrivalTime},${p.burstTime},${p.completionTime},${p.turnaroundTime},${p.responseTime}\n`;
        });
        csvContent += `\n`;
        csvContent += `--- Average Metrics ---\n`;
        csvContent += `Average Turnaround Time,${avgTurnaroundTimeSpan.textContent}\n`;
        csvContent += `Average Response Time,${avgResponseTimeSpan.textContent}\n`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `CPU_Scheduling_Results_${selectedAlgorithm}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function getPlainTextGanttChart(ganttData, totalSimulatedTime) {
        if (ganttData.length === 0) {
            return "No Gantt chart activity.";
        }
        const charPerUnit = 4;
        let processLine = '';
        let timeLine = '';
        let lastTimeMarkerPos = 0;
        let currentGraphicalTime = 0;
        ganttData.sort((a, b) => a.startTime - b.startTime);
        ganttData.forEach(entry => {
            if (entry.startTime > currentGraphicalTime) {
                const idleDuration = entry.startTime - currentGraphicalTime;
                const idleWidth = idleDuration * charPerUnit;
                processLine += `|${'Idle'.padEnd(Math.max(4, idleWidth - 1), ' ')}`;
                currentGraphicalTime = entry.startTime;
            }
            const label = entry.processId === 'Context_Switch' ? 'CS' : (entry.queue ? `${entry.processId}(${entry.queue})` : entry.processId);
            const duration = entry.endTime - entry.startTime;
            const blockWidth = duration * charPerUnit;
            const paddedLabel = label.padEnd(Math.max(label.length, blockWidth - 1), ' ');
            processLine += `|${paddedLabel}`;
            const currentMarkerTime = String(entry.startTime);
            const targetPos = entry.startTime * charPerUnit;
            const padding = Math.max(0, targetPos - lastTimeMarkerPos);
            timeLine += ' '.repeat(padding) + currentMarkerTime;
            lastTimeMarkerPos = targetPos + currentMarkerTime.length;
            currentGraphicalTime = entry.endTime;
        });
        processLine += '|';
        const finalTimeMarker = String(totalSimulatedTime);
        const finalTargetPos = totalSimulatedTime * charPerUnit;
        const finalPadding = Math.max(0, finalTargetPos - lastTimeMarkerPos);
        timeLine += ' '.repeat(finalPadding) + finalTimeMarker;
        return `${processLine}\n${timeLine}`;
    }

    function renderStep() {
        if (simulationLog.length === 0) {
            currentTimeDisplay.textContent = '0';
            explanationDisplay.textContent = 'Simulation not yet run.';
            ganttChartContainer.innerHTML = '(No Gantt chart activity yet)';
            processStateTableBody.innerHTML = '';
            metricsTableBody.innerHTML = '';
            avgTurnaroundTimeSpan.textContent = 'N/A';
            avgResponseTimeSpan.textContent = 'N/A';
            exportResultsButton.classList.add('hidden');
            return;
        }
        const currentFrame = simulationLog[currentStepIndex];
        currentTimeDisplay.textContent = currentFrame.time;
        explanationDisplay.textContent = currentFrame.explanation;
        const displayGanttData = JSON.parse(JSON.stringify(currentFrame.gantt));
        if (currentFrame.runningProcessId) {
            let lastGanttEntryForRunningProcess = displayGanttData.find(entry =>
                entry.processId === currentFrame.runningProcessId &&
                entry.endTime === currentFrame.time - 1
            );
            if (lastGanttEntryForRunningProcess) {
                lastGanttEntryForRunningProcess.endTime = currentFrame.time;
            } else {
                const processJustStarted = currentFrame.processes.find(p =>
                    p.id === currentFrame.runningProcessId &&
                    p.firstExecutionTime === currentFrame.time - 1
                );
                if (processJustStarted) {
                    displayGanttData.push({
                        processId: currentFrame.runningProcessId,
                        startTime: currentFrame.time - 1,
                        endTime: currentFrame.time,
                        queue: processJustStarted.currentQueue !== undefined && processJustStarted.currentQueue !== -1 ? `Q${processJustStarted.currentQueue}` : null
                    });
                }
            }
        }
        displayVisualGanttChart(displayGanttData, currentFrame.time);
        displayCurrentProcessStates(currentFrame.processes.map(p => p.clone()), currentFrame.runningProcessId);
        prevStepButton.disabled = currentStepIndex === 0;
        nextStepButton.disabled = currentStepIndex === simulationLog.length - 1;
        runAllButton.disabled = nextStepButton.disabled;
        if (currentStepIndex === simulationLog.length - 1) {
            displayFinalMetrics(finalCompletedProcesses);
            exportResultsButton.classList.remove('hidden');
        } else {
            metricsTableBody.innerHTML = '';
            avgTurnaroundTimeSpan.textContent = 'N/A';
            avgResponseTimeSpan.textContent = 'N/A';
            exportResultsButton.classList.add('hidden');
        }
    }

    // --- Event Listeners for UI ---

    inputMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'manual') {
                manualInputDiv.classList.remove('hidden');
                randomInputDiv.classList.add('hidden');
                randomProcessPreviewTable.classList.add('hidden');
                populateManualProcesses(parseInt(numProcessesManualInput.value));
            } else {
                manualInputDiv.classList.add('hidden');
                randomInputDiv.classList.remove('hidden');
                populateRandomProcesses(parseInt(numProcessesRandomInput.value));
            }
            stepControls.classList.add('hidden');
            simulationLog = [];
            currentStepIndex = 0;
            renderStep();
        });
    });

    numProcessesManualInput.addEventListener('change', () => {
        const num = parseInt(numProcessesManualInput.value);
        if (num >= 1) {
            populateManualProcesses(num);
        } else {
            numProcessesManualInput.value = 1;
            populateManualProcesses(1);
        }
        stepControls.classList.add('hidden');
        simulationLog = [];
        currentStepIndex = 0;
        renderStep();
    });

    numProcessesRandomInput.addEventListener('change', () => {
        const num = parseInt(numProcessesRandomInput.value);
        if (num >= 1) {
            populateRandomProcesses(num);
        } else {
            numProcessesRandomInput.value = 1;
            populateRandomProcesses(1);
        }
        stepControls.classList.add('hidden');
        simulationLog = [];
        currentStepIndex = 0;
        renderStep();
    });

    algorithmSelect.addEventListener('change', () => {
        const selectedAlgo = algorithmSelect.value;
        rrQuantumInputDiv.classList.add('hidden');
        mlfqQuantumInputDiv.classList.add('hidden');
        mlfqLegendDiv.classList.add('hidden');
        if (selectedAlgo === 'RR') {
            rrQuantumInputDiv.classList.remove('hidden');
        } else if (selectedAlgo === 'MLFQ') {
            mlfqQuantumInputDiv.classList.remove('hidden');
            mlfqLegendDiv.classList.remove('hidden');
            if (mlfqQ3TypeSelect.value === 'FCFS') {
                mlfqQ3QuantumContainer.classList.add('hidden');
            } else {
                mlfqQ3QuantumContainer.classList.remove('hidden');
            }
        }
        stepControls.classList.add('hidden');
        simulationLog = [];
        currentStepIndex = 0;
        renderStep();
    });

    mlfqQ3TypeSelect.addEventListener('change', () => {
        if (mlfqQ3TypeSelect.value === 'FCFS') {
            mlfqQ3QuantumContainer.classList.add('hidden');
        } else {
            mlfqQ3QuantumContainer.classList.remove('hidden');
        }
        stepControls.classList.add('hidden');
        simulationLog = [];
        currentStepIndex = 0;
        renderStep();
    });

    prevStepButton.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderStep();
        }
    });

    nextStepButton.addEventListener('click', () => {
        if (currentStepIndex < simulationLog.length - 1) {
            currentStepIndex++;
            renderStep();
        }
    });

    runAllButton.addEventListener('click', () => {
        currentStepIndex = simulationLog.length - 1;
        renderStep();
    });

    exportResultsButton.addEventListener('click', exportResultsToFile);

    runSimulationButton.addEventListener('click', () => {
        let initialProcesses;
        const isManualInput = document.querySelector('input[name="inputMethod"]:checked').value === 'manual';
        try {
            initialProcesses = getProcessesFromTable(isManualInput);
        } catch (e) {
            console.error(e);
            return;
        }
        if (initialProcesses.length === 0) {
            alert("Please add at least one process.");
            return;
        }
        const selectedAlgorithm = algorithmSelect.value;
        const contextSwitchTime = parseInt(contextSwitchTimeInput.value) || 0;
        if (contextSwitchTime < 0) {
            alert("Context Switch Delay cannot be negative.");
            return;
        }
        let result = { completedProcesses: [], gantt: [] };
        simulationLog = [];
        currentStepIndex = 0;
        finalCompletedProcesses = [];
        switch (selectedAlgorithm) {
            case 'FCFS':
                result = runFCFS(initialProcesses, contextSwitchTime);
                break;
            case 'SJF':
                result = runSJF(initialProcesses, contextSwitchTime);
                break;
            case 'SRTF':
                result = runSRTF(initialProcesses, contextSwitchTime);
                break;
            case 'RR':
                const rrQuantum = parseInt(rrQuantumInput.value);
                if (isNaN(rrQuantum) || rrQuantum <= 0) {
                    alert("Please enter a valid (positive) time quantum for Round Robin.");
                    return;
                }
                result = runRR(initialProcesses, rrQuantum, contextSwitchTime);
                break;
            case 'MLFQ':
                const mlfqQuanta = {
                    q0: parseInt(mlfqQ0QuantumInput.value),
                    q1: parseInt(mlfqQ1QuantumInput.value),
                    q2: parseInt(mlfqQ2QuantumInput.value),
                    q3Type: mlfqQ3TypeSelect.value,
                    q3Quantum: parseInt(mlfqQ3QuantumInput.value)
                };
                if (isNaN(mlfqQuanta.q0) || mlfqQuanta.q0 <= 0 ||
                    isNaN(mlfqQuanta.q1) || mlfqQuanta.q1 <= 0 ||
                    isNaN(mlfqQuanta.q2) || mlfqQuanta.q2 <= 0 ||
                    (mlfqQuanta.q3Type === 'RR' && (isNaN(mlfqQuanta.q3Quantum) || mlfqQuanta.q3Quantum <= 0))) {
                    alert("Please enter valid (positive) time quanta for MLFQ queues.");
                    return;
                }
                result = runMLFQ(initialProcesses, mlfqQuanta, contextSwitchTime);
                break;
            default:
                alert("Please select a scheduling algorithm.");
                return;
        }
        finalCompletedProcesses = result.completedProcesses;
        stepControls.classList.remove('hidden');
        renderStep();
    });

    populateManualProcesses(parseInt(numProcessesManualInput.value));
    algorithmSelect.dispatchEvent(new Event('change'));
    renderStep();
    exportResultsButton.classList.add('hidden');

    // --- Scheduling Algorithms ---

    function addFrameToLog(time, processes, gantt, runningProcessId, explanation) {
        simulationLog.push({
            time: time,
            processes: processes.map(p => p.clone()),
            gantt: JSON.parse(JSON.stringify(gantt)),
            runningProcessId: runningProcessId,
            explanation: explanation
        });
    }

    function addContextSwitchToGantt(gantt, currentTime, explanation, processes) {
        const delay = parseInt(contextSwitchTimeInput.value);
        if (delay > 0) {
            const lastEntry = gantt[gantt.length - 1];
            if (lastEntry && lastEntry.processId === 'Context_Switch' && lastEntry.endTime === currentTime) {
                lastEntry.endTime += delay;
            } else {
                gantt.push({ processId: 'Context_Switch', startTime: currentTime, endTime: currentTime + delay, queue: null });
            }
            currentTime += delay;
            addFrameToLog(currentTime, processes, gantt, null, explanation);
        }
        return currentTime;
    }

    function runFCFS(initialProcesses, contextSwitchTime) {
        let processes = initialProcesses.map(p => p.clone());
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        simulationLog = [];
        let gantt = [];
        let currentTime = 0;
        const completedProcesses = [];
        let lastExecutedProcessId = null;
        addFrameToLog(currentTime, processes, gantt, null, "FCFS Simulation starts.");
        while (completedProcesses.length < processes.length) {
            let nextProcess = processes.find(p => p.remainingBurstTime > 0 && p.arrivalTime <= currentTime && !completedProcesses.includes(p));
            if (!nextProcess) {
                const upcomingProcesses = processes.filter(p => p.remainingBurstTime > 0 && !completedProcesses.includes(p));
                if (upcomingProcesses.length === 0) break;
                const nextArrivalTime = Math.min(...upcomingProcesses.map(p => p.arrivalTime));
                let explanation = `CPU is idle. Waiting for next process to arrive at time ${nextArrivalTime}.`;
                while (currentTime < nextArrivalTime) {
                    if (gantt.length > 0 && gantt[gantt.length - 1].processId === 'Idle') {
                        gantt[gantt.length - 1].endTime++;
                    } else {
                        gantt.push({ processId: 'Idle', startTime: currentTime, endTime: currentTime + 1, queue: null });
                    }
                    currentTime++;
                    addFrameToLog(currentTime, processes, gantt, null, explanation);
                }
                lastExecutedProcessId = null;
                continue;
            }
            if (lastExecutedProcessId !== null && lastExecutedProcessId !== nextProcess.id) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Context switch from ${lastExecutedProcessId} to ${nextProcess.id}.`, processes);
            } else if (lastExecutedProcessId === null && currentTime > 0) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Starting execution of ${nextProcess.id} after idle time.`, processes);
            }
            lastExecutedProcessId = nextProcess.id;
            if (nextProcess.firstExecutionTime === -1) {
                nextProcess.firstExecutionTime = currentTime;
                addFrameToLog(currentTime, processes, gantt, nextProcess.id, `Process ${nextProcess.id} arrives and starts execution.`);
            } else {
                addFrameToLog(currentTime, processes, gantt, nextProcess.id, `Process ${nextProcess.id} continues execution.`);
            }
            const burstToExecute = nextProcess.remainingBurstTime;
            for (let i = 0; i < burstToExecute; i++) {
                if (gantt.length > 0 && gantt[gantt.length - 1].processId === nextProcess.id) {
                    gantt[gantt.length - 1].endTime++;
                } else {
                    gantt.push({ processId: nextProcess.id, startTime: currentTime, endTime: currentTime + 1, queue: null });
                }
                nextProcess.remainingBurstTime--;
                currentTime++;
                addFrameToLog(currentTime, processes, gantt, nextProcess.id, `Process ${nextProcess.id} executing. Remaining: ${nextProcess.remainingBurstTime}`);
            }
            nextProcess.completionTime = currentTime;
            completedProcesses.push(nextProcess);
            addFrameToLog(currentTime, processes, gantt, null, `Process ${nextProcess.id} completed.`);
        }
        finalCompletedProcesses = completedProcesses;
        return { completedProcesses, gantt };
    }

    function runSJF(initialProcesses, contextSwitchTime) {
        let processes = initialProcesses.map(p => p.clone());
        simulationLog = [];
        let gantt = [];
        let currentTime = 0;
        const completedProcesses = [];
        let lastExecutedProcessId = null;
        addFrameToLog(currentTime, processes, gantt, null, "SJF Simulation starts.");
        while (completedProcesses.length < processes.length) {
            const availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && p.remainingBurstTime > 0);
            if (availableProcesses.length === 0) {
                const upcomingProcesses = processes.filter(p => p.remainingBurstTime > 0);
                if (upcomingProcesses.length === 0) break;
                const nextArrivalTime = Math.min(...upcomingProcesses.map(p => p.arrivalTime));
                let explanation = `CPU is idle. Waiting for next process to arrive at time ${nextArrivalTime}.`;
                while (currentTime < nextArrivalTime) {
                    if (gantt.length > 0 && gantt[gantt.length - 1].processId === 'Idle') {
                        gantt[gantt.length - 1].endTime++;
                    } else {
                        gantt.push({ processId: 'Idle', startTime: currentTime, endTime: currentTime + 1, queue: null });
                    }
                    currentTime++;
                    addFrameToLog(currentTime, processes, gantt, null, explanation);
                }
                lastExecutedProcessId = null;
                continue;
            }
            availableProcesses.sort((a, b) => {
                if (a.burstTime === b.burstTime) {
                    return a.arrivalTime - b.arrivalTime;
                }
                return a.burstTime - b.burstTime;
            });
            const selectedProcess = availableProcesses[0];
            if (lastExecutedProcessId !== null && lastExecutedProcessId !== selectedProcess.id) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Context switch from ${lastExecutedProcessId} to ${selectedProcess.id}.`, processes);
            } else if (lastExecutedProcessId === null && currentTime > 0) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Starting execution of ${selectedProcess.id} after idle time.`, processes);
            }
            lastExecutedProcessId = selectedProcess.id;
            if (selectedProcess.firstExecutionTime === -1) {
                selectedProcess.firstExecutionTime = currentTime;
                addFrameToLog(currentTime, processes, gantt, selectedProcess.id, `Process ${selectedProcess.id} (SJF) starts execution.`);
            } else {
                addFrameToLog(currentTime, processes, gantt, selectedProcess.id, `Process ${selectedProcess.id} (SJF) continues execution.`);
            }
            const executionDuration = selectedProcess.remainingBurstTime;
            for (let i = 0; i < executionDuration; i++) {
                if (gantt.length > 0 && gantt[gantt.length - 1].processId === selectedProcess.id) {
                    gantt[gantt.length - 1].endTime++;
                } else {
                    gantt.push({ processId: selectedProcess.id, startTime: currentTime, endTime: currentTime + 1, queue: null });
                }
                selectedProcess.remainingBurstTime--;
                currentTime++;
                let explanation = `Process ${selectedProcess.id} executing. Remaining: ${selectedProcess.remainingBurstTime}`;
                addFrameToLog(currentTime, processes, gantt, selectedProcess.id, explanation);
            }
            selectedProcess.completionTime = currentTime;
            completedProcesses.push(selectedProcess);
            addFrameToLog(currentTime, processes, gantt, null, `Process ${selectedProcess.id} (SJF) completed.`);
        }
        finalCompletedProcesses = completedProcesses;
        return { completedProcesses, gantt };
    }

    function runSRTF(initialProcesses, contextSwitchTime) {
        let processes = initialProcesses.map(p => p.clone());
        simulationLog = [];
        let gantt = [];
        let currentTime = 0;
        const completedProcesses = [];
        let currentRunningProcess = null;
        let lastExecutedProcessId = null;
        addFrameToLog(currentTime, processes, gantt, null, "SRTF Simulation starts.");
        while (completedProcesses.length < processes.length) {
            const availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && p.remainingBurstTime > 0);
            let bestCandidate = null;
            if (availableProcesses.length > 0) {
                availableProcesses.sort((a, b) => {
                    if (a.remainingBurstTime === b.remainingBurstTime) {
                        return a.arrivalTime - b.arrivalTime;
                    }
                    return a.remainingBurstTime - b.remainingBurstTime;
                });
                bestCandidate = availableProcesses[0];
            }
            let explanation = '';
            let prevRunningProcessId = currentRunningProcess ? currentRunningProcess.id : null;
            if (bestCandidate === null && currentRunningProcess === null) {
                const upcomingProcesses = processes.filter(p => p.remainingBurstTime > 0);
                if (upcomingProcesses.length === 0) break;
                const nextArrivalTime = Math.min(...upcomingProcesses.map(p => p.arrivalTime));
                explanation = `CPU is idle. Waiting for next process to arrive at time ${nextArrivalTime}.`;
                while (currentTime < nextArrivalTime) {
                    if (gantt.length > 0 && gantt[gantt.length - 1].processId === 'Idle') {
                        gantt[gantt.length - 1].endTime++;
                    } else {
                        gantt.push({ processId: 'Idle', startTime: currentTime, endTime: currentTime + 1, queue: null });
                    }
                    currentTime++;
                    addFrameToLog(currentTime, processes, gantt, null, explanation);
                }
                lastExecutedProcessId = null;
                continue;
            }
            if (currentRunningProcess === null ||
                (bestCandidate && bestCandidate.id !== currentRunningProcess.id &&
                 bestCandidate.remainingBurstTime < currentRunningProcess.remainingBurstTime)) {
                if (prevRunningProcessId !== null && bestCandidate && prevRunningProcessId !== bestCandidate.id) {
                    currentTime = addContextSwitchToGantt(gantt, currentTime, `Context switch from ${prevRunningProcessId} to ${bestCandidate.id} (preemption).`, processes);
                    explanation = `Process ${prevRunningProcessId} preempted by Process ${bestCandidate.id}.`;
                } else if (prevRunningProcessId === null && bestCandidate && currentTime > 0) {
                    currentTime = addContextSwitchToGantt(gantt, currentTime, `Starting execution of ${bestCandidate.id} after idle time.`, processes);
                    explanation = `Process ${bestCandidate.id} starts execution.`;
                }
                currentRunningProcess = bestCandidate;
                lastExecutedProcessId = currentRunningProcess ? currentRunningProcess.id : null;
            } else if (currentRunningProcess) {
                explanation = `Process ${currentRunningProcess.id} continues execution.`;
            }
            if (currentRunningProcess) {
                if (currentRunningProcess.firstExecutionTime === -1) {
                    currentRunningProcess.firstExecutionTime = currentTime;
                }
                const lastEntry = gantt[gantt.length - 1];
                if (lastEntry && lastEntry.processId === currentRunningProcess.id && lastEntry.endTime === currentTime) {
                    lastEntry.endTime++;
                } else {
                    gantt.push({ processId: currentRunningProcess.id, startTime: currentTime, endTime: currentTime + 1, queue: null });
                }
                currentRunningProcess.remainingBurstTime--;
                currentTime++;
                lastExecutedProcessId = currentRunningProcess.id;
                if (currentRunningProcess.remainingBurstTime === 0) {
                    currentRunningProcess.completionTime = currentTime;
                    completedProcesses.push(currentRunningProcess);
                    addFrameToLog(currentTime, processes, gantt, null, `Process ${currentRunningProcess.id} completed.`);
                    currentRunningProcess = null;
                    lastExecutedProcessId = null;
                } else {
                    addFrameToLog(currentTime, processes, gantt, currentRunningProcess.id, explanation);
                }
            } else {
                currentTime++;
                addFrameToLog(currentTime, processes, gantt, null, "CPU is idle (unexpected advancement).");
                lastExecutedProcessId = null;
            }
        }
        finalCompletedProcesses = completedProcesses;
        return { completedProcesses, gantt };
    }

    function runRR(initialProcesses, quantum, contextSwitchTime) {
        let processes = initialProcesses.map(p => p.clone());
        simulationLog = [];
        let gantt = [];
        let currentTime = 0;
        const completedProcesses = [];
        const readyQueue = [];
        processes.forEach(p => p.addedToReadyQueue = false);
        addFrameToLog(currentTime, processes, gantt, null, "Round Robin Simulation starts.");
        let lastExecutedProcessId = null;
        while (completedProcesses.length < processes.length) {
            processes.forEach(p => {
                if (p.arrivalTime <= currentTime && p.remainingBurstTime > 0 && !p.addedToReadyQueue) {
                    readyQueue.push(p);
                    p.addedToReadyQueue = true;
                }
            });
            readyQueue.sort((a, b) => {
                if (a.arrivalTime === b.arrivalTime) return a.id.localeCompare(b.id);
                return a.arrivalTime - b.arrivalTime;
            });
            let currentProcess = null;
            if (readyQueue.length > 0) {
                currentProcess = readyQueue.shift();
            }
            if (!currentProcess) {
                const upcomingProcesses = processes.filter(p => p.remainingBurstTime > 0 && !p.addedToReadyQueue);
                if (upcomingProcesses.length === 0 && readyQueue.length === 0) break;
                const nextArrivalTime = upcomingProcesses.length > 0 ? Math.min(...upcomingProcesses.map(p => p.arrivalTime)) : Infinity;
                let explanation = `CPU is idle. Waiting for next process to arrive at time ${nextArrivalTime}.`;
                while (currentTime < nextArrivalTime) {
                    processes.forEach(p => {
                        if (p.arrivalTime === currentTime + 1 && p.remainingBurstTime > 0 && !p.addedToReadyQueue) {
                            readyQueue.push(p);
                            p.addedToReadyQueue = true;
                            readyQueue.sort((a, b) => {
                                if (a.arrivalTime === b.arrivalTime) return a.id.localeCompare(b.id);
                                return a.arrivalTime - b.arrivalTime;
                            });
                        }
                    });
                    if (readyQueue.length > 0) {
                        break;
                    }
                    if (gantt.length > 0 && gantt[gantt.length - 1].processId === 'Idle') {
                        gantt[gantt.length - 1].endTime++;
                    } else {
                        gantt.push({ processId: 'Idle', startTime: currentTime, endTime: currentTime + 1, queue: null });
                    }
                    currentTime++;
                    addFrameToLog(currentTime, processes, gantt, null, explanation);
                }
                lastExecutedProcessId = null;
                continue;
            }
            if (lastExecutedProcessId !== null && lastExecutedProcessId !== currentProcess.id) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Context switch from ${lastExecutedProcessId} to ${currentProcess.id}.`, processes);
            } else if (lastExecutedProcessId === null && currentTime > 0) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Starting execution of ${currentProcess.id} after idle time.`, processes);
            }
            lastExecutedProcessId = currentProcess.id;
            if (currentProcess.firstExecutionTime === -1) {
                currentProcess.firstExecutionTime = currentTime;
                addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${currentProcess.id} (RR) starts execution.`);
            } else {
                addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${currentProcess.id} (RR) resumes execution.`);
            }
            let executedTimeThisSlice = 0;
            while (executedTimeThisSlice < quantum && currentProcess.remainingBurstTime > 0) {
                processes.forEach(p => {
                    if (p.arrivalTime === currentTime + 1 && p.remainingBurstTime > 0 && !p.addedToReadyQueue) {
                        readyQueue.push(p);
                        p.addedToReadyQueue = true;
                        readyQueue.sort((a, b) => {
                            if (a.arrivalTime === b.arrivalTime) return a.id.localeCompare(b.id);
                            return a.arrivalTime - b.arrivalTime;
                        });
                        addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${p.id} arrives and joins ready queue.`);
                    }
                });
                if (gantt.length > 0 && gantt[gantt.length - 1].processId === currentProcess.id) {
                    gantt[gantt.length - 1].endTime++;
                } else {
                    gantt.push({ processId: currentProcess.id, startTime: currentTime, endTime: currentTime + 1, queue: null });
                }
                currentProcess.remainingBurstTime--;
                currentTime++;
                executedTimeThisSlice++;
                if (currentProcess.remainingBurstTime === 0) {
                    break;
                }
                addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${currentProcess.id} executing. Quantum remaining: ${quantum - executedTimeThisSlice}, Burst remaining: ${currentProcess.remainingBurstTime}`);
            }
            if (currentProcess.remainingBurstTime === 0) {
                currentProcess.completionTime = currentTime;
                completedProcesses.push(currentProcess);
                addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} (RR) completed.`);
            } else {
                readyQueue.push(currentProcess);
                addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} (RR) quantum expired. Moving to end of queue.`);
            }
        }
        finalCompletedProcesses = completedProcesses;
        return { completedProcesses, gantt };
    }

    function runMLFQ(initialProcesses, quanta, contextSwitchTime) {
        let processes = initialProcesses.map(p => p.clone());
        simulationLog = [];
        let gantt = [];
        let currentTime = 0;
        const completedProcesses = [];
        const queues = [[], [], [], []];
        processes.forEach(p => {
            p.currentQueue = -1;
            p.timeInCurrentQueue = 0;
            p.addedToReadyQueue = false;
        });
        const q0Quantum = parseInt(quanta.q0);
        const q1Quantum = parseInt(quanta.q1);
        const q2Quantum = parseInt(quanta.q2);
        const q3Type = quanta.q3Type;
        const q3Quantum = parseInt(quanta.q3Quantum);
        addFrameToLog(currentTime, processes, gantt, null, "MLFQ Simulation starts.");
        let lastExecutedProcessId = null;
        while (completedProcesses.length < processes.length) {
            processes.forEach(p => {
                if (p.arrivalTime <= currentTime && p.remainingBurstTime > 0 && !p.addedToReadyQueue) {
                    queues[0].push(p);
                    p.addedToReadyQueue = true;
                    p.currentQueue = 0;
                    p.timeInCurrentQueue = 0;
                    addFrameToLog(currentTime, processes, gantt, null, `Process ${p.id} arrives and enters Q0.`);
                }
            });
            queues.forEach(q => q.sort((a, b) => a.id.localeCompare(b.id)));
            let currentProcess = null;
            let currentQueueIndex = -1;
            for (let i = 0; i < queues.length; i++) {
                queues[i] = queues[i].filter(p => p.remainingBurstTime > 0 && p.arrivalTime <= currentTime);
                if (queues[i].length > 0) {
                    currentProcess = queues[i].shift();
                    currentQueueIndex = i;
                    break;
                }
            }
            if (!currentProcess) {
                const upcomingProcesses = processes.filter(p => p.remainingBurstTime > 0 && !p.addedToReadyQueue);
                if (upcomingProcesses.length === 0 && completedProcesses.length === processes.length) break;
                const nextArrivalTime = upcomingProcesses.length > 0 ? Math.min(...upcomingProcesses.map(p => p.arrivalTime)) : Infinity;
                let explanation = `CPU is idle. Waiting for next process to arrive at time ${nextArrivalTime}.`;
                while (currentTime < nextArrivalTime) {
                    processes.forEach(p => {
                        if (p.arrivalTime === currentTime + 1 && p.remainingBurstTime > 0 && !p.addedToReadyQueue) {
                            queues[0].push(p);
                            p.addedToReadyQueue = true;
                            p.currentQueue = 0;
                            p.timeInCurrentQueue = 0;
                            addFrameToLog(currentTime, processes, gantt, null, `Process ${p.id} arrives during idle, added to Q0.`);
                        }
                    });
                    if (queues[0].length > 0 || queues[1].length > 0 || queues[2].length > 0 || queues[3].length > 0) {
                        break;
                    }
                    if (gantt.length > 0 && gantt[gantt.length - 1].processId === 'Idle') {
                        gantt[gantt.length - 1].endTime++;
                    } else {
                        gantt.push({ processId: 'Idle', startTime: currentTime, endTime: currentTime + 1, queue: null });
                    }
                    currentTime++;
                    addFrameToLog(currentTime, processes, gantt, null, explanation);
                }
                lastExecutedProcessId = null;
                continue;
            }
            if (lastExecutedProcessId !== null && lastExecutedProcessId !== currentProcess.id) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Context switch from ${lastExecutedProcessId} to ${currentProcess.id} (from Q${currentQueueIndex}).`, processes);
            } else if (lastExecutedProcessId === null && currentTime > 0) {
                currentTime = addContextSwitchToGantt(gantt, currentTime, `Starting execution of ${currentProcess.id} (from Q${currentQueueIndex}) after idle time.`, processes);
            }
            lastExecutedProcessId = currentProcess.id;
            if (currentProcess.firstExecutionTime === -1) {
                currentProcess.firstExecutionTime = currentTime;
                addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${currentProcess.id} starts execution from Q${currentQueueIndex}.`);
            } else {
                addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${currentProcess.id} resumes execution from Q${currentQueueIndex}.`);
            }
            let timeQuantumToUse;
            switch (currentQueueIndex) {
                case 0: timeQuantumToUse = q0Quantum; break;
                case 1: timeQuantumToUse = q1Quantum; break;
                case 2: timeQuantumToUse = q2Quantum; break;
                case 3:
                    if (q3Type === 'RR') {
                        timeQuantumToUse = q3Quantum;
                    } else {
                        timeQuantumToUse = currentProcess.remainingBurstTime;
                    }
                    break;
            }
            let executedTimeThisSlice = 0;
            let preemptedByHigherPriority = false;
            for (let i = 0; i < timeQuantumToUse; i++) {
                processes.forEach(p => {
                    if (p.arrivalTime === currentTime + 1 && p.remainingBurstTime > 0 && !p.addedToReadyQueue) {
                        queues[0].push(p);
                        p.addedToReadyQueue = true;
                        p.currentQueue = 0;
                        p.timeInCurrentQueue = 0;
                        addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${p.id} arrives and enters Q0.`);
                    }
                });
                for (let q = 0; q < currentQueueIndex; q++) {
                    if (queues[q].filter(p => p.remainingBurstTime > 0 && p.arrivalTime <= currentTime).length > 0) {
                        preemptedByHigherPriority = true;
                        break;
                    }
                }
                if (preemptedByHigherPriority) {
                    queues[currentQueueIndex].unshift(currentProcess);
                    addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} (Q${currentQueueIndex}) preempted by higher priority process.`);
                    break;
                }
                const lastEntry = gantt[gantt.length - 1];
                const queueLabel = `Q${currentQueueIndex}`;
                if (lastEntry && lastEntry.processId === currentProcess.id && lastEntry.endTime === currentTime && lastEntry.queue === queueLabel) {
                    lastEntry.endTime++;
                } else {
                    gantt.push({ processId: currentProcess.id, startTime: currentTime, endTime: currentTime + 1, queue: queueLabel });
                }
                currentProcess.remainingBurstTime--;
                currentProcess.timeInCurrentQueue++;
                currentTime++;
                executedTimeThisSlice++;
                if (currentProcess.remainingBurstTime === 0) {
                    break;
                }
                addFrameToLog(currentTime, processes, gantt, currentProcess.id, `Process ${currentProcess.id} executing in Q${currentQueueIndex}. Remaining: ${currentProcess.remainingBurstTime}`);
            }
            if (currentProcess.remainingBurstTime === 0) {
                currentProcess.completionTime = currentTime;
                completedProcesses.push(currentProcess);
                addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} (Q${currentQueueIndex}) completed.`);
            } else if (!preemptedByHigherPriority) {
                if (currentQueueIndex < queues.length - 1) {
                    currentProcess.currentQueue++;
                    currentProcess.timeInCurrentQueue = 0;
                    queues[currentProcess.currentQueue].push(currentProcess);
                    addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} quantum expired in Q${currentQueueIndex}. Demoted to Q${currentProcess.currentQueue}.`);
                } else {
                    if (q3Type === 'RR') {
                        queues[currentQueueIndex].push(currentProcess);
                        addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} quantum expired in Q3. Re-added to Q3.`);
                    } else {
                        addFrameToLog(currentTime, processes, gantt, null, `Process ${currentProcess.id} (Q3 FCFS) preempted, returns to Q3.`);
                        queues[currentQueueIndex].unshift(currentProcess);
                    }
                }
            }
        }
        finalCompletedProcesses = completedProcesses;
        return { completedProcesses, gantt };
    }

    function displayVisualGanttChart(ganttData, currentSimulatedTime) {
        ganttChartContainer.innerHTML = '';
        if (ganttData.length === 0) {
            ganttChartContainer.textContent = "(No Gantt chart activity yet)";
            return;
        }
        const totalSimulatedTime = simulationLog.length > 0 ? simulationLog[simulationLog.length - 1].time : 1;
        const containerWidth = ganttChartContainer.offsetWidth > 0 ? ganttChartContainer.offsetWidth : 800;
        const minPixelPerUnit = 25;
        const maxPixels = Math.max(containerWidth, totalSimulatedTime * minPixelPerUnit);
        let processBlocksHtml = '<div class="gantt-row">';
        let timeMarkersHtml = '<div class="gantt-time-line">';
        let currentTimeInGantt = 0;
        const drawnTimeMarkers = new Set();
        ganttData.sort((a, b) => a.startTime - b.startTime);
        ganttData.forEach(entry => {
            if (entry.startTime > currentTimeInGantt) {
                const idleDuration = entry.startTime - currentTimeInGantt;
                const idleBlockWidth = (idleDuration / totalSimulatedTime) * maxPixels;
                processBlocksHtml += `<div class="gantt-block gantt-Idle" style="width: ${idleBlockWidth}px;">Idle</div>`;
                currentTimeInGantt = entry.startTime;
            }
            const duration = entry.endTime - entry.startTime;
            if (duration <= 0) {
                return;
            }
            const blockWidth = (duration / totalSimulatedTime) * maxPixels;
            let className = '';
            let label = entry.processId;
            let tooltip = `Process: ${entry.processId}\nStart: ${entry.startTime}\nEnd: ${entry.endTime}\nDuration: ${duration}`;
            let backgroundColor = '';
            if (entry.processId === 'Idle') {
                className = 'gantt-Idle';
                label = 'Idle';
            } else if (entry.processId === 'Context_Switch') {
                className = 'gantt-context-switch';
                label = 'CS';
                tooltip = `Context Switch\nStart: ${entry.startTime}\nEnd: ${entry.endTime}\nDuration: ${duration}`;
            } else {
                if (entry.queue) {
                    className = `mlfq-${entry.queue.toLowerCase()}`;
                    tooltip += `\nQueue: ${entry.queue}`;
                } else {
                    const processNumber = parseInt(entry.processId.replace('P', ''));
                    const hue = (processNumber * 137) % 360;
                    backgroundColor = `hsl(${hue}, 70%, 60%)`;
                }
                label = entry.processId;
            }
            processBlocksHtml += `<div class="gantt-block ${className}" style="width: ${blockWidth}px; ${backgroundColor ? `background-color: ${backgroundColor};` : ''}" title="${tooltip}">${label}</div>`;
            if (!drawnTimeMarkers.has(entry.startTime)) {
                const leftPosition = (entry.startTime / totalSimulatedTime) * maxPixels;
                timeMarkersHtml += `<span class="time-marker" style="left: ${leftPosition}px;">${entry.startTime}</span>`;
                drawnTimeMarkers.add(entry.startTime);
            }
            currentTimeInGantt = entry.endTime;
        });
        if (!drawnTimeMarkers.has(currentSimulatedTime)) {
            const leftPosition = (currentSimulatedTime / totalSimulatedTime) * maxPixels;
            timeMarkersHtml += `<span class="time-marker" style="left: ${leftPosition}px;">${currentSimulatedTime}</span>`;
            drawnTimeMarkers.add(currentSimulatedTime);
        }
        processBlocksHtml += '</div>';
        timeMarkersHtml += '</div>';
        ganttChartContainer.innerHTML = processBlocksHtml + timeMarkersHtml;
        const scrollPosition = (currentSimulatedTime / totalSimulatedTime) * maxPixels - (containerWidth / 2);
        ganttChartContainer.scrollLeft = scrollPosition;
    }
});
