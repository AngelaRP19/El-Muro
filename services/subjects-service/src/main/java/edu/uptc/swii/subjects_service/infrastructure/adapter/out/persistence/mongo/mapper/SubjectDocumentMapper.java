package edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.mapper;

import edu.uptc.swii.subjects_service.domain.model.Subject;
import edu.uptc.swii.subjects_service.infrastructure.adapter.out.persistence.mongo.document.SubjectDocument;
import org.springframework.stereotype.Component;

@Component
public class SubjectDocumentMapper {

    public SubjectDocument toDocument(Subject subject) {
        SubjectDocument document = new SubjectDocument();
        document.setId(subject.getId());
        document.setName(subject.getName());
        document.setDescription(subject.getDescription());
        document.setSemester(subject.getSemester());
        document.setCareerId(subject.getCareerId());
        document.setCreatedAt(subject.getCreatedAt());
        document.setUpdatedAt(subject.getUpdatedAt());
        return document;
    }

    public Subject toDomain(SubjectDocument document) {
        return new Subject(
                document.getId(),
                document.getName(),
                document.getDescription(),
                document.getSemester(),
                document.getCareerId(),
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }
}
