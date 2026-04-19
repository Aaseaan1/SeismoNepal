from django.views.generic import RedirectView
from django.urls import include, path
from portal.admin import seismonep_admin

urlpatterns = [
    path('', RedirectView.as_view(url='/portal/', permanent=False)),
    path('admin/', seismonep_admin.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/alerts/', include('alerts.urls')),
    path('api/scraper/', include('scraper.urls')),
    path('portal/', include('portal.urls')),
]
