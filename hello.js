@Bean
public HttpHandler actuatorHttpHandler(WebFluxEndpointHandlerMapping endpointHandlerMapping, Scheduler actuatorScheduler) {
    return (request, response) -> {
        return Mono.defer(() -> {
            try {
                // Get handler for the current actuator request
                Object handler = endpointHandlerMapping.getHandler(request);
                if (handler instanceof HttpHandler) {
                    // Execute the request on a custom scheduler
                    return ((HttpHandler) handler).handle(request, response)
                        .subscribeOn(actuatorScheduler);
                }
                return Mono.empty();
            } catch (Exception e) {
                return Mono.error(e);
            }
        });
    };
}