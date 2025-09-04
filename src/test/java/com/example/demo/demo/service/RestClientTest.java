package com.example.demo.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.ws.client.core.WebServiceTemplate;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RestClientTest {

    @Mock
    private ExchangeFunction exchangeFunction;

    @Mock
    private WebServiceTemplate webServiceTemplate;

    private RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void initialize() {
        WebClient.Builder webClientBuilder = WebClient.builder().exchangeFunction(exchangeFunction);
        restClient = new RestClient(webClientBuilder, objectMapper, webServiceTemplate);
    }

    @Test
    void testProcessData_Success() throws JsonProcessingException {
        String inputJson = objectMapper.writeValueAsString(Map.of("path", "/test"));
        String mockResponse = "{\"success\":true}";

        ClientResponse clientResponse = ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body(mockResponse).build();
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        String result = restClient.processData(inputJson);

        assertEquals(mockResponse, result);
    }

    @Test
    void testProcessData_Error() throws JsonProcessingException {
        String inputJson = objectMapper.writeValueAsString(Map.of("path", "/error"));

        ClientResponse clientResponse = ClientResponse.create(HttpStatus.INTERNAL_SERVER_ERROR).build();
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        assertThrows(IllegalArgumentException.class, () -> {
            restClient.processData(inputJson);
        });
    }

    @Test
    void testProcessData_InvalidJson() {
        String invalidInputJson = "invalid-json";

        assertThrows(IllegalArgumentException.class, () -> {
            restClient.processData(invalidInputJson);
        });
    }
}
