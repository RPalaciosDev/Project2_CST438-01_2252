package group_3.tier_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

import group_3.tier_api.TierApiApplication;

@SpringBootApplication
@ComponentScan(basePackages = "group_3.tier_api.backend")
public class TierApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(TierApiApplication.class, args);
	}

}
