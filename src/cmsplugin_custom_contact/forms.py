from django import forms
from cmsplugin_contact.forms import ContactForm

class CustomContactForm(ContactForm):
    sender_name = forms.CharField(required=False)
