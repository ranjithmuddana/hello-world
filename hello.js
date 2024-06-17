import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.SeekableFileInput;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericRecord;

import java.io.*;

public class JoinFilesStreamed {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String textFilePath = "path/to/your/file2.txt";
        String outputPath = "path/to/your/output.txt";

        BufferedReader brText = null;
        BufferedWriter bwOutput = null;
        DataFileReader<GenericRecord> avroReader = null;

        try {
            // Open text file for reading and output file for writing
            brText = new BufferedReader(new FileReader(textFilePath));
            bwOutput = new BufferedWriter(new FileWriter(outputPath));

            // Open Avro file for reading
            SeekableFileInput inputAvro = new SeekableFileInput(new File(avroFilePath));
            avroReader = new DataFileReader<>(inputAvro, new GenericDatumReader<>());

            // Process each record in the Avro file
            while (avroReader.hasNext()) {
                GenericRecord avroRecord = avroReader.next();
                String idAvro = avroRecord.get("id").toString(); // Change "id" to actual field name in your Avro schema
                String avroData = avroRecord.toString(); // Adjust as needed to get specific fields

                // Reset text file reader to the beginning
                brText = new BufferedReader(new FileReader(textFilePath));
                String textLine;

                // Process each line in the text file to find matches
                while ((textLine = brText.readLine()) != null) {
                    String[] textParts = textLine.split("\\|");
                    if (textParts.length == 2) {
                        String idText = textParts[0];
                        String address = textParts[1];

                        // If IDs match, write to output file
                        if (idAvro.equals(idText)) {
                            String mergedLine = idText + "|" + avroData + "|" + address;
                            bwOutput.write(mergedLine);
                            bwOutput.newLine();
                        }
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (brText != null) brText.close();
                if (bwOutput != null) bwOutput.close();
                if (avroReader != null) avroReader.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}