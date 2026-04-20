from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('training', '0002_assignment_targets'),
    ]

    operations = [
        migrations.AddField(
            model_name='trainingsection',
            name='is_mandatory',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='trainingsubactivity',
            name='is_mandatory',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='traininglearningpath',
            name='duration_days',
            field=models.PositiveIntegerField(default=30),
        ),
    ]
