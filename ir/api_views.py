# ir/api_views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.decorators import action
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from io import BytesIO

from .models import (
    Incident,
    IncidentType,
    IncidentLocation,
    IncidentSeverity,
    IncidentProbability,
    IncidentRiskRating,
    IncidentRcaTool,
    IncidentEffectivenessRating,
    IncidentTaskTemplate,
    IncidentTask,
    IncidentInvestigation,
)
from .serializers import (
    IncidentSerializer,
    IncidentTypeSerializer,
    IncidentLocationSerializer,
    IncidentSeveritySerializer,
    IncidentProbabilitySerializer,
    IncidentRiskRatingSerializer,
    IncidentRcaToolSerializer,
    IncidentEffectivenessRatingSerializer,
    IncidentTaskTemplateSerializer,
    IncidentTaskSerializer,
    IncidentInvestigationSerializer,
)
from core.permissions import (
    BusinessUnitRolePermission,
    filter_queryset_by_membership,
    user_has_role,
)


class IncidentTypeViewSet(viewsets.ModelViewSet):
    queryset = IncidentType.objects.all()
    serializer_class = IncidentTypeSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentLocationViewSet(viewsets.ModelViewSet):
    queryset = IncidentLocation.objects.all()
    serializer_class = IncidentLocationSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentSeverityViewSet(viewsets.ModelViewSet):
    queryset = IncidentSeverity.objects.all()
    serializer_class = IncidentSeveritySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentProbabilityViewSet(viewsets.ModelViewSet):
    queryset = IncidentProbability.objects.all()
    serializer_class = IncidentProbabilitySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentRiskRatingViewSet(viewsets.ModelViewSet):
    queryset = IncidentRiskRating.objects.all()
    serializer_class = IncidentRiskRatingSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentRcaToolViewSet(viewsets.ModelViewSet):
    queryset = IncidentRcaTool.objects.all()
    serializer_class = IncidentRcaToolSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentEffectivenessRatingViewSet(viewsets.ModelViewSet):
    queryset = IncidentEffectivenessRating.objects.all()
    serializer_class = IncidentEffectivenessRatingSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentTaskTemplateViewSet(viewsets.ModelViewSet):
    queryset = IncidentTaskTemplate.objects.all()
    serializer_class = IncidentTaskTemplateSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active', 'task_type']
    search_fields = ['name']
    ordering_fields = ['name', 'task_type']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class IncidentTaskViewSet(viewsets.ModelViewSet):
    queryset = IncidentTask.objects.select_related('incident', 'template').all()
    serializer_class = IncidentTaskSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('QUALITY', 'QUALITY_LEAD', 'QUALITY_MANAGER', 'BU_ADMIN')
    filterset_fields = ['incident', 'status', 'template']
    search_fields = ['description']
    ordering_fields = ['assigned_at', 'status']
    ordering = ['-assigned_at']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'incident__business_unit_id')

    def get_bu_id_for_request(self, request):
        incident_id = request.data.get('incident')
        if not incident_id:
            return None
        return (
            Incident.objects.filter(id=incident_id)
            .values_list('business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.incident.business_unit_id

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class IncidentInvestigationViewSet(viewsets.ModelViewSet):
    queryset = IncidentInvestigation.objects.select_related('incident').all()
    serializer_class = IncidentInvestigationSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('QUALITY', 'QUALITY_LEAD', 'QUALITY_MANAGER', 'BU_ADMIN')
    filterset_fields = ['incident']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'incident__business_unit_id')

    def get_bu_id_for_request(self, request):
        incident_id = request.data.get('incident')
        if not incident_id:
            return None
        return (
            Incident.objects.filter(id=incident_id)
            .values_list('business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.incident.business_unit_id


class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-date_reported')
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    search_fields = ['reference']
    ordering_fields = [
        'reference',
        'incident_date',
        'severity',
        'status',
        'location',
        'risk_rating_option__score',
        'risk_rating_option__name',
    ]
    ordering = ['-incident_date']
    filterset_fields = [
        'business_unit',
        'incident_type',
        'location_option',
        'severity_option',
        'probability_option',
        'risk_rating_option',
        'status',
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')
        bu_id = self.request.query_params.get('business_unit')
        year = self.request.query_params.get('year')
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)
        if year:
            try:
                qs = qs.filter(incident_date__year=int(year))
            except ValueError:
                pass
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        """
        When creating an Incident, automatically set reported_by to the current user.
        """
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(reported_by=user, status='Submitted')

    def perform_update(self, serializer):
        instance: Incident = serializer.instance
        user = self.request.user
        bu_id = instance.business_unit_id
        next_status = serializer.validated_data.get('status', instance.status)

        is_quality = user_has_role(
            user, bu_id, ('QUALITY', 'QUALITY_LEAD', 'QUALITY_MANAGER', 'BU_ADMIN')
        )
        is_quality_lead = user_has_role(user, bu_id, ('QUALITY_LEAD', 'QUALITY_MANAGER', 'BU_ADMIN'))
        is_quality_manager = user_has_role(user, bu_id, ('QUALITY_MANAGER', 'BU_ADMIN'))
        is_assigned = instance.assigned_to.filter(id=user.id).exists()

        if next_status in ('Acknowledged', 'Assigned') and not is_quality:
            raise PermissionDenied('Only quality users can acknowledge or assign incidents.')
        if next_status == 'Reviewed' and not is_quality_lead:
            raise PermissionDenied('Only quality leads can review incidents.')
        if next_status in ('Approved', 'Closed') and not is_quality_manager:
            raise PermissionDenied('Only quality managers can approve or close incidents.')
        if next_status == 'Investigation' and not (is_quality or is_assigned):
            raise PermissionDenied('Only assigned users or quality can move incidents into investigation.')

        updated = serializer.save()

        if next_status == 'Acknowledged' and not updated.acknowledged_by:
            updated.acknowledged_by = user
            updated.acknowledged_at = timezone.now()
        if next_status == 'Assigned' and not updated.assigned_by:
            updated.assigned_by = user
            updated.assigned_at = timezone.now()
        if next_status == 'Reviewed' and not updated.reviewed_by:
            updated.reviewed_by = user
            updated.reviewed_at = timezone.now()
        if next_status == 'Approved' and not updated.approved_by:
            updated.approved_by = user
            updated.approved_at = timezone.now()
        if next_status == 'Closed' and not updated.closed_by:
            updated.closed_by = user
            updated.closed_at = timezone.now()
        updated.save()

    @action(detail=True, methods=['get'], url_path='report')
    def report_html(self, request, *args, **kwargs):
        incident: Incident = self.get_object()
        bu = incident.business_unit
        logo_url = bu.logo.url if getattr(bu, 'logo', None) else ''
        investigation = getattr(incident, 'investigation', None)
        tasks = incident.tasks.select_related('template').all()
        immediate_actions = incident.immediate_actions_data or []

        def format_rows(rows, columns):
            if not rows:
                return '<tr><td colspan="{0}">No records.</td></tr>'.format(columns)
            html_rows = []
            for row in rows:
                html_rows.append(
                    '<tr>' + ''.join(f'<td>{row.get(key, "")}</td>' for key in columns) + '</tr>'
                )
            return ''.join(html_rows)

        action_plan_rows = []
        risk_rows = []
        if investigation:
            action_plan_rows = investigation.action_plan_items or []
            risk_rows = investigation.risk_assessment_items or []

        pdf_link = ''
        if incident.status in ('Approved', 'Closed'):
            pdf_link = f'<a href="/api/ir/incidents/{incident.id}/report-pdf/">Download PDF</a>'

        html = f"""
        <html>
        <head>
          <style>
            @page {{ size: A4; margin: 20mm; }}
            body {{ font-family: Arial, sans-serif; color: #0f172a; }}
            .page {{ width: 190mm; margin: 0 auto; }}
            .header {{ display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #cbd5f5; padding-bottom: 12px; }}
            .logo {{ width: 64px; height: 64px; object-fit: contain; }}
            .title {{ font-size: 20px; font-weight: bold; }}
            .meta {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px; }}
            .section {{ margin-top: 16px; padding: 12px; border: 1px solid #dbe3f3; border-radius: 12px; background: #f8fafc; }}
            .section h3 {{ margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #334155; }}
            table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
            th, td {{ border: 1px solid #d6deef; padding: 6px; text-align: left; }}
            th {{ background: #e2e8f0; }}
            .signatures {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }}
            .signature-box {{ border: 1px solid #dbe3f3; padding: 10px; border-radius: 10px; min-height: 70px; }}
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              {f'<img class="logo" src="{logo_url}" />' if logo_url else ''}
              <div>
                <div class="title">Incident Report - {incident.reference}</div>
                <div>{bu.name}</div>
                <div>{pdf_link}</div>
              </div>
            </div>

            <div class="meta">
              <div><strong>Business Unit:</strong> {bu.name}</div>
              <div><strong>Report Date:</strong> {incident.date_reported.strftime('%b %d, %Y %I:%M %p')}</div>
              <div><strong>Department:</strong> {incident.department.name if incident.department else '-'}</div>
              <div><strong>Reported By:</strong> {incident.reported_by.get_username() if incident.reported_by else '-'} ({incident.reported_by_designation or '-'})</div>
              <div><strong>Witness:</strong> {incident.witness_name or '-'}</div>
              <div><strong>Incident Type:</strong> {incident.incident_type.name if incident.incident_type else '-'}</div>
              <div><strong>Description:</strong> {incident.description}</div>
              <div><strong>Status:</strong> {incident.status}</div>
            </div>

            <div class="section">
              <h3>Immediate Actions</h3>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Action</th>
                    <th>Responsible Person</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {format_rows(immediate_actions, ['no','action','responsible','date','status'])}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>Acknowledgement & Assignment</h3>
              <div><strong>Acknowledged By:</strong> {incident.acknowledged_by.get_username() if incident.acknowledged_by else '-'} ({incident.acknowledged_by_designation or '-'})</div>
              <div><strong>Acknowledged At:</strong> {incident.acknowledged_at.strftime('%b %d, %Y %I:%M %p') if incident.acknowledged_at else '-'}</div>
              <div><strong>Assigned By:</strong> {incident.assigned_by.get_username() if incident.assigned_by else '-'} ({incident.assigned_by_designation or '-'})</div>
              <div><strong>Assigned At:</strong> {incident.assigned_at.strftime('%b %d, %Y %I:%M %p') if incident.assigned_at else '-'}</div>
              <div><strong>Tasks:</strong></div>
              <ul>
                {''.join([f"<li>{t.template.name if t.template else 'Task'} - {t.status}</li>" for t in tasks]) or '<li>No tasks</li>'}
              </ul>
            </div>

            <div class="section">
              <h3>Investigation - RCA</h3>
              <div><strong>Problem Definition:</strong> {investigation.problem_definition if investigation else '-'}</div>
              <div><strong>Team Composition:</strong> {investigation.team_composition if investigation else '-'}</div>
              <div><strong>Process Map:</strong> {investigation.current_process_map if investigation else '-'}</div>
              <div><strong>RCA Tool:</strong> {investigation.rca_tool.name if investigation and investigation.rca_tool else '-'}</div>
              <div><strong>RCA Details:</strong> {investigation.rca_tool_details if investigation else '-'}</div>
              <div><strong>Root Cause:</strong> {investigation.root_cause if investigation else '-'}</div>
            </div>

            <div class="section">
              <h3>Action Plan</h3>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Findings</th>
                    <th>Root Causes</th>
                    <th>Corrective Actions</th>
                    <th>Responsible</th>
                    <th>Support</th>
                    <th>Target Date</th>
                    <th>Status</th>
                    <th>Action Taken</th>
                    <th>Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  {format_rows(action_plan_rows, ['no','findings','root_causes','corrective_actions','responsible','support','target_date','status','action_taken','evaluation'])}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>Risk Assessment</h3>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Activity/Action</th>
                    <th>Risk</th>
                    <th>Affected Party</th>
                    <th>Severity</th>
                    <th>Probability</th>
                    <th>Risk Rating</th>
                    <th>Action Required</th>
                    <th>Control Measures</th>
                    <th>Status</th>
                    <th>Evaluation Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {format_rows(risk_rows, ['no','activity','risk','affected','severity','probability','risk_rating','action_required','control_measures','status','evaluation'])}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h3>Signatures</h3>
              <div class="signatures">
                <div class="signature-box">
                  <strong>Prepared By</strong><br />
                  {investigation.prepared_by.get_username() if investigation and investigation.prepared_by else '-'}<br />
                  {investigation.prepared_by_designation if investigation else ''}<br />
                  {investigation.prepared_at.strftime('%b %d, %Y') if investigation and investigation.prepared_at else '-'}
                </div>
                <div class="signature-box">
                  <strong>Reviewed By</strong><br />
                  {investigation.reviewed_by.get_username() if investigation and investigation.reviewed_by else '-'}<br />
                  {investigation.reviewed_by_designation if investigation else ''}<br />
                  {investigation.reviewed_at.strftime('%b %d, %Y') if investigation and investigation.reviewed_at else '-'}
                </div>
                <div class="signature-box">
                  <strong>Approved By</strong><br />
                  {investigation.approved_by.get_username() if investigation and investigation.approved_by else '-'}<br />
                  {investigation.approved_by_designation if investigation else ''}<br />
                  {investigation.approved_at.strftime('%b %d, %Y') if investigation and investigation.approved_at else '-'}
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
        """
        return HttpResponse(html)

    @action(detail=True, methods=['get'], url_path='report-pdf')
    def report_pdf(self, request, *args, **kwargs):
        incident: Incident = self.get_object()
        if incident.status not in ('Approved', 'Closed'):
            return HttpResponse('PDF is available only after approval or closure.', status=403)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )
        styles = getSampleStyleSheet()
        styles.add(
            ParagraphStyle(
                name='Small',
                fontSize=9,
                leading=12,
                textColor=colors.HexColor('#0f172a'),
            )
        )
        styles.add(
            ParagraphStyle(
                name='SectionTitle',
                fontSize=10,
                leading=12,
                textColor=colors.HexColor('#334155'),
                spaceBefore=6,
                spaceAfter=4,
            )
        )
        styles.add(
            ParagraphStyle(
                name='MetaLabel',
                fontSize=8,
                textColor=colors.HexColor('#475569'),
            )
        )
        styles.add(
            ParagraphStyle(
                name='MetaValue',
                fontSize=9,
                textColor=colors.HexColor('#0f172a'),
            )
        )

        def p_label(text):
            return Paragraph(f"<b>{text}</b>", styles['MetaLabel'])

        def p_value(text):
            return Paragraph(text or '-', styles['MetaValue'])

        def paragraph(text):
            return Paragraph(text or '-', styles['Small'])

        def section_box(title, content_flowables):
            box = Table([[content_flowables]], colWidths=[doc.width])
            box.setStyle(
                TableStyle(
                    [
                        ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#dbe3f3')),
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                        ('LEFTPADDING', (0, 0), (-1, -1), 8),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ]
                )
            )
            return [Paragraph(title, styles['SectionTitle']), box, Spacer(0, 6)]

        def table_style():
            return TableStyle(
                [
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                    ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#d6deef')),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ]
            )

        bu = incident.business_unit
        investigation = getattr(incident, 'investigation', None)
        tasks = incident.tasks.select_related('template').all()
        immediate_actions = incident.immediate_actions_data or []
        action_plan_rows = (investigation.action_plan_items if investigation else []) or []
        risk_rows = (investigation.risk_assessment_items if investigation else []) or []

        elements = []

        header_cells = []
        if getattr(bu, 'logo', None):
            try:
                logo = Image(bu.logo.path, width=24 * mm, height=24 * mm)
                header_cells.append(logo)
            except Exception:
                header_cells.append(Spacer(24 * mm, 24 * mm))
        else:
            header_cells.append(Spacer(24 * mm, 24 * mm))
        title_block = Paragraph(
            f"<b>Incident Report - {incident.reference}</b><br/>{bu.name}",
            ParagraphStyle(name='Title', fontSize=14, leading=16, textColor=colors.HexColor('#0f172a')),
        )
        header_cells.append(title_block)
        header = Table([header_cells], colWidths=[26 * mm, doc.width - 26 * mm])
        header.setStyle(
            TableStyle(
                [
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('LINEBELOW', (0, 0), (-1, 0), 0.6, colors.HexColor('#cbd5f5')),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ]
            )
        )
        elements.append(header)
        elements.append(Spacer(0, 8))

        meta_rows = [
            [p_label("Business Unit"), p_value(bu.name), p_label("Report Date"), p_value(incident.date_reported.strftime('%b %d, %Y %I:%M %p'))],
            [p_label("Department"), p_value(incident.department.name if incident.department else '-'),
             p_label("Reported By"), p_value(f"{incident.reported_by.get_username() if incident.reported_by else '-'} ({incident.reported_by_designation or '-'})")],
            [p_label("Witness"), p_value(incident.witness_name or '-'),
             p_label("Incident Type"), p_value(incident.incident_type.name if incident.incident_type else '-')],
            [p_label("Status"), p_value(incident.status), p_label("Reference"), p_value(incident.reference)],
        ]
        meta_table = Table(meta_rows, colWidths=[22 * mm, 68 * mm, 22 * mm, doc.width - (22 * mm + 68 * mm + 22 * mm)])
        meta_table.setStyle(
            TableStyle(
                [
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(meta_table)
        elements.append(Spacer(0, 8))

        elements.extend(section_box("Description", [paragraph(incident.description or '-')]))

        immediate_rows = [
            [
                Paragraph(str(row.get('no', '')), styles['Small']),
                Paragraph(row.get('action', ''), styles['Small']),
                Paragraph(row.get('responsible', ''), styles['Small']),
                Paragraph(row.get('date', ''), styles['Small']),
                Paragraph(row.get('status', ''), styles['Small']),
            ]
            for row in immediate_actions
        ] or [[Paragraph("-", styles['Small'])] * 5]
        immediate_table = Table(
            [["No", "Action", "Responsible", "Date", "Status"]] + immediate_rows,
            colWidths=[12 * mm, 55 * mm, 40 * mm, 22 * mm, doc.width - (12 * mm + 55 * mm + 40 * mm + 22 * mm)],
        )
        immediate_table.setStyle(table_style())
        elements.extend(section_box("Immediate Actions", [immediate_table]))

        task_lines = "<br/>".join(
            [f"{t.template.name if t.template else 'Task'} - {t.status}" for t in tasks]
        ) or "No tasks"
        assign_block = [
            paragraph(
                f"<b>Acknowledged By:</b> {incident.acknowledged_by.get_username() if incident.acknowledged_by else '-'} "
                f"({incident.acknowledged_by_designation or '-'})"
            ),
            paragraph(
                f"<b>Acknowledged At:</b> {incident.acknowledged_at.strftime('%b %d, %Y %I:%M %p') if incident.acknowledged_at else '-'}"
            ),
            paragraph(
                f"<b>Assigned By:</b> {incident.assigned_by.get_username() if incident.assigned_by else '-'} "
                f"({incident.assigned_by_designation or '-'})"
            ),
            paragraph(
                f"<b>Assigned At:</b> {incident.assigned_at.strftime('%b %d, %Y %I:%M %p') if incident.assigned_at else '-'}"
            ),
            paragraph(f"<b>Tasks:</b> {task_lines}"),
        ]
        elements.extend(section_box("Acknowledgement & Assignment", assign_block))

        rca_block = [
            paragraph(f"<b>Problem Definition:</b> {investigation.problem_definition if investigation else '-'}"),
            paragraph(f"<b>Team Composition:</b> {investigation.team_composition if investigation else '-'}"),
            paragraph(f"<b>Process Map:</b> {investigation.current_process_map if investigation else '-'}"),
            paragraph(
                f"<b>RCA Tool:</b> {investigation.rca_tool.name if investigation and investigation.rca_tool else '-'}"
            ),
            paragraph(f"<b>RCA Tool Details:</b> {investigation.rca_tool_details if investigation else '-'}"),
            paragraph(f"<b>Root Cause:</b> {investigation.root_cause if investigation else '-'}"),
        ]
        elements.extend(section_box("Investigation - RCA", rca_block))

        action_rows = [
            [
                Paragraph(str(row.get('no', '')), styles['Small']),
                Paragraph(row.get('findings', ''), styles['Small']),
                Paragraph(row.get('root_causes', ''), styles['Small']),
                Paragraph(row.get('corrective_actions', ''), styles['Small']),
                Paragraph(row.get('responsible', ''), styles['Small']),
                Paragraph(row.get('status', ''), styles['Small']),
            ]
            for row in action_plan_rows
        ] or [[Paragraph("-", styles['Small'])] * 6]
        action_table = Table(
            [["No", "Findings", "Root Causes", "Corrective Actions", "Responsible", "Status"]] + action_rows,
            colWidths=[10 * mm, 42 * mm, 40 * mm, 48 * mm, 28 * mm, doc.width - (10 * mm + 42 * mm + 40 * mm + 48 * mm + 28 * mm)],
        )
        action_table.setStyle(table_style())
        elements.extend(section_box("Action Plan", [action_table]))

        risk_table_rows = [
            [
                Paragraph(str(row.get('no', '')), styles['Small']),
                Paragraph(row.get('activity', ''), styles['Small']),
                Paragraph(row.get('risk', ''), styles['Small']),
                Paragraph(row.get('severity', ''), styles['Small']),
                Paragraph(row.get('probability', ''), styles['Small']),
                Paragraph(row.get('risk_rating', ''), styles['Small']),
                Paragraph(row.get('evaluation', ''), styles['Small']),
            ]
            for row in risk_rows
        ] or [[Paragraph("-", styles['Small'])] * 7]
        risk_table = Table(
            [["No", "Activity", "Risk", "Severity", "Probability", "Rating", "Evaluation"]] + risk_table_rows,
            colWidths=[10 * mm, 40 * mm, 40 * mm, 18 * mm, 22 * mm, 18 * mm, doc.width - (10 * mm + 40 * mm + 40 * mm + 18 * mm + 22 * mm + 18 * mm)],
        )
        risk_table.setStyle(table_style())
        elements.extend(section_box("Risk Assessment", [risk_table]))

        signatures = Table(
            [
                [
                    paragraph(
                        f"<b>Prepared By</b><br/>{investigation.prepared_by.get_username() if investigation and investigation.prepared_by else '-'}<br/>"
                        f"{investigation.prepared_by_designation if investigation else ''}<br/>"
                        f"{investigation.prepared_at.strftime('%b %d, %Y') if investigation and investigation.prepared_at else '-'}"
                    ),
                    paragraph(
                        f"<b>Reviewed By</b><br/>{investigation.reviewed_by.get_username() if investigation and investigation.reviewed_by else '-'}<br/>"
                        f"{investigation.reviewed_by_designation if investigation else ''}<br/>"
                        f"{investigation.reviewed_at.strftime('%b %d, %Y') if investigation and investigation.reviewed_at else '-'}"
                    ),
                    paragraph(
                        f"<b>Approved By</b><br/>{investigation.approved_by.get_username() if investigation and investigation.approved_by else '-'}<br/>"
                        f"{investigation.approved_by_designation if investigation else ''}<br/>"
                        f"{investigation.approved_at.strftime('%b %d, %Y') if investigation and investigation.approved_at else '-'}"
                    ),
                ]
            ],
            colWidths=[doc.width / 3] * 3,
        )
        signatures.setStyle(
            TableStyle(
                [
                    ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#dbe3f3')),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ]
            )
        )
        elements.extend(section_box("Signatures", [signatures]))

        doc.build(elements)

        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="IR-{incident.reference}.pdf"'
        return response
