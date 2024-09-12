private Mono<ClientRequest> logRequestBody(ClientRequest request) {
        if (request.body().isEmpty()) {
            return Mono.just(request);
        }
        return request.body().map(body -> {
            String bodyString = new String(body.asByteArray(), StandardCharsets.UTF_8);
            logger.info("Request body: {}", bodyString);
            return body;
        }).map(body -> ClientRequest.from(request).body(body).build());
    }