import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.DataFileWriter;
import org.apache.avro.file.SeekableFileInput;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericDatumWriter;
import org.apache.avro.generic.GenericRecord;

import java.io.*;
import java.util.*;

public class JoinFilesWithCache {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String textFilePath = "path/to/your/file2.txt";
        String outputAvroPath = "path/to/your/output.avro";

        try {
            // Cache the text file into a Map
            Map<String, List<String>> textDataMap = cacheTextFile(textFilePath);

            // Process the Avro file and write to the output Avro file
            processAvroFile(avroFilePath, textDataMap, outputAvroPath);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private static Map<String, List<String>> cacheTextFile(String textFilePath) throws IOException {
        Map<String, List<String>> textDataMap = new HashMap<>();
        BufferedReader br = new BufferedReader(new FileReader(textFilePath));
        String line;

        while ((line = br.readLine()) != null) {
            String[] parts = line.split("\\|");
            if (parts.length == 2) {
                String id = parts[0];
                String address = parts[1];
                textDataMap.computeIfAbsent(id, k -> new ArrayList<>()).add(address);
            }
        }

        br.close();
        return textDataMap;
    }

    private static void processAvroFile(String avroFilePath, Map<String, List<String>> textDataMap, String outputAvroPath) throws IOException {
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

        DataFileReader<GenericRecord> avroReader = null;
        DataFileWriter<GenericRecord> avroWriter = null;

        try {
            // Open Avro file for reading
            SeekableFileInput inputAvro = new SeekableFileInput(new File(avroFilePath));
            avroReader = new DataFileReader<>(inputAvro, new GenericDatumReader<>());

            // Open output Avro file for writing
            avroWriter = new DataFileWriter<>(new GenericDatumWriter<>(schema));
            avroWriter.create(schema, new File(outputAvroPath));

            // Process each record in the Avro file
            while (avroReader.hasNext()) {
                GenericRecord avroRecord = avroReader.next();
                String idAvro = avroRecord.get("id").toString(); // Change "id" to actual field name in your Avro schema
                String avroData = avroRecord.toString(); // Adjust as needed to get specific fields

                // Find matching addresses from the cached map
                List<String> addresses = textDataMap.get(idAvro);
                if (addresses != null) {
                    for (String address : addresses) {
                        GenericRecord outputRecord = new GenericData.Record(schema);
                        outputRecord.put("id", idAvro);
                        outputRecord.put("avroData", avroData);  // Adjust based on actual data structure
                        outputRecord.put("address", address);

                        avroWriter.append(outputRecord);
                    }
                }
            }
        } finally {
            if (avroReader != null) avroReader.close();
            if (avroWriter != null) avroWriter.close();
        }
    }
}