package edu.uptc.swii.subjects_service.application.ports.in;

import edu.uptc.swii.subjects_service.application.usecases.CreateSubjectCommand;
import edu.uptc.swii.subjects_service.domain.model.Subject;

public interface CreateSubjectUseCase {
    
    Subject create(CreateSubjectCommand command);
}
