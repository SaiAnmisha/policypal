package com.policypal.ask;

import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/ask")
public class AskController {

    private final AskService askService;

    public AskController(AskService askService) {
        this.askService = askService;
    }

    @PostMapping
    public AskResponse ask(@Valid @RequestBody AskRequest request) {
        return askService.ask(request.question());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Object>> askStream(
            @RequestParam
            @NotBlank(message = "Please type a question")
            @Size(max = 1000, message = "Questions can be up to 1000 characters")
            String question) {
        return askService.askStream(question);
    }
}