import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.SeekableFileInput;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;

import java.io.*;

public class LargeFileJoiner {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String textFilePath = "path/to/your/file2.txt";
        String outputPath = "path/to/your/output.txt";

        BufferedReader brText = null;
        BufferedWriter bwOutput = null;

        try {
            // Open Avro file for reading
            SeekableFileInput inputAvro = new SeekableFileInput(new File(avroFilePath));
            DataFileReader<GenericRecord> dataFileReader = new DataFileReader<>(inputAvro, new GenericDatumReader<>());
            Schema avroSchema = dataFileReader.getSchema();

            // Open text file for reading and output file for writing
            brText = new BufferedReader(new FileReader(textFilePath));
            bwOutput = new BufferedWriter(new FileWriter(outputPath));

            // Initialize variables for Avro record and text line
            GenericRecord avroRecord = null;
            String textLine;

            // Read the first Avro record
            if (dataFileReader.hasNext()) {
                avroRecord = dataFileReader.next();
            }

            // Process each line in the text file
            while ((textLine = brText.readLine()) != null) {
                String[] textParts = textLine.split("\\|");
                if (textParts.length == 2) {
                    String idText = textParts[0];
                    String address = textParts[1];

                    // Advance Avro record until ID matches or surpasses text ID
                    while (avroRecord != null && avroRecord.get("id").toString().compareTo(idText) < 0) {
                        if (dataFileReader.hasNext()) {
                            avroRecord = dataFileReader.next();
                        } else {
                            avroRecord = null;
                        }
                    }

                    // Merge data if IDs match
                    if (avroRecord != null && avroRecord.get("id").toString().equals(idText)) {
                        String idAvro = avroRecord.get("id").toString();
                        String dataAvro = avroRecord.get("data").toString(); // Change "data" to actual field name in your Avro schema
                        String mergedLine = idAvro + "|" + dataAvro + "|" + address;
                        bwOutput.write(mergedLine);
                        bwOutput.newLine();
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (brText != null) brText.close();
                if (bwOutput != null) bwOutput.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}