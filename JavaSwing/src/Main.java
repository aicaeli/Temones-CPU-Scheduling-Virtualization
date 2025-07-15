import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.*;
import java.util.List;
import java.util.ArrayList;
import java.util.Queue;
import java.util.LinkedList;
import java.util.Set;
import java.util.HashSet;


class Process {
    int pid, arrival, burst, remaining, completion, turnaround, response, started = -1;

    Process(int pid, int arrival, int burst) {
        this.pid = pid;
        this.arrival = arrival;
        this.burst = burst;
        this.remaining = burst;
    }
}

public class Main {
    private static JFrame frame;
    private static JTextArea inputArea;
    private static JComboBox<String> algorithmBox;
    private static JTextField quantumField;
    private static DefaultTableModel tableModel;
    private static JPanel ganttPanel;

    public static void main(String[] args) {
        SwingUtilities.invokeLater(Main::createGUI);
    }

    private static void createGUI() {
        frame = new JFrame("CPU Scheduling Simulator");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(800, 600);

        JPanel inputPanel = new JPanel(new GridLayout(0, 1));
        inputPanel.add(new JLabel("Enter Process Data (Arrival Burst):"));
        inputArea = new JTextArea(5, 20);
        inputPanel.add(new JScrollPane(inputArea));

        inputPanel.add(new JLabel("Select Algorithm:"));
        algorithmBox = new JComboBox<>(new String[]{"FCFS", "SJF", "SRTF", "RR"});
        inputPanel.add(algorithmBox);

        inputPanel.add(new JLabel("Time Quantum (RR only):"));
        quantumField = new JTextField("2");
        inputPanel.add(quantumField);

        JButton simulateBtn = new JButton("Simulate");
        simulateBtn.addActionListener(e -> runSimulation());
        inputPanel.add(simulateBtn);

        frame.add(inputPanel, BorderLayout.WEST);

        tableModel = new DefaultTableModel(new String[]{"PID", "Arrival", "Burst", "Start", "Completion", "Turnaround", "Response"}, 0);
        JTable table = new JTable(tableModel);
        frame.add(new JScrollPane(table), BorderLayout.CENTER);

        ganttPanel = new JPanel();
        ganttPanel.setLayout(new FlowLayout(FlowLayout.LEFT));
        ganttPanel.setBackground(Color.LIGHT_GRAY);
        frame.add(ganttPanel, BorderLayout.SOUTH);

        frame.setVisible(true);
    }

    private static void runSimulation() {
        tableModel.setRowCount(0);
        ganttPanel.removeAll();
        ganttPanel.repaint();

        String[] lines = inputArea.getText().trim().split("\n");
        List<Process> processes = new ArrayList<>();
        for (int i = 0; i < lines.length; i++) {
            String[] parts = lines[i].trim().split("\\s+");
            int at = Integer.parseInt(parts[0]);
            int bt = Integer.parseInt(parts[1]);
            processes.add(new Process(i + 1, at, bt));
        }

        String algo = (String) algorithmBox.getSelectedItem();
        int quantum = Integer.parseInt(quantumField.getText());

        switch (algo) {
            case "FCFS" -> simulateFCFS(processes);
            case "SJF" -> simulateSJF(processes);
            case "SRTF" -> simulateSRTF(processes);
            case "RR" -> simulateRR(processes, quantum);
        }

        for (Process p : processes) {
            tableModel.addRow(new Object[]{
                p.pid, p.arrival, p.burst, p.started, p.completion, p.turnaround, p.response
            });

            JLabel block = new JLabel("P" + p.pid);
            block.setOpaque(true);
            block.setBackground(Color.BLUE);
            block.setForeground(Color.WHITE);
            block.setBorder(BorderFactory.createLineBorder(Color.BLACK));
            block.setPreferredSize(new Dimension(50, 30));
            ganttPanel.add(block);
        }

        frame.revalidate();
    }

    private static void simulateFCFS(List<Process> plist) {
        int time = 0;
        for (Process p : plist) {
            if (time < p.arrival) time = p.arrival;
            p.started = time;
            time += p.burst;
            p.completion = time;
            p.turnaround = p.completion - p.arrival;
            p.response = p.started - p.arrival;
        }
    }

    private static void simulateSJF(List<Process> plist) {
        int time = 0, completed = 0;
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
            shortest.started = time;
            time += shortest.burst;
            shortest.completion = time;
            shortest.turnaround = shortest.completion - shortest.arrival;
            shortest.response = shortest.started - shortest.arrival;
            shortest.remaining = 0;
            completed++;
        }
    }

    private static void simulateSRTF(List<Process> plist) {
        int time = 0, completed = 0;
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
            shortest.remaining--;
            time++;
            if (shortest.remaining == 0) {
                shortest.completion = time;
                shortest.turnaround = shortest.completion - shortest.arrival;
                shortest.response = shortest.started - shortest.arrival;
                completed++;
            }
        }
    }

    private static void simulateRR(List<Process> plist, int quantum) {
        Queue<Process> queue = new LinkedList<>();
        int time = 0, completed = 0;
        Set<Integer> visited = new HashSet<>();

        while (completed < plist.size()) {
            for (Process p : plist) {
                if (!visited.contains(p.pid) && p.arrival <= time) {
                    queue.add(p);
                    visited.add(p.pid);
                }
            }

            if (queue.isEmpty()) {
                time++;
                continue;
            }

            Process current = queue.poll();
            if (current.started == -1) current.started = time;

            int runTime = Math.min(quantum, current.remaining);
            current.remaining -= runTime;
            time += runTime;

            for (Process p : plist) {
                if (!visited.contains(p.pid) && p.arrival <= time) {
                    queue.add(p);
                    visited.add(p.pid);
                }
            }

            if (current.remaining > 0) {
                queue.add(current);
            } else {
                current.completion = time;
                current.turnaround = current.completion - current.arrival;
                current.response = current.started - current.arrival;
                completed++;
            }
        }
    }
}
