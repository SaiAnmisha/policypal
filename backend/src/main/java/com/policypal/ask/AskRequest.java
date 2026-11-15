package com.policypal.ask;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AskRequest(
        @NotBlank(message = "Please type a question")
        @Size(max = 1000, message = "Questions can be up to 1000 characters")
        String question) {
}