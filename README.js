import org.apache.jmeter.services.FileServer
import java.nio.file.*

// Define output file path (one global CSV for all requests)
def outFile = Paths.get("results/all_requests.csv")

// Write CSV header once if file is new
if (!Files.exists(outFile)) {
    Files.write(outFile, "Counter,UserId,RequestJSON,StatusCode,ResponseJSON\n".getBytes(), StandardOpenOption.CREATE)
}

// Gather data
def counter = vars.get("counter")
def userId = vars.get("userId")   // adjust if your CSV has different columns
def requestJson = sampler.getArguments().asArgument().getValue()  // works if request body passed via Body Data
def statusCode = prev.getResponseCode()
def responseJson = prev.getResponseDataAsString()

// Escape quotes and commas for CSV safety
def escape = { s -> s?.replace("\"","\"\"").replace("\n"," ").replace("\r"," ") }

// Create CSV line
def line = "\"${escape(counter)}\",\"${escape(userId)}\",\"${escape(requestJson)}\",\"${escape(statusCode)}\",\"${escape(responseJson)}\"\n"

// Append to file
Files.write(outFile, line.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.APPEND)