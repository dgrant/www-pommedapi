from django.db import models
from cmsplugin_contact.models import BaseContact
from django.utils.translation import ugettext_lazy as _

class CustomContact(BaseContact):
    sender_name_label = models.CharField(_('Sender name label'),
        default=_('Your Name'), max_length=20)
