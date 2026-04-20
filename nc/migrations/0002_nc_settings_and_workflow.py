from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_businessunit_logo'),
        ('nc', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='NonConformanceOccurrence',
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
            name='NonConformanceProbability',
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
            name='NonConformanceRiskRating',
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
            name='NonConformanceSeverity',
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
            name='NonConformanceSource',
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
            name='NonConformanceType',
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
            model_name='nonconformance',
            name='assigned_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='assigned_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_nonconformances_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='closed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='closed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_nonconformances', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='logged_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='logged_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logged_nonconformances', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='nc_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nonconformances', to='nc.nonconformancetype'),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='occurrence_place',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nonconformances', to='nc.nonconformanceoccurrence'),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='probability_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nonconformances', to='nc.nonconformanceprobability'),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='risk_rating_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nonconformances', to='nc.nonconformanceriskrating'),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='severity_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nonconformances', to='nc.nonconformanceseverity'),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='source',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nonconformances', to='nc.nonconformancesource'),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='verified_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_nonconformances', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='nonconformance',
            name='status',
            field=models.CharField(choices=[('Raised', 'Raised'), ('Logged', 'Logged'), ('Assigned', 'Assigned'), ('RCA', 'RCA'), ('CAPA Implemented', 'CAPA Implemented'), ('Verified', 'Verified'), ('Closed', 'Closed')], default='Raised', max_length=20),
        ),
        migrations.AddField(
            model_name='nonconformance',
            name='assigned_to',
            field=models.ManyToManyField(blank=True, related_name='assigned_nonconformances', to=settings.AUTH_USER_MODEL),
        ),
    ]
