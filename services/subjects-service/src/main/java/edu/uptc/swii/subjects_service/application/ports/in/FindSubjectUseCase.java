package edu.uptc.swii.subjects_service.application.ports.in;

import java.util.List;

import edu.uptc.swii.subjects_service.domain.model.Subject;

public interface FindSubjectUseCase {
    
    Subject findById(String subjectId);

    List<Subject> findAll(int skip, int limit);

    List<Subject> findByCareerId(int careerId, int skip, int limit);
    
}
