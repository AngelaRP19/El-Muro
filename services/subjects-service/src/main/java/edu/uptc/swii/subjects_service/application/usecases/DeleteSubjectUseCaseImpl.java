package edu.uptc.swii.subjects_service.application.usecases;

import edu.uptc.swii.subjects_service.application.ports.in.DeleteSubjectUseCase;
import edu.uptc.swii.subjects_service.application.services.SubjectService;
import org.springframework.stereotype.Component;

@Component
public class DeleteSubjectUseCaseImpl implements DeleteSubjectUseCase {

    private final SubjectService subjectService;

    public DeleteSubjectUseCaseImpl(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @Override
    public void deleteById(String subjectId) {
        subjectService.deleteById(subjectId);
    }

    @Override
    public int deleteByCareerId(int careerId) {
        return subjectService.deleteByCareerId(careerId);
    }
}
