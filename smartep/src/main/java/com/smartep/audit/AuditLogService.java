package com.smartep.audit;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String action, String username, String details) {
        AuditLog log = new AuditLog(action, username, details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findFirst10ByOrderByTimestampDesc();
    }
}
