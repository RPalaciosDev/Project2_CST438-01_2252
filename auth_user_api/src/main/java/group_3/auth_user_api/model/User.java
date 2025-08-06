package group_3.auth_user_api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String username;
    private String password;
    private String name;
    private String picture;
    private List<String> roles; // Example: ["USER", "ADMIN"]
    private Instant createdAt;
    private String jwtToken; // Store last issued JWT (optional)
    private String gender;
    private String lookingFor;
    private String relationshipType;
    private int age;
    private boolean hasCompletedOnboarding;

    public User() {
        this.createdAt = Instant.now();
        this.hasCompletedOnboarding = false; // Default to false for new users
    }

    public User(String email, String name, String picture, List<String> roles) {
        this.email = email;
        this.name = name;
        this.picture = picture;
        this.roles = roles;
        this.createdAt = Instant.now();
    }

    public User(String username, String email, String password, List<String> roles, boolean isPasswordEncoded) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.roles = roles;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getJwtToken() {
        return jwtToken;
    }

    public void setJwtToken(String jwtToken) {
        this.jwtToken = jwtToken;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getLookingFor() {
        return lookingFor;
    }

    public void setLookingFor(String lookingFor) {
        this.lookingFor = lookingFor;
    }

    public String getRelationshipType() {
        return relationshipType;
    }

    public void setRelationshipType(String relationshipType) {
        this.relationshipType = relationshipType;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public boolean getHasCompletedOnboarding() {
        return hasCompletedOnboarding;
    }

    public void setHasCompletedOnboarding(boolean hasCompletedOnboarding) {
        this.hasCompletedOnboarding = hasCompletedOnboarding;
    }
}
