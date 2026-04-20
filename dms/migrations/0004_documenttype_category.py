from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dms', '0003_alter_documentversion_version_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='documenttype',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='types',
                to='dms.documentcategory',
            ),
        ),
    ]
