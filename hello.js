import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.DataFileWriter;
import org.apache.avro.file.SeekableFileInput;
import org.apache.avro.generic.GenericDatumReader;
import org.apache.avro.generic.GenericDatumWriter;
import org.apache.avro.generic.GenericRecord;

import java.io.*;
import java.util.concurrent.PipedInputStream;
import java.util.concurrent.PipedOutputStream;

public class JoinFilesPiped {
    public static void main(String[] args) {
        String avroFilePath = "path/to/your/file1.avro";
        String textFilePath = "path/to/your/file2.txt";
        String outputAvroPath = "path/to/your/output.avro";

        PipedInputStream pipedInputStream = new PipedInputStream();
        PipedOutputStream pipedOutputStream;

        try {
            pipedOutputStream = new PipedOutputStream(pipedInputStream);

            Thread producer = new Thread(new AvroProducer(avroFilePath, pipedOutputStream));
            Thread consumer = new Thread(new AvroConsumer(textFilePath, pipedInputStream, outputAvroPath));

            producer.start();
            consumer.start();

            producer.join();
            consumer.join();
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
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
    private final String textFilePath;
    private final PipedInputStream pipedInputStream;
    private final String outputAvroPath;

    public AvroConsumer(String textFilePath, PipedInputStream pipedInputStream, String outputAvroPath) {
        this.textFilePath = textFilePath;
        this.pipedInputStream = pipedInputStream;
        this.outputAvroPath = outputAvroPath;
    }

    @Override
    public void run() {
        BufferedReader brText = null;
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

            // Open text file for reading
            brText = new BufferedReader(new FileReader(textFilePath));

            // Open output Avro file for writing
            avroWriter = new DataFileWriter<>(new GenericDatumWriter<>(schema));
            avroWriter.create(schema, new File(outputAvroPath));

            // Initialize the object input stream
            objectInputStream = new ObjectInputStream(pipedInputStream);

            String textLine;
            while (true) {
                try {
                    GenericRecord avroRecord = (GenericRecord) objectInputStream.readObject();
                    if (avroRecord == null) break;
                    String idAvro = avroRecord.get("id").toString(); // Change "id" to actual field name in your Avro schema
                    String avroData = avroRecord.toString(); // Adjust as needed to get specific fields

                    // Reset text file reader to the beginning
                    brText = new BufferedReader(new FileReader(textFilePath));

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
                } catch (EOFException e) {
                    break;
                }
            }
        } catch (IOException | ClassNotFoundException e) {
            e.printStackTrace();
        } finally {
            try {
                if (brText != null) brText.close();
                if (avroWriter != null) avroWriter.close();
                if (objectInputStream != null) objectInputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}