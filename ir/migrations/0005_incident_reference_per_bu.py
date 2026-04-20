from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ir', '0004_ir_workflow_extended'),
    ]

    operations = [
        migrations.AlterField(
            model_name='incident',
            name='reference',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterUniqueTogether(
            name='incident',
            unique_together={('business_unit', 'reference')},
        ),
    ]
