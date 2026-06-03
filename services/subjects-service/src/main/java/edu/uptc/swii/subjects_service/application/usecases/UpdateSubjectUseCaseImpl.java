package edu.uptc.swii.subjects_service.application.usecases;

import edu.uptc.swii.subjects_service.application.ports.in.UpdateSubjectUseCase;
import edu.uptc.swii.subjects_service.application.services.SubjectService;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import org.springframework.stereotype.Component;

@Component
public class UpdateSubjectUseCaseImpl implements UpdateSubjectUseCase {

    private final SubjectService subjectService;

    public UpdateSubjectUseCaseImpl(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @Override
    public Subject update(String subjectId, UpdateSubjectCommand command) {
        return subjectService.update(subjectId, command);
    }
}
