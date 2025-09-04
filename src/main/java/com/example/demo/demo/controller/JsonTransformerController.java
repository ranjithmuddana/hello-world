package com.example.demo.demo.controller;

import com.example.demo.demo.service.JsonTransformerService;
import com.example.demo.demo.service.RestClient;
import com.example.demo.demo.utils.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for handling JSON transformation requests.
 * It provides endpoints to transform JSON files using a Jolt specification.
 */
@RestController
@RequestMapping("/api")
public class JsonTransformerController {

    private final JsonTransformerService jsonTransformerService;
    private final RestClient restClient;

    /**
     * Constructs a new JsonTransformerController with the given services.
     *
     * @param jsonTransformerService Service for performing JSON transformations.
     * @param restClient             Client for making REST calls.
     */
    @Autowired
    public JsonTransformerController(JsonTransformerService jsonTransformerService, RestClient restClient) {
        this.jsonTransformerService = jsonTransformerService;
        this.restClient = restClient;
    }

    /**
     * Transforms an input JSON file using a provided Jolt transformer specification file.
     *
     * @param inputJsonFile       The input JSON file.
     * @param transformerSpecFile The Jolt transformer specification file.
     * @return A ResponseEntity with the transformed JSON string.
     */
    @PostMapping(value = "/transform", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> transform(@RequestParam("input_json") MultipartFile inputJsonFile,
                                            @RequestParam("transformer_spec") MultipartFile transformerSpecFile) {
        String inputJson = FileUtils.toString(inputJsonFile);
        String transformerSpec = FileUtils.toString(transformerSpecFile);
        String transformedJson = jsonTransformerService.transform(inputJson, transformerSpec);
        return ResponseEntity.ok(transformedJson);
    }

    /**
     * Invokes an API with the input JSON and then transforms the response using a provided Jolt transformer specification file.
     *
     * @param inputJsonFile       The input JSON file.
     * @param transformerSpecFile The Jolt transformer specification file.
     * @return A ResponseEntity with the transformed JSON string.
     */
    @PostMapping(value = "/invoke-api-transform", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> invokeApiTransform(@RequestParam("input_json") MultipartFile inputJsonFile,
                                                     @RequestParam("output_transformer_spec") MultipartFile transformerSpecFile) {
        String inputJson = FileUtils.toString(inputJsonFile);
        String transformerSpec = FileUtils.toString(transformerSpecFile);
        String apiResponse = restClient.processData(inputJson);
        String transformedJson = jsonTransformerService.transform(apiResponse, transformerSpec);
        return ResponseEntity.ok(transformedJson);
    }
}