from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('training', '0003_learningpath_duration_and_mandatory'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='trainingassignment',
            name='target_positions',
        ),
    ]

