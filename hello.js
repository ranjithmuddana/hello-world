import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;

public class SequenceToCSV {

    public static void main(String[] args) {
        String fileName = "sequence.csv";
        int start = 1;
        int end = 100000;

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(fileName))) {
            writer.write("SequenceNumber"); // Header for the CSV file
            writer.newLine();

            for (int i = start; i <= end; i++) {
                writer.write(String.valueOf(i));
                writer.newLine();
            }

            System.out.println("Sequence written to " + fileName + " successfully.");
        } catch (IOException e) {
            System.err.println("Error writing to file: " + e.getMessage());
        }
    }
}