package com.example.demo.demo.service;

import com.bazaarvoice.jolt.JsonUtils;
import com.bazaarvoice.jolt.exception.JsonUnmarshalException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JsonTransformerServiceTest {

    private JsonTransformerService jsonTransformerService;

    @BeforeEach
    void setUp() {
        jsonTransformerService = new JsonTransformerService();
    }

    @Test
    void testTransformJson() {
        String inputJson = "{\"rating\": 5, \"product\": \"Book\"}";
        String specContent = "[" +
                "  {\"operation\": \"shift\", \"spec\": {\"rating\": \"Rating\"}}" +
                "]";
        String expectedOutputJson = "{\"Rating\":5}";

        String actualOutputJson = jsonTransformerService.transform(inputJson, specContent);

        Map<String, Object> actualMap = JsonUtils.jsonToMap(actualOutputJson);
        Map<String, Object> expectedMap = JsonUtils.jsonToMap(expectedOutputJson);
        assertThat(actualMap).isEqualTo(expectedMap);
    }

    @Test
    void testTransformJsonWithInvalidSpec() {
        String inputJson = "{\"rating\": 5, \"product\": \"Book\"}";
        String invalidSpecContent = "invalid json"; // This is not a valid JSON array for Jolt spec

        JsonUnmarshalException exception = assertThrows(JsonUnmarshalException.class, () -> {
            jsonTransformerService.transform(inputJson, invalidSpecContent);
        });

        assertTrue(exception.getMessage().contains("Unable to unmarshal JSON to a List."));
    }



    @Test
    void testTransformJsonWithEmptyInput() {
        String inputJson = "{}";
        String specContent = "[" +
                "  {\"operation\": \"shift\", \"spec\": {\"rating\": \"Rating\"}}" +
                "]";
        String actualOutputJson = jsonTransformerService.transform(inputJson, specContent);
        assertThat(actualOutputJson).isEqualTo("null");
    }
}