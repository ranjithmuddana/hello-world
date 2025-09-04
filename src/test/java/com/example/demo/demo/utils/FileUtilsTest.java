package com.example.demo.demo.utils;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FileUtilsTest {

    @Test
    void testToString_success() {
        String content = "Hello, World!";
        MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                content.getBytes()
        );

        String result = FileUtils.toString(multipartFile);
        assertEquals(content, result);
    }

    @Test
    void testToString_emptyFile() {
        String content = "";
        MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                content.getBytes()
        );

        String result = FileUtils.toString(multipartFile);
        assertEquals(content, result);
    }

    @Test
    void testToString_throwsException() throws IOException {
        // Mock a MultipartFile that throws IOException on getBytes()
        MultipartFile multipartFile = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes()) {
            @Override
            public byte[] getBytes() throws IOException {
                throw new IOException("Simulated IO Error");
            }
        };

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            FileUtils.toString(multipartFile);
        });

        assertEquals("Failed to read file content", exception.getMessage());
        assertEquals(IOException.class, exception.getCause().getClass());
    }
}
