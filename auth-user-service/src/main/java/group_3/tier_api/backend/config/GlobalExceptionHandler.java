package group_3.tier_api.backend.config;

import com.mongodb.MongoException;
import com.mongodb.MongoTimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({
            MongoTimeoutException.class,
            DataAccessResourceFailureException.class,
            MongoException.class
    })
    public ResponseEntity<Map<String, Object>> handleMongoDbException(Exception e) {
        logger.error("MongoDB connection error: {}", e.getMessage(), e);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Database Connection Error");
        errorResponse.put("message", "Failed to connect to the database. Please try again later.");
        errorResponse.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        errorResponse.put("timestamp", System.currentTimeMillis());

        // Add detailed error info in development mode
        if (logger.isDebugEnabled()) {
            errorResponse.put("exception", e.getClass().getName());
            errorResponse.put("details", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
    }
}