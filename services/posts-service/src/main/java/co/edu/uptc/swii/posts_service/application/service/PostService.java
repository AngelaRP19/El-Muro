package co.edu.uptc.swii.posts_service.application.service;

import co.edu.uptc.swii.posts_service.application.port.out.AuthMeshPort;
import co.edu.uptc.swii.posts_service.application.port.out.PointsCachePort;
import co.edu.uptc.swii.posts_service.application.port.out.PostRepositoryPort;
import co.edu.uptc.swii.posts_service.application.usecase.CreatePostCommand;
import co.edu.uptc.swii.posts_service.application.usecase.UpdatePostCommand;
import co.edu.uptc.swii.posts_service.domain.exception.DomainException;
import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostMapper;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;
import co.edu.uptc.swii.posts_service.infrastructure.config.CacheNames;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
public class PostService {

    private final PostRepositoryPort postRepository;
    private final AuthMeshPort authMeshPort;
    private final PointsCachePort pointsCachePort;
    private final PostMapper postMapper;

    public PostService(
            PostRepositoryPort postRepository,
            AuthMeshPort authMeshPort,
            PointsCachePort pointsCachePort,
            PostMapper postMapper
    ) {
        this.postRepository = postRepository;
        this.authMeshPort = authMeshPort;
        this.pointsCachePort = pointsCachePort;
        this.postMapper = postMapper;
    }

    @CacheEvict(cacheNames = CacheNames.FEED_LATEST, allEntries = true)
    public PostResponse createPost(CreatePostCommand command) {
        if (command.authenticatedUserId() == null || command.authenticatedUserId().isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = new PostAggregate();
        post.setId(generatePostId());
        post.setTitle(command.title());
        post.setDescription(command.description());
        post.setFileUrl(command.fileUrl());
        post.setTextContent(command.textContent());
        post.setVotes(0);
        post.setAccessPoints(command.accessPoints());
        post.setBlocked(command.accessPoints() > 0);
        post.setHidden(false);
        post.setCreatedAt(LocalDateTime.now());
        post.setAuthorId(command.authenticatedUserId());
        post.setTopicId(command.topicId());

        PostAggregate saved = postRepository.save(post);
        return postMapper.toResponse(saved, authMeshPort.getUserName(saved.getAuthorId()));
    }

    public PostResponse accessPost(Integer postId, String authenticatedUserId, String role) {
        if (authenticatedUserId == null || authenticatedUserId.isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = postRepository.findById(postId)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "Post not found"));

        if (Boolean.TRUE.equals(post.getHidden()) && !"admin".equalsIgnoreCase(role)) {
            throw new DomainException(HttpStatus.NOT_FOUND, "Post not found");
        }

        if (Boolean.TRUE.equals(post.getBlocked()) && !post.getAuthorId().equals(authenticatedUserId)) {
            if (post.getUnlockedByUsers() == null || !post.getUnlockedByUsers().contains(authenticatedUserId)) {
                int points = pointsCachePort.getUserPoints(authenticatedUserId);
                if (post.getAccessPoints() > points) {
                    throw new DomainException(HttpStatus.FORBIDDEN, "Insufficient points to unlock this post");
                }

                authMeshPort.deductPoints(authenticatedUserId, post.getAccessPoints(), "post-unlock");
                pointsCachePort.evictUserPoints(authenticatedUserId);

                if (post.getUnlockedByUsers() == null) {
                    post.setUnlockedByUsers(new HashSet<>());
                }
                post.getUnlockedByUsers().add(authenticatedUserId);
                post.setBlocked(false);
                postRepository.save(post);
            }
        }

        return postMapper.toResponse(post, authMeshPort.getUserName(post.getAuthorId()));
    }

