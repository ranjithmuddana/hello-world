private void logRequestBody(ClientRequest request) {
        if (request.body() != null) {
            Mono<String> bodyMono = request.body().insert((outputStream, context) -> {
                byte[] content = new byte[outputStream.readableByteCount()];
                outputStream.read(content);
                logger.info("Request body: {}", new String(content, StandardCharsets.UTF_8));
                return Mono.just(outputStream);
            }).then(Mono.empty());

            bodyMono.subscribe();
        }
    }