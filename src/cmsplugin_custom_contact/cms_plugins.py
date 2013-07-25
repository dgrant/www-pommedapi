from django.utils.translation import ugettext_lazy as _
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

from cms.plugin_pool import plugin_pool

from cmsplugin_contact.cms_plugins import ContactPlugin
from models import CustomContact
from forms import CustomContactForm

class CustomContactPlugin(ContactPlugin):
    name = _("Custom Contact Form")
    
    model = CustomContact
    contact_form = CustomContactForm
    
    render_template = "cmsplugin_custom_contact/contact.html"
    email_template = "cmsplugin_contact/email.txt"
    subject_template = "cmsplugin_custom_contact/subject.txt"
    
    fieldsets = (
        (None, {
                'fields': ('site_email', 'email_label', 'sender_name_label',
                           'subject_label', 'content_label', 'thanks',
                           'submit'),
        }),
        (_('Spam Protection'), {
                'fields': ('spam_protection_method', 'akismet_api_key',
                           'recaptcha_public_key', 'recaptcha_private_key',
                           'recaptcha_theme')
        })
    )

    def send(self, form, site_email):
        subject = form.cleaned_data['subject']
        if not subject:
            subject = _('No subject')
        sender_name = form.cleaned_data['sender_name']
        if not sender_name:
            sender = form.cleaned_data['email']
        else:
            sender = "%s <%s>" % (form.cleaned_data['sender_name'], form.cleaned_data['email'])

        email_message = EmailMessage(
            render_to_string(self.subject_template, {
                'subject': subject,
            }).splitlines()[0],
            render_to_string(self.email_template, {
                'data': form.cleaned_data,
            }),
            sender,
            [site_email],
            headers = {
                'Reply-To': form.cleaned_data['email']
            },)
        email_message.send(fail_silently=False)

plugin_pool.register_plugin(CustomContactPlugin)
