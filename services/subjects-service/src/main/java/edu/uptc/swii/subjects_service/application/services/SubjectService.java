package edu.uptc.swii.subjects_service.application.services;

import edu.uptc.swii.subjects_service.application.ports.out.CareerValidationPort;
import edu.uptc.swii.subjects_service.application.ports.out.SubjectRepositoryPort;
import edu.uptc.swii.subjects_service.application.usecases.CreateSubjectCommand;
import edu.uptc.swii.subjects_service.application.usecases.UpdateSubjectCommand;
import edu.uptc.swii.subjects_service.domain.exception.CareerNotFoundException;
import edu.uptc.swii.subjects_service.domain.exception.SubjectNotFoundException;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepositoryPort subjectRepositoryPort;
    private final CareerValidationPort careerValidationPort;

    public SubjectService(
            SubjectRepositoryPort subjectRepositoryPort,
            CareerValidationPort careerValidationPort
    ) {
        this.subjectRepositoryPort = subjectRepositoryPort;
        this.careerValidationPort = careerValidationPort;
    }

    public Subject create(CreateSubjectCommand command) {
        if (!careerValidationPort.careerExists(command.careerId())) {
            throw new CareerNotFoundException(command.careerId());
        }

        Subject newSubject = Subject.create(
                command.name(),
                command.description(),
                command.semester(),
                command.careerId()
        );

        return subjectRepositoryPort.save(newSubject);
    }

    public Subject findById(String subjectId) {
        return subjectRepositoryPort.findById(subjectId)
                .orElseThrow(() -> new SubjectNotFoundException(subjectId));
    }

    public List<Subject> findAll(int skip, int limit) {
        return subjectRepositoryPort.findAll(skip, limit);
    }

    public List<Subject> findByCareerId(int careerId, int skip, int limit) {
        return subjectRepositoryPort.findByCareerId(careerId, skip, limit);
    }

    public Subject update(String subjectId, UpdateSubjectCommand command) {
        Subject current = findById(subjectId);
        Subject updated = current.update(command.name(), command.description(), command.semester());
        return subjectRepositoryPort.save(updated);
    }

    public void deleteById(String subjectId) {
        findById(subjectId);
        subjectRepositoryPort.deleteById(subjectId);
    }

    public int deleteByCareerId(int careerId) {
        return subjectRepositoryPort.deleteByCareerId(careerId);
    }
}
