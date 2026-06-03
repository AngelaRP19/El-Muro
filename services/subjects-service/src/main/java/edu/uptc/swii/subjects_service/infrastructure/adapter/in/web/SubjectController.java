package edu.uptc.swii.subjects_service.infrastructure.adapter.in.web;

import edu.uptc.swii.subjects_service.application.ports.in.CreateSubjectUseCase;
import edu.uptc.swii.subjects_service.application.ports.in.DeleteSubjectUseCase;
import edu.uptc.swii.subjects_service.application.ports.in.FindSubjectUseCase;
import edu.uptc.swii.subjects_service.application.ports.in.UpdateSubjectUseCase;
import edu.uptc.swii.subjects_service.domain.model.Subject;
import edu.uptc.swii.subjects_service.infrastructure.adapter.in.security.JwtRoleGuard;
import edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto.CreateSubjectRequest;
import edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto.DeleteByCareerResponse;
import edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto.SubjectMapper;
import edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto.SubjectResponse;
import edu.uptc.swii.subjects_service.infrastructure.adapter.in.web.dto.UpdateSubjectRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final CreateSubjectUseCase createSubjectUseCase;
    private final FindSubjectUseCase findSubjectUseCase;
    private final UpdateSubjectUseCase updateSubjectUseCase;
    private final DeleteSubjectUseCase deleteSubjectUseCase;
    private final SubjectMapper mapper;
    private final JwtRoleGuard jwtRoleGuard;

    public SubjectController(
            CreateSubjectUseCase createSubjectUseCase,
            FindSubjectUseCase findSubjectUseCase,
            UpdateSubjectUseCase updateSubjectUseCase,
            DeleteSubjectUseCase deleteSubjectUseCase,
            SubjectMapper mapper,
            JwtRoleGuard jwtRoleGuard
    ) {
        this.createSubjectUseCase = createSubjectUseCase;
        this.findSubjectUseCase = findSubjectUseCase;
        this.updateSubjectUseCase = updateSubjectUseCase;
        this.deleteSubjectUseCase = deleteSubjectUseCase;
        this.mapper = mapper;
        this.jwtRoleGuard = jwtRoleGuard;
    }

    @PostMapping("/create")
    public ResponseEntity<SubjectResponse> create(
            @Valid @RequestBody CreateSubjectRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-role", required = false) String xRole
    ) {
        jwtRoleGuard.requireAdmin(authorization, xRole);
        Subject created = createSubjectUseCase.create(mapper.toCreateCommand(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(created));
    }

    @GetMapping
    public List<SubjectResponse> getAll(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) Integer careerId,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-role", required = false) String xRole
    ) {
        jwtRoleGuard.requireAuthenticated(authorization, xRole);
        List<Subject> subjects = careerId == null
                ? findSubjectUseCase.findAll(skip, limit)
                : findSubjectUseCase.findByCareerId(careerId, skip, limit);
        return subjects.stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/career/{careerId}")
    public List<SubjectResponse> getByCareer(
            @PathVariable int careerId,
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-role", required = false) String xRole
    ) {
        jwtRoleGuard.requireAuthenticated(authorization, xRole);
        return findSubjectUseCase.findByCareerId(careerId, skip, limit).stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{subjectId}")
    public SubjectResponse getById(
            @PathVariable String subjectId,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-role", required = false) String xRole
    ) {
        jwtRoleGuard.requireAuthenticated(authorization, xRole);
        return mapper.toResponse(findSubjectUseCase.findById(subjectId));
    }

    @PutMapping("/{subjectId}")
    public SubjectResponse update(
            @PathVariable String subjectId,
            @Valid @RequestBody UpdateSubjectRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-role", required = false) String xRole
    ) {
        jwtRoleGuard.requireAdmin(authorization, xRole);
        return mapper.toResponse(updateSubjectUseCase.update(subjectId, mapper.toUpdateCommand(request)));
    }

    @DeleteMapping("/{subjectId}")
    public Map<String, String> deleteById(
            @PathVariable String subjectId,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "x-role", required = false) String xRole
    ) {
        jwtRoleGuard.requireAdmin(authorization, xRole);
        deleteSubjectUseCase.deleteById(subjectId);
        return Map.of("message", "Subject deleted successfully");
    }

    @DeleteMapping("/career/{careerId}/all")
    public DeleteByCareerResponse deleteByCareer(@PathVariable int careerId) {
        int deletedCount = deleteSubjectUseCase.deleteByCareerId(careerId);
        return new DeleteByCareerResponse("Deleted subjects by career", deletedCount);
    }
}
