package co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web;

import co.edu.uptc.swii.posts_service.application.port.in.CreatePostUseCase;
import co.edu.uptc.swii.posts_service.application.port.in.DeletePostUseCase;
import co.edu.uptc.swii.posts_service.application.port.in.ReadPostUseCase;
import co.edu.uptc.swii.posts_service.application.port.in.UpdatePostUseCase;
import co.edu.uptc.swii.posts_service.domain.exception.DomainException;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.security.AuthenticatedUser;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.CreatePostRequest;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.CommentRequest;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostMapper;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.UpdatePostRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final CreatePostUseCase createPostUseCase;
    private final ReadPostUseCase readPostUseCase;
    private final UpdatePostUseCase updatePostUseCase;
    private final DeletePostUseCase deletePostUseCase;
    private final PostMapper postMapper;

    public PostController(
            CreatePostUseCase createPostUseCase,
            ReadPostUseCase readPostUseCase,
            UpdatePostUseCase updatePostUseCase,
            DeletePostUseCase deletePostUseCase,
            PostMapper postMapper
    ) {
        this.createPostUseCase = createPostUseCase;
        this.readPostUseCase = readPostUseCase;
        this.updatePostUseCase = updatePostUseCase;
        this.deletePostUseCase = deletePostUseCase;
        this.postMapper = postMapper;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only students can create posts");
        return createPostUseCase.createPost(postMapper.toCreateCommand(request, user.userId()));
    }

    @GetMapping("/{postId}")
    public PostResponse accessPost(@PathVariable Integer postId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()) && !"admin".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin or student can access posts");
        return readPostUseCase.accessPost(postId, user.userId(), user.role());
    }

    @PostMapping("/{postId}/view")
    public PostResponse viewPost(@PathVariable Integer postId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only students can view posts");
        return readPostUseCase.viewPost(postId, user.userId());
    }

    @GetMapping("/feed/latest")
    public List<PostResponse> latestFeed(@RequestParam(defaultValue = "20") Integer limit, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()) && !"admin".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin or student can access feed");
        if (limit == null || limit <= 0 || limit > 100)
            throw new DomainException(HttpStatus.BAD_REQUEST, "limit must be between 1 and 100");
        return readPostUseCase.getLatestFeed(limit, "admin".equalsIgnoreCase(user.role()), user.userId());
    }

    @GetMapping
    public List<PostResponse> getPostsByTopic(@RequestParam(name = "temaId") String temaId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()) && !"admin".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin or student can access posts");
        if (temaId == null || temaId.isBlank())
            throw new DomainException(HttpStatus.BAD_REQUEST, "temaId is required");
        return readPostUseCase.getPostsByTopicId(temaId, "admin".equalsIgnoreCase(user.role()), user.userId());
    }

    @PutMapping("/{postId}")
    public PostResponse updatePost(@PathVariable Integer postId, @Valid @RequestBody UpdatePostRequest request, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only students can update posts");
        return updatePostUseCase.updatePost(postMapper.toUpdateCommand(postId, request, user.userId()));
    }

    @PatchMapping("/{postId}/visibility")
    public PostResponse togglePostVisibility(@PathVariable Integer postId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"admin".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin can change post visibility");
        return updatePostUseCase.toggleVisibility(postId, user.userId(), user.role());
    }

    @PostMapping("/{postId}/vote")
    public PostResponse votePost(@PathVariable Integer postId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only students can vote posts");
        return updatePostUseCase.votePost(postId, user.userId());
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(@PathVariable Integer postId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (!"estudiante".equalsIgnoreCase(user.role()) && !"student".equalsIgnoreCase(user.role()) && !"admin".equalsIgnoreCase(user.role()))
            throw new DomainException(HttpStatus.FORBIDDEN, "Only admin or student can delete posts");
        deletePostUseCase.deletePost(postId, user.userId(), user.role());
    }

    @GetMapping("/{postId}/comments")
    public List<PostResponse.CommentResponse> getComments(@PathVariable Integer postId, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        return readPostUseCase.getComments(postId);
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse.CommentResponse addComment(@PathVariable Integer postId, @RequestBody CommentRequest request, @AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new DomainException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        if (request.text() == null || request.text().isBlank()) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "Comment text is required");
        }
        return updatePostUseCase.addComment(postId, request.text(), user.userId());
    }
}