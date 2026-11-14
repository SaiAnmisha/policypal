package com.policypal.ask;

import java.util.List;

public record AskResponse(String answer, List<Source> sources) {
}