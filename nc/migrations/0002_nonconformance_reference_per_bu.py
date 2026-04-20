from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nc', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='nonconformance',
            name='reference',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='nonconformance',
            unique_together={('business_unit', 'reference')},
        ),
    ]
