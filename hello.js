public class YourApplication implements CommandLineRunner {

    @Autowired
    private WireMockServer wireMockServer;

    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }

    @Override
    public void run(String... args) {
        // Start the WireMock server
        wireMockServer.start();

        // Start the embedded Tomcat server
        try {
            startTomcat();
        } catch (LifecycleException e) {
            e.printStackTrace();
        }
    }

    private void startTomcat() throws LifecycleException {
        // ... (embedded Tomcat setup)
    }
}