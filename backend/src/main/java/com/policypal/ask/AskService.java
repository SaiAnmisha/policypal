package com.policypal.ask;

import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AskService {

    private static final String NO_ANSWER = "I don't know based on the uploaded documents.";

    private static final String SYSTEM_PROMPT = """
            You answer questions about the user's documents.
            Use ONLY the information in the CONTEXT.
            If the CONTEXT does not contain the answer, reply with exactly:
            I don't know based on the uploaded documents.
            Keep the answer short and clear. Never make anything up.
            """;

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    public AskService(VectorStore vectorStore, ChatClient.Builder chatClientBuilder) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
    }

    public AskResponse ask(String question) {
        if (question == null || question.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please type a question");
        }

        // Find the 4 chunks closest in meaning to the question
        List<Document> matches = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(question)
                        .topK(4)
                        .similarityThreshold(0.5)
                        .build());

        // Nothing relevant found, so don't ask the model at all
        if (matches.isEmpty()) {
            return new AskResponse(NO_ANSWER, List.of());
        }

        // Put the matching chunks together, each labelled with its page
        StringBuilder context = new StringBuilder();
        for (Document doc : matches) {
            context.append("[Page ").append(pageOf(doc)).append("]\n")
                    .append(doc.getText())
                    .append("\n\n");
        }

        String answer = chatClient.prompt()
                .system(SYSTEM_PROMPT)
                .user("CONTEXT:\n" + context + "\nQUESTION: " + question)
                .call()
                .content();

        // If the model couldn't answer, don't show sources that didn't help
        if (answer == null || answer.toLowerCase().replace('\u2019', '\'').startsWith("i don't know")) {
            return new AskResponse(NO_ANSWER, List.of());
        }

        List<Source> sources = matches.stream()
                .map(doc -> new Source(fileOf(doc), pageOf(doc), snippetOf(doc)))
                .toList();

        return new AskResponse(answer.trim(), sources);
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