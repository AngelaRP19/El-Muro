package co.edu.uptc.swii.posts_service.application.service;

import co.edu.uptc.swii.posts_service.application.port.out.AuthMeshPort;
import co.edu.uptc.swii.posts_service.application.port.out.PointsCachePort;
import co.edu.uptc.swii.posts_service.application.port.out.PostRepositoryPort;
import co.edu.uptc.swii.posts_service.application.usecase.CreatePostCommand;
import co.edu.uptc.swii.posts_service.application.usecase.UpdatePostCommand;
import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostMapper;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.in.web.dto.PostResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.springframework.http.HttpStatus;

import co.edu.uptc.swii.posts_service.domain.exception.DomainException;

@ExtendWith(MockitoExtension.class)
public class PostServiceTest {

    @Mock
    private PostRepositoryPort postRepository;

    @Mock
    private AuthMeshPort authMeshPort;

    @Mock
    private PointsCachePort pointsCachePort;

    private PostMapper postMapper;
    private PostService postService;

    private PostAggregate mockPost;
    private final Integer POST_ID = 1;
    private final String AUTHOR_ID = "100";
    private final String OTHER_USER_ID = "101";

    @BeforeEach
    void setUp() {
        postMapper = new PostMapper();
        postService = new PostService(postRepository, authMeshPort, pointsCachePort, postMapper);
        mockPost = new PostAggregate();
        mockPost.setId(POST_ID);
        mockPost.setTitle("Test Post");
        mockPost.setDescription("Description");
        mockPost.setTextContent("Content");
        mockPost.setVotes(0);
        mockPost.setAccessPoints(10);
        mockPost.setBlocked(true);
        mockPost.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        mockPost.setAuthorId(AUTHOR_ID);
        mockPost.setTopicId("69ddcd39af373c03557ec194");
    }

    @Test
    void createPost_Success() {
        CreatePostCommand command = new CreatePostCommand("Title", "Desc", null, "Content", 10, "69ddcd39af373c03557ec194", AUTHOR_ID);

        when(authMeshPort.getUserName(anyString())).thenReturn("Test Author");
        when(postRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());
        when(postRepository.save(any(PostAggregate.class))).thenAnswer(i -> {
            PostAggregate p = i.getArgument(0);
            p.setId(1);
            return p;
        });

        PostResponse response = postService.createPost(command);

        assertNotNull(response);
        assertEquals(1, response.id());
        verify(authMeshPort, never()).deductPoints(anyString(), anyInt(), anyString());
        verify(postRepository).save(any(PostAggregate.class));
    }

    @Test
    void accessPost_ByAuthor_Success() {
        when(authMeshPort.getUserName(anyString())).thenReturn("Test Author");
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));

        PostResponse response = postService.accessPost(POST_ID, AUTHOR_ID, "student");
        
        assertNotNull(response);
        verify(authMeshPort, never()).deductPoints(anyString(), anyInt(), anyString());
    }

    @Test
    void accessPost_ByOtherUser_InsufficientPoints() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));
        when(pointsCachePort.getUserPoints(OTHER_USER_ID)).thenReturn(5);

        DomainException exception = assertThrows(DomainException.class, () -> {
            postService.accessPost(POST_ID, OTHER_USER_ID, "student");
        });
        
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertTrue(exception.getMessage().contains("Insufficient points"));
    }

    @Test
    void accessPost_ByOtherUser_SuccessAndUnlock() {
        when(authMeshPort.getUserName(anyString())).thenReturn("Test Author");
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));
        when(pointsCachePort.getUserPoints(OTHER_USER_ID)).thenReturn(15);

        PostResponse response = postService.accessPost(POST_ID, OTHER_USER_ID, "student");
        
        assertNotNull(response);
        assertTrue(mockPost.getUnlockedByUsers().contains(OTHER_USER_ID));
        verify(authMeshPort).deductPoints(eq(OTHER_USER_ID), eq(10), anyString());
        verify(postRepository).save(mockPost);
    }

    @Test
    void accessPost_ByOtherUser_AlreadyUnlocked() {
        mockPost.setUnlockedByUsers(new HashSet<>());
        mockPost.getUnlockedByUsers().add(OTHER_USER_ID);

        when(authMeshPort.getUserName(anyString())).thenReturn("Test Author");
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));

        PostResponse response = postService.accessPost(POST_ID, OTHER_USER_ID, "student");
        
        assertNotNull(response);
        verify(authMeshPort, never()).deductPoints(anyString(), anyInt(), anyString());
        verify(postRepository, never()).save(any(PostAggregate.class));
    }

    @Test
    void votePost_Success() {
        mockPost.setVotes(2);
        when(authMeshPort.getUserName(anyString())).thenReturn("Test Author");
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));
        when(postRepository.save(any(PostAggregate.class))).thenReturn(mockPost);

        PostResponse response = postService.votePost(POST_ID, OTHER_USER_ID);
        
        assertNotNull(response);
        assertEquals(3, mockPost.getVotes());
        assertTrue(mockPost.getVotedByUsers().contains(OTHER_USER_ID));
        verify(authMeshPort).addPoints(eq(AUTHOR_ID), eq(1), eq("post-3-votes"));
    }

    @Test
    void votePost_OwnPost_ThrowsException() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));
        
        DomainException exception = assertThrows(DomainException.class, () -> {
            postService.votePost(POST_ID, AUTHOR_ID);
        });
        
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("own post"));
    }

    @Test
    void votePost_AlreadyVoted_ThrowsException() {
        mockPost.setVotedByUsers(new HashSet<>());
        mockPost.getVotedByUsers().add(OTHER_USER_ID);
        
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(mockPost));
        
        DomainException exception = assertThrows(DomainException.class, () -> {
            postService.votePost(POST_ID, OTHER_USER_ID);
        });
        
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("already voted"));
    }
}