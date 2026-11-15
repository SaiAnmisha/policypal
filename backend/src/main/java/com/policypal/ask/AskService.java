package com.policypal.ask;

import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.policypal.tools.DateTools;

import reactor.core.publisher.Flux;

@Service
public class AskService {

    private static final String NO_ANSWER = "I don't know based on the uploaded documents.";

        private static final String SYSTEM_PROMPT = """
            You answer questions about the user's documents.
            Use ONLY the information in the CONTEXT for facts about the documents.

            When the question needs a date or a calculation, follow these steps:
            1. Find the rule in the CONTEXT that matches the user's situation.
               For example, with three years of service, use the rule for two to five years.
            2. Say which rule you used and the number it gives, for example "two months' notice".
            3. Call the date tool with that number, not a number from the question.
            4. Give the exact result from the tool. Do not round it.
            Never work out dates or pro rata amounts yourself.

            If the CONTEXT does not contain the answer, reply with exactly:
            I don't know based on the uploaded documents.
            Keep the answer short and clear. Never make anything up.
            """;

    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final DateTools dateTools;

    public AskService(VectorStore vectorStore, ChatClient.Builder chatClientBuilder, DateTools dateTools) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
        this.dateTools = dateTools;
    }

    // Normal version: waits for the full answer
    public AskResponse ask(String question) {
        List<Document> matches = findMatches(question);
        if (matches.isEmpty()) {
            return new AskResponse(NO_ANSWER, List.of());
        }

        String answer = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(buildUserMessage(question, matches))
                .tools(dateTools)
                .call()
                .content();

        if (isNoAnswer(answer)) {
            return new AskResponse(NO_ANSWER, List.of());
        }
        return new AskResponse(answer.trim(), toSources(matches));
    }

    // Streaming version: sends the answer piece by piece
    public Flux<ServerSentEvent<Object>> askStream(String question) {
        List<Document> matches = findMatches(question);
        if (matches.isEmpty()) {
            return Flux.just(
                    event("token", new Token(NO_ANSWER)),
                    event("sources", List.of()),
                    event("done", ""));
        }

        StringBuilder fullAnswer = new StringBuilder();

        Flux<ServerSentEvent<Object>> tokens = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user(buildUserMessage(question, matches))
                .tools(dateTools)
                .stream()
                .content()
                .doOnNext(fullAnswer::append)
                .map(text -> event("token", new Token(text)));

        // Runs only after the last token, when we know the full answer
        Flux<ServerSentEvent<Object>> ending = Flux.defer(() -> {
            List<Source> sources = isNoAnswer(fullAnswer.toString()) ? List.of() : toSources(matches);
            return Flux.just(event("sources", sources), event("done", ""));
        });

        return tokens.concatWith(ending);
    }

    private List<Document> findMatches(String question) {
        if (question == null || question.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please type a question");
        }
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(question)
                        .topK(4)
                        .similarityThreshold(0.5)
                        .build());
    }

    private String buildUserMessage(String question, List<Document> matches) {
        StringBuilder context = new StringBuilder();
        for (Document doc : matches) {
            context.append("[Page ").append(pageOf(doc)).append("]\n")
                    .append(doc.getText())
                    .append("\n\n");
        }
        return "CONTEXT:\n" + context + "\nQUESTION: " + question;
    }

    private boolean isNoAnswer(String answer) {
        return answer == null || answer.isBlank()
                || answer.strip().toLowerCase().replace('\u2019', '\'').startsWith("i don't know");
    }

    private List<Source> toSources(List<Document> matches) {
        return matches.stream()
                .map(doc -> new Source(fileOf(doc), pageOf(doc), snippetOf(doc)))
                .toList();
    }

    private ServerSentEvent<Object> event(String name, Object data) {
        return ServerSentEvent.<Object>builder(data).event(name).build();
    }

    private Integer pageOf(Document doc) {
        Object page = doc.getMetadata().get("page_number");
        return page instanceof Number number ? number.intValue() : null;
    }

    private String fileOf(Document doc) {
        Object name = doc.getMetadata().get("file_name");
        return name != null ? name.toString() : "unknown";
    }

    private String snippetOf(Document doc) {
        String text = doc.getText() == null ? "" : doc.getText().strip();
        return text.length() > 150 ? text.substring(0, 150) + "..." : text;
    }
}