import org.apache.beam.sdk.transforms.DoFn;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class BaseDoFn<InputT, OutputT> extends DoFn<InputT, OutputT> {
    private static final Logger LOG = LoggerFactory.getLogger(BaseDoFn.class);

    @StartBundle
    public void startBundle(StartBundleContext context) {
        // Common start bundle logic
        LOG.info("Starting bundle...");
    }

    @FinishBundle
    public void finishBundle(FinishBundleContext context) {
        // Common finish bundle logic
        LOG.info("Finishing bundle...");
    }

    @ProcessElement
    public void processElement(ProcessContext context) {
        // Delegating the processing logic to the concrete subclass
        processElementImpl(context);
    }

    protected abstract void processElementImpl(ProcessContext context);
}