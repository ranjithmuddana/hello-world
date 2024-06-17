import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.SeekableFileInput;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;

import java.io.*;

public class LargeFileJoiner {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String sortedTextFilePath = "path/to/your/sorted_file2.txt";
        String outputPath = "path/to/your/output.txt";

        BufferedReader brSortedText = null;
        BufferedWriter bwOutput = null;

        try {
            // Open Avro file for reading
            SeekableFileInput inputAvro = new SeekableFileInput(new File(avroFilePath));
            DataFileReader<GenericRecord> dataFileReader = new DataFileReader<>(inputAvro, new GenericDatumReader<>());
            Schema avroSchema = dataFileReader.getSchema();

            // Open sorted text file for reading and output file for writing
            brSortedText = new BufferedReader(new FileReader(sortedTextFilePath));
            bwOutput = new BufferedWriter(new FileWriter(outputPath));

            // Initialize variables for Avro record and sorted text line
            GenericRecord avroRecord = null;
            String sortedTextLine;

            // Read the first Avro record
            if (dataFileReader.hasNext()) {
                avroRecord = dataFileReader.next();
            }

            // Process each line in the sorted text file
            while ((sortedTextLine = brSortedText.readLine()) != null) {
                String[] textParts = sortedTextLine.split("\\|");
                if (textParts.length == 2) {
                    String idText = textParts[0];
                    String address = textParts[1];

                    // Find matching Avro record for the current ID
                    boolean foundMatch = false;
                    while (avroRecord != null && !foundMatch) {
                        String idAvro = avroRecord.get("id").toString(); // Change "id" to actual field name in your Avro schema

                        // Compare IDs
                        int compareResult = idAvro.compareTo(idText);
                        if (compareResult == 0) {
                            String dataAvro = avroRecord.get("data").toString(); // Change "data" to actual field name in your Avro schema
                            String mergedLine = idAvro + "|" + dataAvro + "|" + address;
                            bwOutput.write(mergedLine);
                            bwOutput.newLine();
                            foundMatch = true;
                        } else if (compareResult > 0) {
                            // Avro ID is greater than text ID, stop searching
                            break;
                        } else {
                            // Avro ID is less than text ID, move to the next Avro record
                            if (dataFileReader.hasNext()) {
                                avroRecord = dataFileReader.next();
                            } else {
                                avroRecord = null;
                            }
                        }
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (brSortedText != null) brSortedText.close();
                if (bwOutput != null) bwOutput.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}