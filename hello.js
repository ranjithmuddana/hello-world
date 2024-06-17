import java.io.*;

public class LargeFileJoiner {
    public static void main(String[] args) {
        String sortedFile1Path = "path/to/your/sorted_file1.txt";
        String sortedFile2Path = "path/to/your/sorted_file2.txt";
        String outputPath = "path/to/your/output.txt";

        BufferedReader br1 = null;
        BufferedReader br2 = null;
        BufferedWriter bw = null;

        try {
            br1 = new BufferedReader(new FileReader(sortedFile1Path));
            br2 = new BufferedReader(new FileReader(sortedFile2Path));
            bw = new BufferedWriter(new FileWriter(outputPath));

            String line1 = br1.readLine();
            String line2 = br2.readLine();
            
            while (line1 != null && line2 != null) {
                String[] parts1 = line1.split("\\|");
                String[] parts2 = line2.split("\\|");

                String id1 = parts1[0];
                String id2 = parts2[0];

                if (id1.compareTo(id2) < 0) {
                    line1 = br1.readLine();
                } else if (id1.compareTo(id2) > 0) {
                    line2 = br2.readLine();
                } else {
                    String data = parts1[1];
                    while (line2 != null && id1.equals(id2)) {
                        String address = parts2[1];
                        bw.write(id1 + "|" + data + "|" + address);
                        bw.newLine();
                        line2 = br2.readLine();
                        if (line2 != null) {
                            parts2 = line2.split("\\|");
                            id2 = parts2[0];
                        }
                    }
                    line1 = br1.readLine();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (br1 != null) br1.close();
                if (br2 != null) br2.close();
                if (bw != null) bw.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}