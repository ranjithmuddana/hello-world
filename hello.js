import com.google.auth.Credentials;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Random;

public class GCSFilePicker {
    public static void main(String[] args) {
        String bucketName = "your-bucket-name"; // Replace with your GCS bucket name
        List<Blob> unprocessedFiles = getUnprocessedFiles(bucketName);

        if (!unprocessedFiles.isEmpty()) {
            Random random = new Random();
            int randomIndex = random.nextInt(unprocessedFiles.size());
            Blob randomUnprocessedFile = unprocessedFiles.get(randomIndex);

            String lockFileName = randomUnprocessedFile.getName() + ".lock";
            Blob lockFile = randomUnprocessedFile.getBucket().get(lockFileName);

            if (lockFile == null) {
                // Process the file
                System.out.println("Processing file: " + randomUnprocessedFile.getName());

                // Create lock file to mark as being processed
                randomUnprocessedFile.getBucket().create(lockFileName, new byte[0], BlobTargetOption.doesNotExist());

                // Simulate processing
                try {
                    Thread.sleep(5000); // Simulating 5 seconds of processing
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                // Delete the lock file
                lockFile.delete();
            } else {
                System.out.println("File is being processed by another instance.");
            }
        } else {
            System.out.println("No unprocessed files available.");
        }
    }

    private static List<Blob> getUnprocessedFiles(String bucketName) {
        try {
            Credentials credentials = GoogleCredentials.fromStream(new FileInputStream("path-to-your-credentials.json"));
            Storage storage = StorageOptions.newBuilder().setCredentials(credentials).build().getService();

            Bucket bucket = storage.get(bucketName);
            return bucket.list(BlobListOption.currentDirectory(), BlobListOption.prefix("")).getValues();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
}