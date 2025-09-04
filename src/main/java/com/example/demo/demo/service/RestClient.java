package com.example.demo.demo.service;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.ws.client.core.WebServiceTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.log4j.Log4j2;

/**
 * A REST client service that uses Spring's WebClient to make HTTP requests.
 * It can process JSON input to dynamically construct requests, including
 * setting
 * base URL, path, query parameters, URI variables, HTTP method, and request
 * body.
 */
@Service
@Log4j2
public class RestClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final WebServiceTemplate webServiceTemplate;

    /**
     * Constructs a new RestClient with the given WebClient.Builder and
     * ObjectMapper.
     *
     * @param webClientBuilder The builder for creating WebClient instances.
     * @param objectMapper     The ObjectMapper for JSON serialization and
     *                         deserialization.
     */
    public RestClient(WebClient.Builder webClientBuilder, ObjectMapper objectMapper,
            WebServiceTemplate webServiceTemplate) {
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
        this.webServiceTemplate = webServiceTemplate;
    }

    public String processSoapRequest(String soapRequest, String url) {
        StreamSource source = new StreamSource(new StringReader(soapRequest));
        StringWriter writer = new StringWriter();
        StreamResult result = new StreamResult(writer);
        webServiceTemplate.sendSourceAndReceiveToResult(url, source, result);
        return writer.toString();
    }

    /**
     * Processes the input JSON data from a Mono of strings.
     *
     * @param inputJson A string containing the JSON data to
     *                      process.
     * @return A Mono emitting a string containing the response body from the
     *         external API.
     *         If an error occurs during processing, the Mono will emit an error
     *         signal.
     */
    public String processData(String inputJson) {
        return processJson(inputJson);
    }

    /**
     * Processes a single JSON string, builds a WebClient request based on the JSON
     * content,
     * sends the request, and returns the response body as a Mono of string.
     *
     * @param inputJson A string containing the JSON data used to configure the
     *                  WebClient request.
     *                  The JSON should contain the necessary fields to build the
     *                  URI and request body.
     * @return A Mono emitting a string containing the response body from the
     *         external API.
     *         If an error occurs during JSON parsing, request building, or during
     *         the API call,
     *         the Mono will emit an error signal with an IllegalArgumentException.
     */
    String processJson(String inputJson) {
        try {
            JsonNode inputJsonNode = objectMapper.readTree(inputJson);
            String requestBody = buildRequestBody(inputJsonNode);

            return buildUri(inputJsonNode)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnNext(responseBody -> logRequestResponse(inputJsonNode, responseBody))
                    .block();

        } catch (Exception e) {
            log.error("Error processing JSON: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Error processing JSON", e);
        }
    }

    /**
     * Builds the WebClient request specification based on the provided JSON
     * configuration.
     *
     * @param inputJsonNode The JSON node containing configuration for the request.
     *                      This node should contain the following optional fields:
     *                      - `baseUrl`: The base URL for the API endpoint. If not
     *                      provided, the WebClient's base URL is used.
     *                      - `path`: The path to append to the base URL. Defaults
     *                      to "/" if not provided.
     *                      - `queryParams`: A JSON object representing query
     *                      parameters. Each key-value pair
     *                      will be added as a query parameter to the request. The
     *                      values
     *                      are expected to be strings. Example: `{"param1":
     *                      "value1", "param2": "value2"}`.
     *                      - `uriVariables`: A JSON object representing URI
     *                      variables. The values will be used to
     *                      replace placeholders in the `path`. The order of
     *                      variables must match the
     *                      order of placeholders in the path. Example: `{"var1":
     *                      "value1", "var2": "value2"}`.
     *                      - `uriVariablesPath`: The path to use with uriVariables.
     *                      - `httpMethod`: The HTTP method to use for the request
     *                      (GET, POST, PUT, DELETE, PATCH).
     *                      Defaults to GET if not provided or if an invalid value
     *                      is provided.
     *                      Example: `"httpMethod": "POST"`
     *                      Example input JSON:
     *                      <code>
     *{
     *  "baseUrl": "https://example.com",
     *  "path": "/api/resource/{id}",
     *  "queryParams": {
     *    "param1": "value1",
     *    "param2": "value2"
     *  },
     *  "uriVariables": {
     *    "id": "123"
     *  },
     *  "httpMethod": "GET",
     *  "requestBody": {
     *    "key1": "value1",
     *    "key2": "value2"
     *  }
     *}
     *</code>
     *
     * @return A {@link WebClient.RequestBodySpec} configured with the provided
     *         parameters. This allows the caller to
     *         further specify the request body and execute the request.
     */
    private WebClient.RequestBodySpec buildUri(JsonNode inputJsonNode) {
        String baseUrl = getNodeAsText(inputJsonNode, "baseUrl", null);
        String path = getNodeAsText(inputJsonNode, "path", "/");
        String uriVariablesPath = getNodeAsText(inputJsonNode, "uriVariablesPath", null);
        MultiValueMap<String, String> queryParams = getJsonNodeAsMultiValueMap(inputJsonNode.get("queryParams"));
        Map<String, String> headerParams = getJsonNodeAsMap(inputJsonNode, "headers");

        Object[] uriVariables = buildUriVariables(inputJsonNode.get("uriVariables"), uriVariablesPath);
        HttpMethod httpMethod = determineHttpMethod(inputJsonNode);

        return webClientBuilder.baseUrl(baseUrl).build()
                .method(httpMethod)
                .uri(uriBuilder -> {
                    uriBuilder.path(path);
                    uriBuilder.queryParams(queryParams);
                    return uriBuilder.build(uriVariables);
                })
                .headers(headers -> headers.setAll(headerParams))
                ;
    }

    /**
     * Extracts a text value from a JSON node, providing a default if the field is
     * missing.
     *
     * @param inputJsonNode The JSON node to extract from.
     * @param fieldName     The name of the field to extract.
     * @param defaultValue  The default value to return if the field is missing or
     *                      null.
     * @return The text value of the field, or the default value if the field is
     *         missing.
     */
    private static String getNodeAsText(JsonNode inputJsonNode, String fieldName, String defaultValue) {
        String fieldValue = inputJsonNode.has(fieldName) && !inputJsonNode.get(fieldName).isNull()
                ? inputJsonNode.get(fieldName).asText()
                : defaultValue;
        log.error("Extracted field '{}' with value: {}", fieldName, fieldValue);
        return fieldValue;
    }

    /**
     * Extracts a map from a JSON node, providing a default if the field is
     * missing.
     *
     * @param parentNode    The JSON node to extract from.
     * @param fieldName     The name of the field to extract.
     * @return The text value of the field, or the default value if the field is
     *         missing.
     */
    private Map<String, String> getJsonNodeAsMap(JsonNode parentNode, String fieldName) {
        JsonNode node = parentNode.get(fieldName);
        if (node != null && node.isObject()) {
            try {
                return objectMapper.convertValue(node, new TypeReference<Map<String, String>>() {});
            } catch (IllegalArgumentException e) {
                log.warn("Failed to convert JsonNode '{}' to Map<String, String>: {}", fieldName, e.getMessage());
                return new HashMap<>(); // Return empty map on conversion error
            }
        }
        return new HashMap<>(); // Return empty map if field not found or not an object
    }

    /**
     * Builds a MultiValueMap of query parameters from a JSON node.
     *
     * @param node The JSON node containing the query parameters. It
     *                        should be a JSON object
     *                        where each key is the parameter name and each value is
     *                        the parameter value.
     * @return A MultiValueMap representing the query parameters. Returns an empty
     *         MultiValueMap if the
     *         input node is null or not an object.
     */
    MultiValueMap<String, String> getJsonNodeAsMultiValueMap(JsonNode node) {
        LinkedMultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        if (node != null && node.isObject()) {
            node.properties().forEach(entry -> {
                if (entry.getValue() != null && !entry.getValue().isNull()) {
                    params.add(entry.getKey(), entry.getValue().asText());
                } else {
                    log.warn("parameter '{}' has a null value and will be skipped.", entry.getKey());
                }
            });
        }
        log.error("Built parameters: {}", params);
        return params;
    }

    /**
     * Builds an array of URI variables from a JSON node.
     *
     * @param uriVariablesNode The JSON node containing the URI variables. It should
     *                         be a JSON object where each
     *                         key is the variable name and each value is the
     *                         variable value. The order of variables
     *                         in the array will match the order of the fields in
     *                         the JSON object.
     * @param uriVariablesPath The path to use with uriVariables.
     * @return An array of objects representing the URI variables. Returns an empty
     *         array if the input node is
     *         null or not an object. If `uriVariablesPath` is present then the
     *         value will be extracted from there.
     */
    Object[] buildUriVariables(JsonNode uriVariablesNode, String uriVariablesPath) {
        Object[] uriVariables = new Object[0];
        if (uriVariablesNode != null && uriVariablesNode.isObject()) {
            if (uriVariablesPath != null) {
                JsonNode targetNode = uriVariablesNode.get(uriVariablesPath);
                if (targetNode != null && targetNode.isArray()) {
                    uriVariables = new Object[targetNode.size()];
                    for (int i = 0; i < targetNode.size(); i++) {
                        uriVariables[i] = targetNode.get(i).asText();
                    }
                } else {
                    log.warn("uriVariablesPath '{}' not found or not an array. Returning empty uriVariables.",
                            uriVariablesPath);
                }

            } else {
                // Convert the uriVariablesNode to a Map<String, String>
                Map<String, String> uriVariablesMap = objectMapper.convertValue(uriVariablesNode,
                        new TypeReference<>() {
                        });

                // Extract the values from the map into an array
                uriVariables = uriVariablesMap.values().toArray(new Object[0]);
            }
        }
        log.error("Built URI variables: {}", uriVariables);
        return uriVariables;
    }

    /**
     * Builds a request body string from a JSON node.
     *
     * @param inputJsonNode The JSON node containing the overall request
     *                      configuration.
     * @return A string representation of the request body. Returns an empty string
     *         if the "requestBody"
     *         field is missing or null. If an error occurs while serializing the
     *         request body, an
     *         IllegalArgumentException is thrown.
     */
    String buildRequestBody(JsonNode inputJsonNode) {
        JsonNode requestBodyNode = inputJsonNode.get("requestBody");
        if (requestBodyNode != null && !requestBodyNode.isNull()) {
            try {
                return objectMapper.writeValueAsString(requestBodyNode);
            } catch (Exception e) {
                throw new IllegalArgumentException("Error serializing request body", e);
            }
        }
        log.error("Request body is empty.");
        return "";
    }

    /**
     * Determines the HTTP method to use for the request based on the provided JSON
     * configuration.
     *
     * @param root The root JSON node containing the configuration.
     * @return The HTTP method to use for the request. Defaults to GET if the
     *         "httpMethod" field is missing,
     *         null, or contains an invalid value.
     */
    HttpMethod determineHttpMethod(JsonNode root) {
        String method = getNodeAsText(root, "httpMethod", "GET").toUpperCase();
        HttpMethod httpMethod = switch (method) {
            case "POST" -> HttpMethod.POST;
            case "PUT" -> HttpMethod.PUT;
            case "DELETE" -> HttpMethod.DELETE;
            case "PATCH" -> HttpMethod.PATCH;
            default -> HttpMethod.GET;
        };
        log.error("Determined HTTP method: {}", httpMethod);
        return httpMethod;
    }

    /**
     * Logs the details of the request and the response received from the external
     * API.
     *
     * @param inputJsonNode The JSON node representing the request details.
     * @param responseBody  The response body received from the external API.
     */
    private void logRequestResponse(JsonNode inputJsonNode, String responseBody) {
        log.info("Request Details: {}", inputJsonNode.toString());
        log.info("Response: {}", responseBody);
    }
}
