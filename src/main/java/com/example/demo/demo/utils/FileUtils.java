package com.example.demo.demo.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Utility class for file-related operations.
 */
public class FileUtils {

    /**
     * Converts a {@link MultipartFile} into a {@link String}.
     * This is useful for reading the entire content of a text file into a single string.
     *
     * @param file The {@link MultipartFile} to convert.
     * @return A {@link String} containing the file's content.
     * @throws RuntimeException if an error occurs during reading the file content.
     */
    public static String toString(MultipartFile file) {
        try {
            return new String(file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file content", e);
        }
    }
}