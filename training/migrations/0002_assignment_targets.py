from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('training', '0001_initial'),
        ('core', '0003_department'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='trainingassignment',
            name='target_departments',
            field=models.ManyToManyField(blank=True, related_name='targeted_training_assignments', to='core.department'),
        ),
        migrations.AddField(
            model_name='trainingassignment',
            name='target_positions',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='trainingassignment',
            name='target_users',
            field=models.ManyToManyField(blank=True, related_name='targeted_training_assignments', to=settings.AUTH_USER_MODEL),
        ),
    ]
