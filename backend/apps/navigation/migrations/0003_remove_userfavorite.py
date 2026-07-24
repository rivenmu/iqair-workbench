from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('navigation', '0002_seed_default_links'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserFavorite',
        ),
    ]
