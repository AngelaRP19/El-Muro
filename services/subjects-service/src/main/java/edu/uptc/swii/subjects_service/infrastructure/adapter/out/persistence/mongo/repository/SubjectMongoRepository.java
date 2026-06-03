package edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.repository;

import edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.document.SubjectDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SubjectMongoRepository extends MongoRepository<SubjectDocument, String> {
}
