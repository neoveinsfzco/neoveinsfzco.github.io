from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('training', '0004_remove_trainingassignment_target_positions'),
    ]

    operations = [
        migrations.AddField(
            model_name='trainingsubactivity',
            name='scorm_launch_path',
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
