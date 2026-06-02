package co.edu.uptc.swii.posts_service.application.port.out;

import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface PostRepositoryPort {
    Optional<PostAggregate> findById(Integer postId);
    Optional<PostAggregate> findTopByOrderByIdDesc();
    PostAggregate save(PostAggregate post);
    List<PostAggregate> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<PostAggregate> findByHiddenFalseOrderByCreatedAtDesc(Pageable pageable);
    List<PostAggregate> findByTopicIdOrderByCreatedAtDesc(String topicId);
    List<PostAggregate> findByTopicIdAndHiddenFalseOrderByCreatedAtDesc(String topicId);
    void saveAll(List<PostAggregate> posts);
    void deleteById(Integer postId);
}