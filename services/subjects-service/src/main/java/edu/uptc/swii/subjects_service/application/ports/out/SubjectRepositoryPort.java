package edu.uptc.swii.subjects_service.application.ports.out;

import edu.uptc.swii.subjects_service.domain.model.Subject;

import java.util.List;
import java.util.Optional;

public interface SubjectRepositoryPort {
    Subject save(Subject subject);

    Optional<Subject> findById(String subjectId);

    List<Subject> findAll(int skip, int limit);

    List<Subject> findByCareerId(int careerId, int skip, int limit);

    void deleteById(String subjectId);

    int deleteByCareerId(int careerId);

    long count();
}
