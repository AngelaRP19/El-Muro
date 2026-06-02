package edu.uptc.swii.subjects_service.application.ports.in;

import edu.uptc.swii.subjects_service.application.usecases.UpdateSubjectCommand;
import edu.uptc.swii.subjects_service.domain.model.Subject;

public interface UpdateSubjectUseCase {
    Subject update(String subjectId, UpdateSubjectCommand command);
}
