package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "posts")
public class PostDocument {
    @Id
    private Integer id;
    private String title;
    private String description;
    private String fileUrl;
    private String textContent;
    private Integer votes;
    private Integer accessPoints;
    private Boolean blocked;
    private Boolean hidden;
    private LocalDateTime createdAt;
    private String authorId;
    private String topicId;
    private Set<String> unlockedByUsers;
    private Set<String> votedByUsers;
    private Integer rewardedVotes;

    public PostDocument() {
        this.unlockedByUsers = new HashSet<>();
        this.votedByUsers = new HashSet<>();
        this.rewardedVotes = 0;
        this.hidden = false;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getTextContent() { return textContent; }
    public void setTextContent(String textContent) { this.textContent = textContent; }
    public Integer getVotes() { return votes; }
    public void setVotes(Integer votes) { this.votes = votes; }
    public Integer getAccessPoints() { return accessPoints; }
    public void setAccessPoints(Integer accessPoints) { this.accessPoints = accessPoints; }
    public Boolean getBlocked() { return blocked; }
    public void setBlocked(Boolean blocked) { this.blocked = blocked; }
    public Boolean getHidden() { return hidden; }
    public void setHidden(Boolean hidden) { this.hidden = hidden; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    public String getTopicId() { return topicId; }
    public void setTopicId(String topicId) { this.topicId = topicId; }
    public Set<String> getUnlockedByUsers() { return unlockedByUsers; }
    public void setUnlockedByUsers(Set<String> unlockedByUsers) { this.unlockedByUsers = unlockedByUsers; }
    public Set<String> getVotedByUsers() { return votedByUsers; }
    public void setVotedByUsers(Set<String> votedByUsers) { this.votedByUsers = votedByUsers; }
    public Integer getRewardedVotes() { return rewardedVotes; }
    public void setRewardedVotes(Integer rewardedVotes) { this.rewardedVotes = rewardedVotes; }
}