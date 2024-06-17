import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.DataFileWriter;
import org.apache.avro.file.SeekableFileInput;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericDatumWriter;
import org.apache.avro.generic.GenericRecord;

import java.io.*;

public class JoinFilesStreamed {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String textFilePath = "path/to/your/file2.txt";
        String outputAvroPath = "path/to/your/output.avro";

        BufferedReader brText = null;
        DataFileReader<GenericRecord> avroReader = null;
        DataFileWriter<GenericRecord> avroWriter = null;

        try {
            // Define the schema for the output Avro file
            String schemaJson = "{"
                    + "\"namespace\": \"example.avro\","
                    + "\"type\": \"record\","
                    + "\"name\": \"OutputRecord\","
                    + "\"fields\": ["
                    + "{\"name\": \"id\", \"type\": \"string\"},"
                    + "{\"name\": \"avroData\", \"type\": \"string\"},"  // Adjust this type based on actual Avro data structure
                    + "{\"name\": \"address\", \"type\": \"string\"}"
                    + "]"
                    + "}";

            Schema schema = new Schema.Parser().parse(schemaJson);

            // Open text file for reading
            brText = new BufferedReader(new FileReader(textFilePath));

            // Open Avro file for reading
            SeekableFileInput inputAvro = new SeekableFileInput(new File(avroFilePath));
            avroReader = new DataFileReader<>(inputAvro, new GenericDatumReader<>());

            // Open output Avro file for writing
            avroWriter = new DataFileWriter<>(new GenericDatumWriter<GenericRecord>(schema));
            avroWriter.create(schema, new File(outputAvroPath));

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

                        // If IDs match, write to output Avro file
                        if (idAvro.equals(idText)) {
                            GenericRecord outputRecord = new GenericData.Record(schema);
                            outputRecord.put("id", idText);
                            outputRecord.put("avroData", avroData);  // Adjust based on actual data structure
                            outputRecord.put("address", address);

                            avroWriter.append(outputRecord);
                        }
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (brText != null) brText.close();
                if (avroWriter != null) avroWriter.close();
                if (avroReader != null) avroReader.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}