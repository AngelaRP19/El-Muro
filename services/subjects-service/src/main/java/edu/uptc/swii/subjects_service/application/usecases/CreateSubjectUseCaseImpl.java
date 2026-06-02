package edu.uptc.swii.subjects_service.application.usecases;

import edu.uptc.swii.subjects_service.application.ports.in.CreateSubjectUseCase;
import edu.uptc.swii.subjects_service.application.services.SubjectService;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import org.springframework.stereotype.Component;

@Component
public class CreateSubjectUseCaseImpl implements CreateSubjectUseCase {

    private final SubjectService subjectService;

    public CreateSubjectUseCaseImpl(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @Override
    public Subject create(CreateSubjectCommand command) {
        return subjectService.create(command);
    }
}
