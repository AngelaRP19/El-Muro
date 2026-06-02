package edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo;

import edu.uptc.swii.subjects_service.application.ports.out.SubjectRepositoryPort;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.document.SubjectDocument;
import edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.mapper.SubjectDocumentMapper;
import edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.repository.SubjectMongoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class SubjectMongoPersistenceAdapter implements SubjectRepositoryPort {

    private final SubjectMongoRepository repository;
    private final SubjectDocumentMapper mapper;
    private final MongoTemplate mongoTemplate;

    public SubjectMongoPersistenceAdapter(
            SubjectMongoRepository repository,
            SubjectDocumentMapper mapper,
            MongoTemplate mongoTemplate
    ) {
        this.repository = repository;
        this.mapper = mapper;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Subject save(Subject subject) {
        SubjectDocument saved = repository.save(mapper.toDocument(subject));
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Subject> findById(String subjectId) {
        return repository.findById(subjectId).map(mapper::toDomain);
    }

    @Override
    public List<Subject> findAll(int skip, int limit) {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .skip(skip)
                .limit(limit);
        return mongoTemplate.find(query, SubjectDocument.class)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<Subject> findByCareerId(int careerId, int skip, int limit) {
        Query query = new Query(Criteria.where("careerId").is(careerId))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .skip(skip)
                .limit(limit);
        return mongoTemplate.find(query, SubjectDocument.class)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(String subjectId) {
        repository.deleteById(subjectId);
    }

    @Override
    public int deleteByCareerId(int careerId) {
        Query query = new Query(Criteria.where("careerId").is(careerId));
        return (int) mongoTemplate.remove(query, SubjectDocument.class).getDeletedCount();
    }

    @Override
    public long count() {
        return repository.count();
    }
}
