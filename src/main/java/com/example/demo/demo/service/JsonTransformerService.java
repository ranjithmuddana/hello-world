package com.example.demo.demo.service;

import com.bazaarvoice.jolt.Chainr;
import com.bazaarvoice.jolt.JsonUtils;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for performing JSON transformations using Jolt.
 * It provides a method to transform an input JSON string based on a given Jolt specification.
 */
@Service
public class JsonTransformerService {

    /**
     * Transforms an input JSON string using a provided Jolt specification.
     *
     * @param inputJson The input JSON string.
     * @param transformerSpec The Jolt transformation specification string.
     * @return The transformed JSON string.
     */
    public String transform(String inputJson, String transformerSpec) {
        List<Object> spec = JsonUtils.jsonToList(transformerSpec);
        Chainr chainr = Chainr.fromSpec(spec);
        Object input = JsonUtils.jsonToObject(inputJson);
        Object transformedOutput = chainr.transform(input);
        return JsonUtils.toJsonString(transformedOutput);
    }
}