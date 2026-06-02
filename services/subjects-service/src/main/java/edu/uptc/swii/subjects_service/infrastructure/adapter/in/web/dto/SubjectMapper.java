package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto;

import edu.uptc.swii.subjects_service.application.usecases.CreateSubjectCommand;
import edu.uptc.swii.subjects_service.application.usecases.UpdateSubjectCommand;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import org.springframework.stereotype.Component;

@Component
public class SubjectMapper {

    public CreateSubjectCommand toCreateCommand(CreateSubjectRequest request) {
        return new CreateSubjectCommand(
                request.name(),
                request.description(),
                request.semester(),
                request.careerId()
        );
    }

    public UpdateSubjectCommand toUpdateCommand(UpdateSubjectRequest request) {
        return new UpdateSubjectCommand(
                request.name(),
                request.description(),
                request.semester()
        );
    }

    public SubjectResponse toResponse(Subject subject) {
        return new SubjectResponse(
                subject.getId(),
                subject.getName(),
                subject.getDescription(),
                subject.getSemester(),
                subject.getCareerId(),
                subject.getCreatedAt(),
                subject.getUpdatedAt()
        );
    }
}
