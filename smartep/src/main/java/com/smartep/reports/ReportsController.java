package com.smartep.reports;

import com.smartep.issue.Issue;
import com.smartep.issue.IssueRepository;
import com.smartep.issue.IssueStatus;
import com.smartep.project.Project;
import com.smartep.project.ProjectRepository;
import com.smartep.employee.Role;
import com.smartep.employee.Employee;
import com.smartep.employee.EmployeeRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final EmployeeRepository userRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;

    public ReportsController(EmployeeRepository userRepository, ProjectRepository projectRepository, IssueRepository issueRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
    }

    @GetMapping("/tasks/employee-wise")
    public ResponseEntity<?> getEmployeeWiseTaskReport() {
        List<Map<String, Object>> report = new ArrayList<>();
        List<Employee> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .collect(Collectors.toList());

        for (Employee emp : employees) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", emp.getId());
            map.put("name", emp.getName());
            map.put("email", emp.getEmail());
            map.put("department", emp.getDepartment() != null ? emp.getDepartment() : "N/A");

            List<Issue> assigned = issueRepository.findAll().stream()
                    .filter(i -> i.getAssignee() != null && i.getAssignee().getId().equals(emp.getId()))
                    .collect(Collectors.toList());

            long total = assigned.size();
            long completed = assigned.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
            long inProgress = assigned.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
            long pending = total - completed;

            map.put("totalTasks", total);
            map.put("completedTasks", completed);
            map.put("inProgressTasks", inProgress);
            map.put("pendingTasks", pending);

            report.add(map);
        }

        return ResponseEntity.ok(report);
    }

    @GetMapping("/projects/progress")
    public ResponseEntity<?> getProjectProgressReport() {
        List<Map<String, Object>> report = new ArrayList<>();
        List<Project> projects = projectRepository.findAll();

        for (Project p : projects) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("key", p.getKey());
            map.put("ownerName", p.getOwner().getName());
            map.put("membersCount", p.getMembers().stream().filter(m -> m.getRole() == com.smartep.employee.Role.EMPLOYEE).count());
            map.put("status", p.getStatus());
            map.put("priority", p.getPriority());
            map.put("deadline", p.getDeadline() != null ? p.getDeadline().toString() : "N/A");

            List<Issue> tasks = issueRepository.findAll().stream()
                    .filter(i -> i.getProject().getId().equals(p.getId()))
                    .collect(Collectors.toList());

            long total = tasks.size();
            double avgProgress = 0;
            if (total > 0) {
                avgProgress = tasks.stream().mapToInt(Issue::getProgress).average().orElse(0.0);
            }

            map.put("totalTasks", total);
            map.put("avgProgress", Math.round(avgProgress * 10.0) / 10.0);
            report.add(map);
        }

        return ResponseEntity.ok(report);
    }

    @GetMapping("/tasks/pending")
    public ResponseEntity<?> getPendingTaskReport() {
        List<Issue> pendingTasks = issueRepository.findAll().stream()
                .filter(i -> i.getStatus() != IssueStatus.DONE)
                .collect(Collectors.toList());

        List<Map<String, Object>> report = pendingTasks.stream().map(i -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", i.getId());
            map.put("issueKey", i.getIssueKey());
            map.put("title", i.getTitle());
            map.put("status", i.getStatus());
            map.put("priority", i.getPriority());
            map.put("progress", i.getProgress());
            map.put("projectName", i.getProject().getName());
            map.put("deadline", i.getProject().getDeadline() != null ? i.getProject().getDeadline().toString() : "N/A");
            map.put("assigneeName", i.getAssignee() != null ? i.getAssignee().getName() : "Unassigned");
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(report);
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportToPdf(@RequestParam String reportType) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);

            document.open();
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
            fontTitle.setSize(18);
            fontTitle.setColor(new Color(0, 128, 128));

            Paragraph paragraph = new Paragraph("Smart Employee & Project Management System", fontTitle);
            paragraph.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(paragraph);
            
            document.add(new Paragraph(" ")); // spacer

            Font fontSubtitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
            
            if ("employees".equalsIgnoreCase(reportType)) {
                document.add(new Paragraph("Employee-wise Task Report", fontSubtitle));
                document.add(new Paragraph(" "));
                
                PdfPTable table = new PdfPTable(6);
                table.setWidthPercentage(100);
                
                String[] headers = {"Name", "Email", "Department", "Total Tasks", "Completed", "Pending"};
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Paragraph(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                    cell.setBackgroundColor(new Color(0, 128, 128));
                    cell.setPadding(5);
                    table.addCell(cell);
                }

                List<Employee> employees = userRepository.findAll().stream().filter(u -> u.getRole() == Role.EMPLOYEE).collect(Collectors.toList());
                for (Employee emp : employees) {
                    table.addCell(emp.getName());
                    table.addCell(emp.getEmail());
                    table.addCell(emp.getDepartment() != null ? emp.getDepartment() : "N/A");

                    List<Issue> assigned = issueRepository.findAll().stream()
                            .filter(i -> i.getAssignee() != null && i.getAssignee().getId().equals(emp.getId()))
                            .collect(Collectors.toList());

                    long total = assigned.size();
                    long completed = assigned.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
                    long pending = total - completed;

                    table.addCell(String.valueOf(total));
                    table.addCell(String.valueOf(completed));
                    table.addCell(String.valueOf(pending));
                }
                document.add(table);
            } else if ("projects".equalsIgnoreCase(reportType)) {
                document.add(new Paragraph("Project Progress Report", fontSubtitle));
                document.add(new Paragraph(" "));
                
                PdfPTable table = new PdfPTable(7);
                table.setWidthPercentage(100);
                
                String[] headers = {"Key", "Project Name", "Owner", "Members", "Status", "Deadline", "Avg Progress"};
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Paragraph(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
                    cell.setBackgroundColor(new Color(0, 128, 128));
                    cell.setPadding(5);
                    table.addCell(cell);
                }

                List<Project> projects = projectRepository.findAll();
                for (Project p : projects) {
                    table.addCell(p.getKey());
                    table.addCell(p.getName());
                    table.addCell(p.getOwner().getName());
                    table.addCell(String.valueOf(p.getMembers().stream().filter(m -> m.getRole() == com.smartep.employee.Role.EMPLOYEE).count()));
                    table.addCell(p.getStatus());
                    table.addCell(p.getDeadline() != null ? p.getDeadline().toString() : "N/A");

                    List<Issue> tasks = issueRepository.findAll().stream()
                            .filter(i -> i.getProject().getId().equals(p.getId()))
                            .collect(Collectors.toList());
                    double avgProgress = tasks.isEmpty() ? 0 : tasks.stream().mapToInt(Issue::getProgress).average().orElse(0.0);
                    table.addCell(Math.round(avgProgress) + "%");
                }
                document.add(table);
            } else {
                document.add(new Paragraph("Pending Tasks Report", fontSubtitle));
                document.add(new Paragraph(" "));
                
                PdfPTable table = new PdfPTable(6);
                table.setWidthPercentage(100);
                
                String[] headers = {"Task Key", "Title", "Project", "Assignee", "Priority", "Progress"};
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Paragraph(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                    cell.setBackgroundColor(new Color(0, 128, 128));
                    cell.setPadding(5);
                    table.addCell(cell);
                }

                List<Issue> pendingTasks = issueRepository.findAll().stream().filter(i -> i.getStatus() != IssueStatus.DONE).collect(Collectors.toList());
                for (Issue i : pendingTasks) {
                    table.addCell(i.getIssueKey());
                    table.addCell(i.getTitle());
                    table.addCell(i.getProject().getName());
                    table.addCell(i.getAssignee() != null ? i.getAssignee().getName() : "Unassigned");
                    table.addCell(i.getPriority().name());
                    table.addCell(i.getProgress() + "%");
                }
                document.add(table);
            }

            document.close();

            byte[] pdfBytes = out.toByteArray();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", reportType + "_report.pdf");

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel(@RequestParam String reportType) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Report");
            Row headerRow = sheet.createRow(0);

            if ("employees".equalsIgnoreCase(reportType)) {
                String[] columns = {"Name", "Email", "Department", "Total Tasks", "Completed Tasks", "InProgress Tasks", "Pending Tasks"};
                for (int col = 0; col < columns.length; col++) {
                    headerRow.createCell(col).setCellValue(columns[col]);
                }

                List<Employee> employees = userRepository.findAll().stream().filter(u -> u.getRole() == Role.EMPLOYEE).collect(Collectors.toList());
                int rowIdx = 1;
                for (Employee emp : employees) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(emp.getName());
                    row.createCell(1).setCellValue(emp.getEmail());
                    row.createCell(2).setCellValue(emp.getDepartment() != null ? emp.getDepartment() : "N/A");

                    List<Issue> assigned = issueRepository.findAll().stream()
                            .filter(i -> i.getAssignee() != null && i.getAssignee().getId().equals(emp.getId()))
                            .collect(Collectors.toList());

                    long total = assigned.size();
                    long completed = assigned.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
                    long inProgress = assigned.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
                    long pending = total - completed;

                    row.createCell(3).setCellValue(total);
                    row.createCell(4).setCellValue(completed);
                    row.createCell(5).setCellValue(inProgress);
                    row.createCell(6).setCellValue(pending);
                }
            } else if ("projects".equalsIgnoreCase(reportType)) {
                String[] columns = {"Project Key", "Project Name", "Owner", "Members count", "Status", "Priority", "Deadline", "Avg Progress"};
                for (int col = 0; col < columns.length; col++) {
                    headerRow.createCell(col).setCellValue(columns[col]);
                }

                List<Project> projects = projectRepository.findAll();
                int rowIdx = 1;
                for (Project p : projects) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(p.getKey());
                    row.createCell(1).setCellValue(p.getName());
                    row.createCell(2).setCellValue(p.getOwner().getName());
                    row.createCell(3).setCellValue(p.getMembers().stream().filter(m -> m.getRole() == com.smartep.employee.Role.EMPLOYEE).count());
                    row.createCell(4).setCellValue(p.getStatus());
                    row.createCell(5).setCellValue(p.getPriority());
                    row.createCell(6).setCellValue(p.getDeadline() != null ? p.getDeadline().toString() : "N/A");

                    List<Issue> tasks = issueRepository.findAll().stream()
                            .filter(i -> i.getProject().getId().equals(p.getId()))
                            .collect(Collectors.toList());
                    double avgProgress = tasks.isEmpty() ? 0 : tasks.stream().mapToInt(Issue::getProgress).average().orElse(0.0);
                    row.createCell(7).setCellValue(Math.round(avgProgress) + "%");
                }
            } else {
                String[] columns = {"Task Key", "Title", "Project", "Assignee", "Priority", "Progress", "Deadline"};
                for (int col = 0; col < columns.length; col++) {
                    headerRow.createCell(col).setCellValue(columns[col]);
                }

                List<Issue> pendingTasks = issueRepository.findAll().stream().filter(i -> i.getStatus() != IssueStatus.DONE).collect(Collectors.toList());
                int rowIdx = 1;
                for (Issue i : pendingTasks) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(i.getIssueKey());
                    row.createCell(1).setCellValue(i.getTitle());
                    row.createCell(2).setCellValue(i.getProject().getName());
                    row.createCell(3).setCellValue(i.getAssignee() != null ? i.getAssignee().getName() : "Unassigned");
                    row.createCell(4).setCellValue(i.getPriority().name());
                    row.createCell(5).setCellValue(i.getProgress() + "%");
                    row.createCell(6).setCellValue(i.getProject().getDeadline() != null ? i.getProject().getDeadline().toString() : "N/A");
                }
            }

            workbook.write(out);
            byte[] excelBytes = out.toByteArray();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", reportType + "_report.xlsx");

            return ResponseEntity.ok().headers(headers).body(excelBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportToCsv(@RequestParam String reportType) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            java.io.PrintWriter writer = new java.io.PrintWriter(out);

            if ("employees".equalsIgnoreCase(reportType)) {
                writer.println("Name,Email,Department,Total Tasks,Completed Tasks,InProgress Tasks,Pending Tasks");
                List<Employee> employees = userRepository.findAll().stream().filter(u -> u.getRole() == com.smartep.employee.Role.EMPLOYEE).collect(Collectors.toList());
                for (Employee emp : employees) {
                    List<Issue> assigned = issueRepository.findAll().stream()
                            .filter(i -> i.getAssignee() != null && i.getAssignee().getId().equals(emp.getId()))
                            .collect(Collectors.toList());
                    long total = assigned.size();
                    long completed = assigned.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
                    long inProgress = assigned.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
                    long pending = total - completed;
                    writer.printf("\"%s\",\"%s\",\"%s\",%d,%d,%d,%d\n",
                            emp.getName(), emp.getEmail(), emp.getDepartment() != null ? emp.getDepartment() : "N/A",
                            total, completed, inProgress, pending);
                }
            } else if ("projects".equalsIgnoreCase(reportType)) {
                writer.println("Project Key,Project Name,Owner,Members count,Status,Priority,Deadline,Avg Progress");
                List<Project> projects = projectRepository.findAll();
                for (Project p : projects) {
                    List<Issue> tasks = issueRepository.findAll().stream()
                            .filter(i -> i.getProject().getId().equals(p.getId()))
                            .collect(Collectors.toList());
                    double avgProgress = tasks.isEmpty() ? 0 : tasks.stream().mapToInt(Issue::getProgress).average().orElse(0.0);
                    writer.printf("\"%s\",\"%s\",\"%s\",%d,\"%s\",\"%s\",\"%s\",%d%%\n",
                            p.getKey(), p.getName(), p.getOwner().getName(),
                            p.getMembers().stream().filter(m -> m.getRole() == com.smartep.employee.Role.EMPLOYEE).count(),
                            p.getStatus(), p.getPriority(), p.getDeadline() != null ? p.getDeadline().toString() : "N/A",
                            Math.round(avgProgress));
                }
            } else {
                writer.println("Task Key,Title,Project,Assignee,Priority,Progress,Deadline");
                List<Issue> pendingTasks = issueRepository.findAll().stream().filter(i -> i.getStatus() != IssueStatus.DONE).collect(Collectors.toList());
                for (Issue i : pendingTasks) {
                    writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d%%,\"%s\"\n",
                            i.getIssueKey(), i.getTitle(), i.getProject().getName(),
                            i.getAssignee() != null ? i.getAssignee().getName() : "Unassigned",
                            i.getPriority().name(), i.getProgress(),
                            i.getProject().getDeadline() != null ? i.getProject().getDeadline().toString() : "N/A");
                }
            }
            writer.flush();
            byte[] csvBytes = out.toByteArray();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", reportType + "_report.csv");
            return ResponseEntity.ok().headers(headers).body(csvBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
