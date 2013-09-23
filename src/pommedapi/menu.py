from menus.base import Menu, NavigationNode
from menus.menu_pool import menu_pool
from django.utils.translation import ugettext_lazy as _
from django.core.urlresolvers import reverse

class TestMenu(Menu):

    def get_nodes(self, request):
        nodes = []
        if request.user.is_authenticated():
            logout_url = reverse('django.contrib.auth.views.logout')
            n1 = NavigationNode(_('Logout'), logout_url, 1)
            nodes.append(n1)
        else:
            login_url = reverse('django.contrib.auth.views.login')
            registration_url = reverse('registration_register')
            n1 = NavigationNode(_('Login'), login_url, 1)
            n2 = NavigationNode(_('Register'), registration_url, 2)
            nodes.append(n1)
            nodes.append(n2)
        return nodes

menu_pool.register_menu(TestMenu)
