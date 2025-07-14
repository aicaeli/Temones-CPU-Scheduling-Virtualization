import java.util.*;

class Process {
    int pid, arrival, burst, remaining, completion, turnaround, response, started = -1, queueLevel = 0;

    Process(int pid, int arrival, int burst) {
        this.pid = pid;
        this.arrival = arrival;
        this.burst = burst;
        this.remaining = burst;
    }
}

public class Main {
    static Scanner sc = new Scanner(System.in);
    static List<Process> processes = new ArrayList<>();
    static int quantum = 2;
    static final int MAX_QUEUE_LEVELS = 4;

    public static void inputProcesses() {
        System.out.print("Enter number of processes: ");
        int n = sc.nextInt();
        processes.clear();
        for (int i = 0; i < n; i++) {
            System.out.println("\nProcess P" + (i + 1));
            System.out.print("Arrival Time: ");
            int at = sc.nextInt();
            System.out.print("Burst Time: ");
            int bt = sc.nextInt();
            processes.add(new Process(i + 1, at, bt));
        }
    }

    public static void displayMetrics(List<Process> plist) {
        float totalTAT = 0, totalRT = 0;
        System.out.println("\nPID\tAT\tBT\tCT\tTAT\tRT");
        for (Process p : plist) {
            p.turnaround = p.completion - p.arrival;
            p.response = p.started - p.arrival;
            totalTAT += p.turnaround;
            totalRT += p.response;
            System.out.printf("P%d\t%d\t%d\t%d\t%d\t%d\n",
                    p.pid, p.arrival, p.burst, p.completion, p.turnaround, p.response);
        }
        System.out.printf("\nAverage Turnaround Time: %.2f\n", totalTAT / plist.size());
        System.out.printf("Average Response Time: %.2f\n", totalRT / plist.size());
    }

    public static void fcfs() {
        List<Process> plist = cloneProcesses();
        int time = 0;
        System.out.println("\nGantt Chart:");
        for (Process p : plist) {
            if (time < p.arrival) time = p.arrival;
            p.started = time;
            System.out.printf("| P%d (%d-%d) ", p.pid, time, time + p.burst);
            time += p.burst;
            p.completion = time;
        }
        System.out.println("|");
        displayMetrics(plist);
    }

    public static void sjf() {
        List<Process> plist = cloneProcesses();
        int completed = 0, time = 0;
        System.out.println("\nGantt Chart:");
        while (completed < plist.size()) {
            Process shortest = null;
            for (Process p : plist) {
                if (p.remaining > 0 && p.arrival <= time && (shortest == null || p.burst < shortest.burst)) {
                    shortest = p;
                }
            }
            if (shortest == null) {
                time++;
                continue;
            }
            if (shortest.started == -1) shortest.started = time;
            System.out.printf("| P%d (%d-%d) ", shortest.pid, time, time + shortest.burst);
            time += shortest.burst;
            shortest.remaining = 0;
            shortest.completion = time;
            completed++;
        }
        System.out.println("|");
        displayMetrics(plist);
    }

    public static void srtf() {
        List<Process> plist = cloneProcesses();
        int completed = 0, time = 0;
        System.out.println("\nGantt Chart:");
        while (completed < plist.size()) {
            Process shortest = null;
            for (Process p : plist) {
                if (p.remaining > 0 && p.arrival <= time && (shortest == null || p.remaining < shortest.remaining)) {
                    shortest = p;
                }
            }
            if (shortest == null) {
                time++;
                continue;
            }
            if (shortest.started == -1) shortest.started = time;
            System.out.printf("| P%d (%d-%d) ", shortest.pid, time, time + 1);
            shortest.remaining--;
            time++;
            if (shortest.remaining == 0) {
                shortest.completion = time;
                completed++;
            }
        }
        System.out.println("|");
        displayMetrics(plist);
    }

    public static void roundRobin() {
        List<Process> plist = cloneProcesses();
        Queue<Process> queue = new LinkedList<>();
        Set<Integer> visited = new HashSet<>();
        int time = 0, completed = 0;

        queue.add(plist.get(0));
        visited.add(plist.get(0).pid);

        System.out.println("\nGantt Chart:");
        while (completed < plist.size()) {
            if (queue.isEmpty()) {
                time++;
                for (Process p : plist) {
                    if (!visited.contains(p.pid) && p.arrival <= time) {
                        queue.add(p);
                        visited.add(p.pid);
                    }
                }
                continue;
            }

            Process current = queue.poll();
            if (current.started == -1) current.started = time;
            int slice = Math.min(quantum, current.remaining);
            System.out.printf("| P%d (%d-%d) ", current.pid, time, time + slice);
            time += slice;
            current.remaining -= slice;

            for (Process p : plist) {
                if (!visited.contains(p.pid) && p.arrival <= time) {
                    queue.add(p);
                    visited.add(p.pid);
                }
            }

            if (current.remaining > 0) queue.add(current);
            else {
                current.completion = time;
                completed++;
            }
        }
        System.out.println("|");
        displayMetrics(plist);
    }

    public static void main(String[] args) {
        while (true) {
            System.out.println("\n=== CPU Scheduling Simulation ===");
            System.out.println("1. Enter Process Data");
            System.out.println("2. First Come First Serve (FCFS)");
            System.out.println("3. Shortest Job First (SJF)");
            System.out.println("4. Shortest Remaining Time First (SRTF)");
            System.out.println("5. Round Robin");
            System.out.println("6. Exit");
            System.out.print("Select an option: ");

            int choice = sc.nextInt();
            switch (choice) {
                case 1 -> inputProcesses();
                case 2 -> fcfs();
                case 3 -> sjf();
                case 4 -> srtf();
                case 5 -> {
                    System.out.print("Enter Time Quantum: ");
                    quantum = sc.nextInt();
                    roundRobin();
                }
                case 6 -> System.exit(0);
                default -> System.out.println("Invalid choice.");
            }
        }
    }

    private static List<Process> cloneProcesses() {
        List<Process> copy = new ArrayList<>();
        for (Process p : processes) {
            Process newP = new Process(p.pid, p.arrival, p.burst);
            copy.add(newP);
        }
        return copy;
    }
}
