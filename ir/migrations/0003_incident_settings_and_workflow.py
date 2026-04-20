from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_businessunit_logo'),
        ('ir', '0002_alter_incident_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='IncidentLocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('code', models.CharField(blank=True, max_length=32)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={'unique_together': {('business_unit', 'name')}},
        ),
        migrations.CreateModel(
            name='IncidentProbability',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('score', models.PositiveSmallIntegerField(default=1)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={'unique_together': {('business_unit', 'name')}},
        ),
        migrations.CreateModel(
            name='IncidentRiskRating',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('score', models.PositiveSmallIntegerField(default=1)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={'unique_together': {('business_unit', 'name')}},
        ),
        migrations.CreateModel(
            name='IncidentSeverity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('score', models.PositiveSmallIntegerField(default=1)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={'unique_together': {('business_unit', 'name')}},
        ),
        migrations.CreateModel(
            name='IncidentType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('code', models.CharField(blank=True, max_length=32)),
                ('is_active', models.BooleanField(default=True)),
                ('business_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.businessunit')),
            ],
            options={'unique_together': {('business_unit', 'name')}},
        ),
        migrations.AddField(
            model_name='incident',
            name='acknowledged_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='acknowledged_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acknowledged_incidents', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='incident',
            name='assigned_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='assigned_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_incidents_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='incident',
            name='closed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='closed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_incidents', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='incident',
            name='incident_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='ir.incidenttype'),
        ),
        migrations.AddField(
            model_name='incident',
            name='location_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='ir.incidentlocation'),
        ),
        migrations.AddField(
            model_name='incident',
            name='probability_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='ir.incidentprobability'),
        ),
        migrations.AddField(
            model_name='incident',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='reviewed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_incidents', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='incident',
            name='risk_rating_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='ir.incidentriskrating'),
        ),
        migrations.AddField(
            model_name='incident',
            name='severity_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='incidents', to='ir.incidentseverity'),
        ),
        migrations.AlterField(
            model_name='incident',
            name='location',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='incident',
            name='severity',
            field=models.CharField(blank=True, choices=[('Minor', 'Minor'), ('Moderate', 'Moderate'), ('Major', 'Major'), ('Critical', 'Critical')], max_length=20),
        ),
        migrations.AlterField(
            model_name='incident',
            name='status',
            field=models.CharField(choices=[('Submitted', 'Submitted'), ('Acknowledged', 'Acknowledged'), ('Assigned', 'Assigned'), ('In Progress', 'In Progress'), ('Reviewed', 'Reviewed'), ('Closed', 'Closed')], default='Submitted', max_length=20),
        ),
        migrations.AddField(
            model_name='incident',
            name='assigned_to',
            field=models.ManyToManyField(blank=True, related_name='assigned_incidents', to=settings.AUTH_USER_MODEL),
        ),
    ]
