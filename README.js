public class CustomTextIO {

    public static Write write() {
        return new Write();
    }

    public static class Write implements PTransform<PCollection<String>, PDone> {
        private String outputPath;
        private String prefix = "part";
        private String suffix = ".txt";
        private String header;
        private String footer;
        private SerializableFunction<String, String> formatter = s -> s; // default: no change
        private int numShards = 1;

        public Write to(String path) {
            this.outputPath = path;
            return this;
        }

        public Write withPrefix(String prefix) {
            this.prefix = prefix;
            return this;
        }

        public Write withSuffix(String suffix) {
            this.suffix = suffix;
            return this;
        }

        public Write withHeader(String header) {
            this.header = header;
            return this;
        }

        public Write withFooter(String footer) {
            this.footer = footer;
            return this;
        }

        public Write withFormatter(SerializableFunction<String, String> formatter) {
            this.formatter = formatter;
            return this;
        }

        public Write withNumShards(int numShards) {
            this.numShards = numShards;
            return this;
        }

        @Override
        public PDone expand(PCollection<String> input) {
            return input.apply(FileIO.<String>write()
                    .via(() -> new CustomSink(formatter, header, footer))
                    .to(outputPath)
                    .withPrefix(prefix)
                    .withSuffix(suffix)
                    .withNumShards(numShards));
        }
    }

    private static class CustomSink implements FileIO.Sink<String> {
        private final SerializableFunction<String, String> formatter;
        private final String header;
        private final String footer;
        private transient BufferedWriter writer;

        public CustomSink(SerializableFunction<String, String> formatter, String header, String footer) {
            this.formatter = formatter;
            this.header = header;
            this.footer = footer;
        }

        @Override
        public void open(WritableByteChannel channel) throws IOException {
            writer = new BufferedWriter(new OutputStreamWriter(Channels.newOutputStream(channel), StandardCharsets.UTF_8));
            if (header != null) {
                writer.write(header);
                writer.newLine();
            }
        }

        @Override
        public void write(String element) throws IOException {
            writer.write(formatter.apply(element));
            writer.newLine();
        }

        @Override
        public void flush() throws IOException {
            if (footer != null) {
                writer.write(footer);
                writer.newLine();
            }
            writer.flush();
        }
    }
}