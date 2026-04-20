from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='businessunitmembership',
            name='role',
            field=models.CharField(
                choices=[
                    ('BU_ADMIN', 'Business Unit Admin'),
                    ('QUALITY_MANAGER', 'Quality Manager'),
                    ('QUALITY_LEAD', 'Quality Lead'),
                    ('QUALITY', 'Quality Officer'),
                    ('STAFF', 'Staff'),
                ],
                default='STAFF',
                max_length=20,
            ),
        ),
    ]