    public PostResponse viewPost(Integer postId, String authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId.isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = postRepository.findById(postId)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "Post not found"));

        if (Boolean.TRUE.equals(post.getHidden())) {
            throw new DomainException(HttpStatus.NOT_FOUND, "Post not found");
        }

        if (!post.getAuthorId().equals(authenticatedUserId)) {
            int currentPoints = pointsCachePort.getUserPoints(authenticatedUserId);
            if (currentPoints < 3) {
                throw new DomainException(HttpStatus.FORBIDDEN, "Insufficient points to view post (need 3 points)");
            }

            authMeshPort.deductPoints(authenticatedUserId, 3, "post-view");
            pointsCachePort.evictUserPoints(authenticatedUserId);
        }

        return postMapper.toResponse(post, authMeshPort.getUserName(post.getAuthorId()));
    }

    @CacheEvict(cacheNames = CacheNames.FEED_LATEST, allEntries = true)
    public PostResponse updatePost(UpdatePostCommand command) {
        if (command.authenticatedUserId() == null || command.authenticatedUserId().isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = postRepository.findById(command.postId())
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "Post not found"));

        if (!post.getAuthorId().equals(command.authenticatedUserId())) {
            throw new DomainException(HttpStatus.FORBIDDEN, "Only the post owner can update this post");
        }

        long minutesFromCreation = Duration.between(post.getCreatedAt(), LocalDateTime.now()).toMinutes();
        if (minutesFromCreation > 10) {
            throw new DomainException(HttpStatus.FORBIDDEN, "Post can only be updated during the first 10 minutes");
        }

        post.setTitle(command.title());
        post.setDescription(command.description());
        post.setFileUrl(command.fileUrl());
        post.setTextContent(command.textContent());
        post.setAccessPoints(command.accessPoints());
        post.setBlocked(command.accessPoints() > 0);
        post.setTopicId(command.topicId());

        PostAggregate saved = postRepository.save(post);
        return postMapper.toResponse(saved, authMeshPort.getUserName(saved.getAuthorId()));
    }

    @CacheEvict(cacheNames = CacheNames.FEED_LATEST, allEntries = true)
    public PostResponse toggleVisibility(Integer postId, String authenticatedUserId, String role) {
        if (authenticatedUserId == null || authenticatedUserId.isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = postRepository.findById(postId)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "Post not found"));

        if (!"admin".equalsIgnoreCase(role)) {
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin can change post visibility");
        }

        post.setHidden(!Boolean.TRUE.equals(post.getHidden()));
        PostAggregate saved = postRepository.save(post);
        return postMapper.toResponse(saved, authMeshPort.getUserName(saved.getAuthorId()));
    }

    @CacheEvict(cacheNames = CacheNames.FEED_LATEST, allEntries = true)
    public PostResponse votePost(Integer postId, String authenticatedUserId) {
        if (authenticatedUserId == null || authenticatedUserId.isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = postRepository.findById(postId)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "Post not found"));

        if (Boolean.TRUE.equals(post.getHidden())) {
            throw new DomainException(HttpStatus.NOT_FOUND, "Post not found");
        }

        if (post.getAuthorId().equals(authenticatedUserId)) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "You cannot vote your own post");
        }
        if (post.getVotedByUsers() != null && post.getVotedByUsers().contains(authenticatedUserId)) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "You have already voted this post");
        }

        if (post.getVotedByUsers() == null) {
            post.setVotedByUsers(new HashSet<>());
        }
        post.getVotedByUsers().add(authenticatedUserId);
        post.setVotes(post.getVotes() + 1);

        int newVotes = post.getVotes();
        int rewardedVotes = post.getRewardedVotes() != null ? post.getRewardedVotes() : 0;
        int votesNeededForReward = (rewardedVotes + 1) * 3;

        if (newVotes >= votesNeededForReward) {
            authMeshPort.addPoints(post.getAuthorId(), 1, "post-3-votes");
            pointsCachePort.evictUserPoints(post.getAuthorId());
            post.setRewardedVotes(rewardedVotes + 1);
        }

        PostAggregate saved = postRepository.save(post);
        return postMapper.toResponse(saved, authMeshPort.getUserName(saved.getAuthorId()));
    }

    @Cacheable(cacheNames = CacheNames.FEED_LATEST, key = "#limit")
    public List<PostResponse> getLatestFeed(Integer limit, boolean includeHidden) {
        List<PostAggregate> posts = includeHidden
                ? postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                : postRepository.findByHiddenFalseOrderByCreatedAtDesc(PageRequest.of(0, limit));
        return posts.stream().map(post -> postMapper.toResponse(post, authMeshPort.getUserName(post.getAuthorId()))).toList();
    }

    public List<PostResponse> getPostsByTopicId(String topicId, boolean includeHidden) {
        List<PostAggregate> posts = includeHidden
                ? postRepository.findByTopicIdOrderByCreatedAtDesc(topicId)
                : postRepository.findByTopicIdAndHiddenFalseOrderByCreatedAtDesc(topicId);
        return posts.stream().map(post -> postMapper.toResponse(post, authMeshPort.getUserName(post.getAuthorId()))).toList();
    }

    @CacheEvict(cacheNames = CacheNames.FEED_LATEST, allEntries = true)
    public void deletePost(Integer postId, String authenticatedUserId, String role) {
        if (authenticatedUserId == null || authenticatedUserId.isBlank()) {
            throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        PostAggregate post = postRepository.findById(postId)
                .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "Post not found"));

        boolean isAdmin = "admin".equalsIgnoreCase(role);
        boolean isOwner = post.getAuthorId().equals(authenticatedUserId);
        if (!isAdmin && !isOwner) {
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin or owner can delete this post");
        }

        postRepository.deleteById(postId);
    }

    public void seedPosts(List<PostAggregate> posts) {
        postRepository.saveAll(posts);
    }

    private Integer generatePostId() {
        return postRepository.findTopByOrderByIdDesc().map(PostAggregate::getId).orElse(0) + 1;
    }
}