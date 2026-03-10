from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_clientprofile_province_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='clientprofile',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
    ]
