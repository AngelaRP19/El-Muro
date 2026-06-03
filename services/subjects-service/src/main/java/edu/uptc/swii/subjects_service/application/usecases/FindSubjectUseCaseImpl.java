package edu.uptc.swii.subjects_service.application.usecases;

import edu.uptc.swii.subjects_service.application.ports.in.FindSubjectUseCase;
import edu.uptc.swii.subjects_service.application.services.SubjectService;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FindSubjectUseCaseImpl implements FindSubjectUseCase {

    private final SubjectService subjectService;

    public FindSubjectUseCaseImpl(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @Override
    public Subject findById(String subjectId) {
        return subjectService.findById(subjectId);
    }

    @Override
    public List<Subject> findAll(int skip, int limit) {
        return subjectService.findAll(skip, limit);
    }

    @Override
    public List<Subject> findByCareerId(int careerId, int skip, int limit) {
        return subjectService.findByCareerId(careerId, skip, limit);
    }
}
