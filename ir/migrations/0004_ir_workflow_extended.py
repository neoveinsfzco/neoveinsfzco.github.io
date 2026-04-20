from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_department'),
        ('ir', '0003_incident_settings_and_workflow'),
    ]

    operations = [
        migrations.AddField(
            model_name='incident',
            name='acknowledged_by_designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='incident',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_incidents', to='auth.user'),
        ),
        migrations.AddField(
            model_name='incident',
            name='approved_by_designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='incident',
            name='assigned_by_designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='incident',
            name='closed_by_designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='incident',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='core.department'),
        ),
        migrations.AddField(
            model_name='incident',
            name='immediate_actions_data',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='incident',
            name='reported_by_designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='incident',
            name='reviewed_by_designation',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='incident',
            name='witness_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='incident',
            name='status',
            field=models.CharField(choices=[('Submitted', 'Submitted'), ('Acknowledged', 'Acknowledged'), ('Assigned', 'Assigned'), ('Investigation', 'Investigation'), ('Reviewed', 'Reviewed'), ('Approved', 'Approved'), ('Closed', 'Closed')], default='Submitted', max_length=20),
        ),
        migrations.CreateModel(
            name='IncidentEffectivenessRating',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('score', models.PositiveSmallIntegerField(default=1)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={
                'unique_together': {('business_unit', 'name')},
            },
        ),
        migrations.CreateModel(
            name='IncidentRcaTool',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={
                'unique_together': {('business_unit', 'name')},
            },
        ),
        migrations.CreateModel(
            name='IncidentTaskTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('task_type', models.CharField(choices=[('GENERAL', 'General'), ('RCA', 'Root Cause Analysis'), ('RISK_ASSESSMENT', 'Risk Assessment'), ('ACTION_PLAN', 'Action Plan')], default='GENERAL', max_length=30)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={
                'unique_together': {('business_unit', 'name')},
            },
        ),
        migrations.CreateModel(
            name='IncidentTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.TextField(blank=True)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(choices=[('Assigned', 'Assigned'), ('In Progress', 'In Progress'), ('Completed', 'Completed')], default='Assigned', max_length=20)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('response_text', models.TextField(blank=True)),
                ('response_data', models.JSONField(blank=True, default=dict)),
                ('assigned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_incident_tasks', to='auth.user')),
                ('completed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='completed_incident_tasks', to='auth.user')),
                ('incident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='ir.incident')),
                ('template', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tasks', to='ir.incidenttasktemplate')),
                ('assigned_to', models.ManyToManyField(blank=True, related_name='incident_tasks', to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='IncidentInvestigation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('problem_definition', models.TextField(blank=True)),
                ('team_composition', models.TextField(blank=True)),
                ('current_process_map', models.TextField(blank=True)),
                ('rca_tool_details', models.TextField(blank=True)),
                ('root_cause', models.TextField(blank=True)),
                ('action_plan_items', models.JSONField(blank=True, default=list)),
                ('risk_assessment_items', models.JSONField(blank=True, default=list)),
                ('prepared_at', models.DateTimeField(blank=True, null=True)),
                ('prepared_by_designation', models.CharField(blank=True, max_length=255)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('reviewed_by_designation', models.CharField(blank=True, max_length=255)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('approved_by_designation', models.CharField(blank=True, max_length=255)),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_incident_investigations', to='auth.user')),
                ('incident', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='investigation', to='ir.incident')),
                ('prepared_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='prepared_incident_investigations', to='auth.user')),
                ('rca_tool', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='investigations', to='ir.incidentrcatool')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_incident_investigations', to='auth.user')),
            ],
        ),
    ]
