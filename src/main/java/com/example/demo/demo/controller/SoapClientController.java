package com.example.demo.demo.controller;

import com.example.demo.demo.service.RestClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/soap")
public class SoapClientController {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Autowired
    public SoapClientController(RestClient restClient, ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/invoke", consumes = MediaType.APPLICATION_XML_VALUE, produces = MediaType.APPLICATION_XML_VALUE)
    public String invoke(@RequestBody String soapRequest,
                         @RequestHeader(value = "X-version", required = false, defaultValue = "v1") String version,
                        @RequestHeader(value = "X-http-method", required = false, defaultValue = "POST") String httpMethod,
                        @RequestHeader(value = "X-http-content-type", required = false, defaultValue = MediaType.TEXT_XML_VALUE) String contentType,
                         @RequestHeader(value = "X-Base-URL", required = false, defaultValue = "http://localhost:8000") String baseUrl) {

        if(soapRequest == null || soapRequest.isEmpty()) {
            throw new IllegalArgumentException("SOAP request cannot be null or empty");
        }

        if(StringUtils.substringMatch(version, 0, "v1")) {
            // Handle version 1 specific logic if needed
            return restClient.processSoapRequest(soapRequest, baseUrl);
        } else if(StringUtils.substringMatch(version, 0, "v2")) {
            // Handle version 2 specific logic if needed
            try {
                ObjectNode rootNode = objectMapper.createObjectNode();
                rootNode.put("httpMethod", httpMethod);
                rootNode.put("requestBody", soapRequest);
                rootNode.put("baseUrl", baseUrl);
                Map<String, String> map = Map.of(
                        "Content-Type", contentType
                );
                rootNode.putPOJO("headers", map);



                String finalInputJson = objectMapper.writeValueAsString(rootNode);
                return restClient.processData(finalInputJson);

            } catch (Exception e) {
                // Log the error and return an appropriate error response
                // For simplicity, returning error message in XML format
                return "<error>" + e.getMessage() + "</error>";
            }
        } else {
            throw new IllegalArgumentException("Unsupported SOAP version: " + version);
        }
    }
}
