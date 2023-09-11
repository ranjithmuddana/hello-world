import com.googlecode.juniversalchardet.UniversalDetector;

public class CharsetDetection {
    public static void main(String[] args) {
        byte[] data = /* Your byte array here */;

        String detectedCharset = detectCharset(data);

        if ("UTF-8".equals(detectedCharset)) {
            System.out.println("Detected encoding: UTF-8");
        } else if ("IBM1047".equals(detectedCharset)) {
            System.out.println("Detected encoding: IBM1047 (CP1047)");
        } else {
            System.out.println("Unknown encoding");
        }
    }

    private static String detectCharset(byte[] data) {
        UniversalDetector detector = new UniversalDetector(null);
        detector.handleData(data, 0, data.length);
        detector.dataEnd();
        String charset = detector.getDetectedCharset();
        detector.reset();
        return charset;
    }
}