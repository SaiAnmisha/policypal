package com.policypal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@ConfigurationPropertiesScan
@SpringBootApplication
public class PolicypalApplication {

	public static void main(String[] args) {
		SpringApplication.run(PolicypalApplication.class, args);
	}

}
