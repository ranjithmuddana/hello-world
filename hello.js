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
import java.util.concurrent.PipedInputStream;
import java.util.concurrent.PipedOutputStream;

public class JoinFilesPipedWithCache {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String textFilePath = "path/to/your/file2.txt";
        String outputAvroPath = "path/to/your/output.avro";

        PipedInputStream pipedInputStream = new PipedInputStream();
        PipedOutputStream pipedOutputStream;

        try {
            // Cache the text file into a Map
            Map<String, List<String>> textDataMap = cacheTextFile(textFilePath);

            pipedOutputStream = new PipedOutputStream(pipedInputStream);

            Thread producer = new Thread(new AvroProducer(avroFilePath, pipedOutputStream));
            Thread consumer = new Thread(new AvroConsumer(textDataMap, pipedInputStream, outputAvroPath));

            producer.start();
            consumer.start();

            producer.join();
            consumer.join();
        } catch (IOException | InterruptedException e) {
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
}

class AvroProducer implements Runnable {
    private final String avroFilePath;
    private final PipedOutputStream pipedOutputStream;

    public AvroProducer(String avroFilePath, PipedOutputStream pipedOutputStream) {
        this.avroFilePath = avroFilePath;
        this.pipedOutputStream = pipedOutputStream;
    }

    @Override
    public void run() {
        DataFileReader<GenericRecord> avroReader = null;
        ObjectOutputStream objectOutputStream = null;

        try {
            SeekableFileInput inputAvro = new SeekableFileInput(new File(avroFilePath));
            avroReader = new DataFileReader<>(inputAvro, new GenericDatumReader<>());

            objectOutputStream = new ObjectOutputStream(pipedOutputStream);

            while (avroReader.hasNext()) {
                GenericRecord avroRecord = avroReader.next();
                objectOutputStream.writeObject(avroRecord);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (avroReader != null) avroReader.close();
                if (objectOutputStream != null) objectOutputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

class AvroConsumer implements Runnable {
    private final Map<String, List<String>> textDataMap;
    private final PipedInputStream pipedInputStream;
    private final String outputAvroPath;

    public AvroConsumer(Map<String, List<String>> textDataMap, PipedInputStream pipedInputStream, String outputAvroPath) {
        this.textDataMap = textDataMap;
        this.pipedInputStream = pipedInputStream;
        this.outputAvroPath = outputAvroPath;
    }

    @Override
    public void run() {
        DataFileWriter<GenericRecord> avroWriter = null;
        ObjectInputStream objectInputStream = null;

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

            // Open output Avro file for writing
            avroWriter = new DataFileWriter<>(new GenericDatumWriter<>(schema));
            avroWriter.create(schema, new File(outputAvroPath));

            // Initialize the object input stream
            objectInputStream = new ObjectInputStream(pipedInputStream);

            while (true) {
                try {
                    GenericRecord avroRecord = (GenericRecord) objectInputStream.readObject();
                    if (avroRecord == null) break;
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
                } catch (EOFException e) {
                    break;
                }
            }
        } catch (IOException | ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
            try {
                if (avroWriter != null) avroWriter.close();
                if (objectInputStream != null) objectInputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}