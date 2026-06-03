package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.repository;

import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.document.PostDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMongoRepository extends MongoRepository<PostDocument, Integer> {
    List<PostDocument> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<PostDocument> findByHiddenFalseOrderByCreatedAtDesc(Pageable pageable);

    List<PostDocument> findByTopicIdOrderByCreatedAtDesc(String topicId);

    List<PostDocument> findByTopicIdAndHiddenFalseOrderByCreatedAtDesc(String topicId);

    PostDocument findTopByOrderByIdDesc();
}