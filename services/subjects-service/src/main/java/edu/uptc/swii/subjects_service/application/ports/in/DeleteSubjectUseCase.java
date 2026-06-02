package edu.uptc.swii.subjects_service.application.ports.in;

public interface DeleteSubjectUseCase {
    
    void deleteById(String subjectId);

    int deleteByCareerId(int careerId);

}
