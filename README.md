# **CPU Scheduling Simulator** 

## **Project Overview**

This project I made is a web-based CPU Scheduling Simulator designed to visualize and analyze various process scheduling algorithms. It provides a graphical user interface (GUI) that allows users to define processes manually or generate them randomly, select a scheduling algorithm, and observe the simulation step-by-step. The simulator displays a dynamic Gantt chart, real-time process states, and calculates key performance metrics such as completion time, turnaround time, and response time. It also includes configurable options for time quanta (for Round Robin and MLFQ) and a context switching delay.

## **How to Run the Simulation**

To run this simulation, follow these simple steps:

1. **Save Files:** Ensure you have the following three files saved in the **same directory**:  
   * index.html  
   * script.js  
   * style.css  
2. **Open in Browser:** Open the index.html file using any modern web browser (e.g., Chrome, Firefox, Edge).  
3. **Interact:** The simulator's GUI will load. You can then:  
   * Choose between "Manual Input" or "Random Generator" for processes.  
   * Enter process details (Process ID, Arrival Time, Burst Time) manually or specify the number of random processes.  
   * Select a CPU scheduling algorithm from the dropdown.  
   * Adjust algorithm-specific settings (e.g., Round Robin Time Quantum, MLFQ Quantum settings for Q0, Q1, Q2, and Q3 type/quantum).  
   * **Set the "Context Switch Delay (ms)"** to simulate overhead during process switches.  
   * Click "Run Simulation" to start.  
   * Use "Previous Step", "Next Step", and "Run All" buttons to control the simulation flow.  
   * Click "Export Results" to download a CSV file of the simulation data.

## **Scheduling Algorithms Implemented**

The simulator implements the following common CPU scheduling policies:

1. **First-Come, First-Served (FCFS):**  
   * **Description:** A non-preemptive scheduling algorithm where the process that requests the CPU first is allocated the CPU first. It's simple to implement but can lead to long waiting times for short processes if a long process arrives first.  
   * **Behavior:** Processes are executed in the order of their arrival. If processes arrive at the same time, their order is determined by their Process ID (lexicographical sort).

2. **Shortest Job First (SJF):**  
   * **Description:** A non-preemptive scheduling algorithm that selects the process with the smallest burst time for execution from the available processes. It provides the minimum average waiting time for a given set of processes.  
   * **Behavior:** Once a process starts, it runs to completion. Ties in burst time are broken by arrival time (FCFS).

3. **Shortest Remaining Time First (SRTF):**  
   * **Description:** The preemptive version of SJF. The CPU is allocated to the process with the smallest remaining burst time. If a new process arrives with a shorter burst time than the currently executing process, the current process is preempted.  
   * **Behavior:** The scheduler continuously checks for new arrivals and preempts the running process if a new process has a shorter remaining burst time.

4. **Round Robin (RR):**  
   * **Description:** A preemptive scheduling algorithm designed for time-sharing systems. Each process is given a small unit of CPU time, called a time quantum. If the process does not complete within this quantum, it is preempted and added to the end of the ready queue.  
   * **Behavior:** Processes are executed in a cyclic manner. The time quantum is configurable by the user.

5. **Multilevel Feedback Queue (MLFQ):**  
   * **Description:** A more complex scheduling algorithm that uses multiple queues, each with its own scheduling algorithm and priority level. Processes can move between queues based on their CPU burst characteristics (e.g., demoted if they use their full quantum, potentially promoted if they wait too long). This aims to favor short, interactive jobs while also handling long, CPU-bound jobs.  
   * **Behavior:**  
     * **4 Priority Levels:** Q0 (highest priority), Q1, Q2, Q3 (lowest priority).  
     * **Q0, Q1, Q2:** Use Round Robin with configurable time quanta.  
     * **Q3:** Can be configured as either FCFS or Round Robin with its own quantum.  
     * **Demotion:** Processes are demoted to the next lower-priority queue if they use their entire time quantum.  
     * **Preemption:** Higher-priority queues always preempt lower-priority queues.  
     * **Aging:** (Not explicitly implemented in this basic version, but typical for MLFQ to prevent starvation).

   

## **Screenshots / Output Examples**

### **Main GUI (Initial State)**

**Simulation in Progress (e.g., RR)**

## **Sample Input and Expected Output (FCFS with Context Switch)**

**Sample Input:**

* **Process Input Method:** Manual Input  
* **Number of Processes:** 3  
  * P1: Arrival Time \= 0, Burst Time \= 5  
  * P2: Arrival Time \= 1, Burst Time \= 3  
  * P3: Arrival Time \= 2, Burst Time \= 8  
* **Scheduling Algorithm:** First-Come, First-Served (FCFS)  
* **Context Switch Delay (ms):** 1

**Expected Output:**

| P1 | Context Switch | P2 | Context Switch | P3 |
| ----- | ----- | ----- | ----- | ----- |
| 0                            | 5             | 6 | 9 | 10                                    18 |

**Expected Output (Final Process Metrics):**

| Process ID | Arrival Time | Burst Time | Completion Time | Turnaround Time | Response Time |
| ----- | ----- | ----- | ----- | ----- | ----- |
| P1 | 0 | 5 | 5 | 5 | 0 |
| P2 | 1 | 3 | 9 | 8 | 5 |
| P3 | 2 | 8 | 18 | 16 | 8 |

**Expected Average Metrics:**

* Average Turnaround Time: (5 \+ 8 \+ 16\) / 3 \= **9.67**  
* Average Response Time: (0 \+ 5 \+ 8\) / 3 \= **4.33**

## **Known Bugs, Limitations, and Incomplete Features** 

* **MLFQ Aging:** The current MLFQ implementation does not include an explicit “aging” mechanism to promote processes that have been waiting too long in lower-priority queues. This can lead to starvation for processes that get stuck in Q3.

* **I/O Operations:** As per the project assumptions, processes are strictly CPU-bound. There is no simulation of I/O operations or processes voluntarily yielding the CPU.

* **Input Validation:** While basic checks for non-negative arrival times and positive burst times are in place, comprehensive input validation (e.g., preventing non-numeric input in number fields) is not fully implemented. The assumption is that user input is generally valid (it won’t run though).

* **Gantt Chart Scaling:** For very long simulations with many time units, the text-based Gantt chart might become excessively wide, requiring horizontal scrolling. The visual Gantt chart attempts to scale but might still be constrained by screen width.

* **MLFQ Preemption Logic Refinement:** While preemption by higher-priority arrivals is implemented, the MLFQ logic for re-queuing preempted processes (especially when they don't use their full quantum) could be further refined for edge cases. Currently, it assumes the unshift mechanism handles this correctly.

* **MLFQ Queue Sorting:** Queues are sorted by Process ID for consistent display, but for scheduling, they primarily operate based on FIFO within their quantum-based RR or FCFS rules. Tie-breaking for processes arriving at the exact same time needs to be consistent (currently relies on initial sort and queue order).