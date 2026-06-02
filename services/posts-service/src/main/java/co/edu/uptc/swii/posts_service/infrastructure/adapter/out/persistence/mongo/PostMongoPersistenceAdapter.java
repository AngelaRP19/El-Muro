package co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo;

import co.edu.uptc.swii.posts_service.application.port.out.PostRepositoryPort;
import co.edu.uptc.swii.posts_service.domain.model.PostAggregate;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.document.PostDocument;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.mapper.PostDocumentMapper;
import co.edu.uptc.swii.posts_service.infrastructure.adapter.out.persistence.mongo.repository.PostMongoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class PostMongoPersistenceAdapter implements PostRepositoryPort {

    private final PostMongoRepository mongoRepository;
    private final PostDocumentMapper mapper;

    public PostMongoPersistenceAdapter(PostMongoRepository mongoRepository, PostDocumentMapper mapper) {
        this.mongoRepository = mongoRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<PostAggregate> findById(Integer postId) {
        return mongoRepository.findById(postId).map(mapper::toAggregate);
    }

    @Override
    public Optional<PostAggregate> findTopByOrderByIdDesc() {
        return Optional.ofNullable(mongoRepository.findTopByOrderByIdDesc()).map(mapper::toAggregate);
    }

    @Override
    public PostAggregate save(PostAggregate post) {
        PostDocument saved = mongoRepository.save(mapper.toDocument(post));
        return mapper.toAggregate(saved);
    }

    @Override
    public List<PostAggregate> findAllByOrderByCreatedAtDesc(Pageable pageable) {
        return mongoRepository.findAllByOrderByCreatedAtDesc(pageable).stream().map(mapper::toAggregate).toList();
    }

    @Override
    public List<PostAggregate> findByHiddenFalseOrderByCreatedAtDesc(Pageable pageable) {
        return mongoRepository.findByHiddenFalseOrderByCreatedAtDesc(pageable).stream().map(mapper::toAggregate).toList();
    }

    @Override
    public List<PostAggregate> findByTopicIdOrderByCreatedAtDesc(String topicId) {
        return mongoRepository.findByTopicIdOrderByCreatedAtDesc(topicId).stream().map(mapper::toAggregate).toList();
    }

    @Override
    public List<PostAggregate> findByTopicIdAndHiddenFalseOrderByCreatedAtDesc(String topicId) {
        return mongoRepository.findByTopicIdAndHiddenFalseOrderByCreatedAtDesc(topicId).stream().map(mapper::toAggregate).toList();
    }

    @Override
    public void saveAll(List<PostAggregate> posts) {
        mongoRepository.saveAll(posts.stream().map(mapper::toDocument).toList());
    }

    @Override
    public void deleteById(Integer postId) {
        mongoRepository.deleteById(postId);
    }
}