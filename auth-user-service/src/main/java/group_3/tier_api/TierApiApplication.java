package group_3.tier_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;

import group_3.tier_api.TierApiApplication;

@SpringBootApplication
@ComponentScan(basePackages = "group_3.tier_api.backend", excludeFilters = @Filter(type = FilterType.REGEX, pattern = "group_3\\.tier_api\\.backend\\.controllers\\..*"))
public class TierApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(TierApiApplication.class, args);
	}

}
