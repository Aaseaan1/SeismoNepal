from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from datetime import timedelta, datetime
from django.utils import timezone
import requests

from accounts.models import ClientProfile, User
from alerts.models import AlertNotification, DeviceToken
from scraper.models import EarthquakeEvent


class CustomAdminSite(admin.AdminSite):
    site_header = "SeismoNepal Administration"
    site_title = "SeismoNepal Admin"
    index_title = "Dashboard"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
            path('client-profile/', self.admin_view(self.client_profile_view), name='client-profile'),
            path('client-profile/add/', self.admin_view(self.add_client_profile_view), name='add-client-profile'),
            path('client-profile/edit/<int:profile_id>/', self.admin_view(self.edit_client_profile_view), name='edit-client-profile'),
            path('client-profile/delete/<int:profile_id>/', self.admin_view(self.delete_client_profile_view), name='delete-client-profile'),
            path('earthquake-data/', self.admin_view(self.earthquake_data_view), name='earthquake-data'),
        ]
        return custom_urls + urls

    def delete_client_profile_view(self, request, profile_id):
        from accounts.models import ClientProfile
        from django.shortcuts import redirect, get_object_or_404
        profile = get_object_or_404(ClientProfile, id=profile_id)
        if request.method == 'POST':
            profile.delete()
            from django.contrib import messages
            messages.success(request, 'Client profile deleted successfully.')
            return redirect('/admin/client-profile/')
        context = {
            'profile': profile,
            'title': 'Delete Client Profile',
        }
        return render(request, 'admin/delete_profile.html', context)

    def edit_client_profile_view(self, request, profile_id):
        from django import forms
        from accounts.models import ClientProfile, User
        profile = ClientProfile.objects.select_related('user').get(id=profile_id)
        class EditClientProfileForm(forms.ModelForm):
            user = forms.CharField(
                widget=forms.TextInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
                label='User',
                required=True,
                initial=profile.user.username
            )
            phone = forms.CharField(
                widget=forms.TextInput(attrs={'class': 'form-control'}),
                label='Phone',
                required=False,
                initial=profile.user.phone_number
            )
            class Meta:
                model = ClientProfile
                fields = ['user', 'full_name', 'date_of_birth', 'address', 'sex', 'district', 'province', 'state_no', 'blood_group']
        if request.method == 'POST':
            form = EditClientProfileForm(request.POST, instance=profile)
            if form.is_valid():
                # User field is readonly, so just update phone
                phone = form.cleaned_data.get('phone', '').strip()
                if phone:
                    profile.user.phone_number = phone
                    profile.user.save()
                form.save()
                from django.contrib import messages
                messages.success(request, 'Client profile updated successfully.')
                return redirect('/admin/client-profile/')
        else:
            form = EditClientProfileForm(instance=profile, initial={
                'user': profile.user.username,
                'phone': profile.user.phone_number,
            })
        context = {
            'form': form,
            'title': 'Edit Client Profile',
        }
        return render(request, 'admin/edit_profile.html', context)
    def add_client_profile_view(self, request):
        from django import forms
        from accounts.models import ClientProfile, User
        class ClientProfileForm(forms.ModelForm):
            user = forms.CharField(
                widget=forms.TextInput(attrs={'class': 'form-control'}),
                label='User',
                required=True
            )
            phone = forms.CharField(
                widget=forms.TextInput(attrs={'class': 'form-control'}),
                label='Phone',
                required=False
            )
            class Meta:
                model = ClientProfile
                fields = ['user', 'full_name', 'date_of_birth', 'address', 'sex', 'district', 'province', 'state_no', 'blood_group']
        if request.method == 'POST':
            form = ClientProfileForm(request.POST)
            if form.is_valid():
                # Manually resolve user by username
                username = form.cleaned_data['user']
                try:
                    user_obj = User.objects.get(username=username)
                except User.DoesNotExist:
                    form.add_error('user', 'No user with that username exists.')
                    context = {'form': form, 'title': 'Add Client Profile'}
                    return render(request, 'admin/add_profile.html', context)
                # Update phone number if provided
                phone = form.cleaned_data.get('phone', '').strip()
                if phone:
                    user_obj.phone_number = phone
                    user_obj.save()
                profile = form.save(commit=False)
                profile.user = user_obj
                profile.save()
                from django.contrib import messages
                messages.success(request, 'Client profile added successfully.')
                return redirect('/admin/client-profile/')
        else:
            form = ClientProfileForm()
        context = {
            'form': form,
            'title': 'Add Client Profile',
        }
        return render(request, 'admin/add_profile.html', context)

    def index(self, request, extra_context=None):
        """Override default index to show custom dashboard"""
        return self.dashboard_view(request)

    def client_profile_view(self, request):
        """Client profile listing for admin users."""
        profiles = ClientProfile.objects.select_related('user').order_by('user__username')
        context = {
            'title': 'Client Profile',
            'profiles': profiles,
        }
        return render(request, 'admin/client_profile.html', context)

    def _fetch_earthquakes(self):
        """Fetch earthquake data from backend API first, then USGS fallback."""
        all_earthquakes = []
        data_source = 'backend-api'

        try:
            response = requests.get('http://localhost:8000/api/scraper/events/', timeout=5)
            if response.status_code == 200:
                all_earthquakes = response.json()
                if not isinstance(all_earthquakes, list):
                    all_earthquakes = []
        except Exception as e:
            print(f"Failed to fetch from API: {e}")

        if not all_earthquakes:
            data_source = 'usgs-fallback'
            try:
                nepal_bounds = {
                    'minLat': 26.347,
                    'maxLat': 30.447,
                    'minLon': 80.058,
                    'maxLon': 88.201,
                }
                start_date = '2006-01-01'
                end_date = '2026-12-31'
                usgs_url = (
                    f'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson'
                    f'&minlatitude={nepal_bounds["minLat"]}&maxlatitude={nepal_bounds["maxLat"]}'
                    f'&minlongitude={nepal_bounds["minLon"]}&maxlongitude={nepal_bounds["maxLon"]}'
                    f'&starttime={start_date}&endtime={end_date}'
                    f'&orderby=time&limit=1200'
                )
                response = requests.get(usgs_url, timeout=10)
                if response.status_code == 200:
                    usgs_data = response.json()
                    blocked_keywords = (
                        'india',
                        'china',
                        'southern tibetan plateau',
                        'tibetan plateau',
                        'xizang',
                    )
                    all_earthquakes = [
                        {
                            'id': f.get('id'),
                            'location': f.get('properties', {}).get('place', 'Unknown'),
                            'magnitude': f.get('properties', {}).get('mag', 0),
                            'occurred_at': timezone.datetime.fromtimestamp(
                                f.get('properties', {}).get('time', 0) / 1000
                            ).isoformat(),
                        }
                        for f in usgs_data.get('features', [])
                        if isinstance(f, dict)
                        and isinstance(f.get('geometry', {}).get('coordinates', []), list)
                        and len(f.get('geometry', {}).get('coordinates', [])) >= 2
                        and isinstance(f.get('geometry', {}).get('coordinates', [None, None])[0], (int, float))
                        and isinstance(f.get('geometry', {}).get('coordinates', [None, None])[1], (int, float))
                        and nepal_bounds['minLon'] <= f.get('geometry', {}).get('coordinates', [None, None])[0] <= nepal_bounds['maxLon']
                        and nepal_bounds['minLat'] <= f.get('geometry', {}).get('coordinates', [None, None])[1] <= nepal_bounds['maxLat']
                        and not any(
                            keyword in str(f.get('properties', {}).get('place', '')).lower()
                            for keyword in blocked_keywords
                        )
                    ]
            except Exception as e:
                print(f"Failed to fetch from USGS: {e}")

        return all_earthquakes, data_source

    def earthquake_data_view(self, request):
        """Tabular earthquake dataset view for admin users."""
        all_earthquakes, data_source = self._fetch_earthquakes()

        rows = []
        month_abbrev = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
        }
        for event in all_earthquakes:
            occurred_at = str(event.get('occurred_at', ''))
            occurred_at_display = occurred_at
            occurred_year = None
            try:
                occurred_dt = datetime.fromisoformat(occurred_at.replace('Z', '+00:00'))
                occurred_at_display = occurred_dt.strftime('%b-%d-%Y')
                occurred_year = occurred_dt.year
            except (ValueError, TypeError, AttributeError):
                if len(occurred_at) >= 10 and occurred_at[4] == '-' and occurred_at[7] == '-':
                    month = month_abbrev.get(occurred_at[5:7], occurred_at[5:7])
                    occurred_at_display = f"{month}-{occurred_at[8:10]}-{occurred_at[0:4]}"
                    try:
                        occurred_year = int(occurred_at[0:4])
                    except (ValueError, TypeError):
                        occurred_year = None
            location = str(event.get('location', 'Unknown'))
            magnitude = event.get('magnitude')
            try:
                magnitude = float(magnitude)
            except (ValueError, TypeError):
                magnitude = None

            rows.append(
                {
                    'occurred_at': occurred_at,
                    'occurred_at_display': occurred_at_display,
                    'occurred_year': occurred_year,
                    'location': location,
                    'magnitude': magnitude,
                }
            )

        rows.sort(key=lambda item: item['occurred_at'], reverse=True)

        yearly_events = {year: [] for year in range(2006, 2027)}
        for row in rows:
            year = row.get('occurred_year')
            if year in yearly_events:
                yearly_events[year].append(row)

        yearly_groups = [
            {
                'year': year,
                'events': yearly_events[year],
            }
            for year in range(2006, 2027)
        ]

        context = {
            'title': 'Earthquake Data',
            'data_source': data_source,
            'total_events': len(rows),
            'events': rows,
            'yearly_groups': yearly_groups,
        }
        return render(request, 'admin/earthquake_data.html', context)

    def dashboard_view(self, request):
        """Custom dashboard view for SeismoNepal"""
        # Get statistics
        total_users = User.objects.count()
        total_alerts = AlertNotification.objects.count()
        total_earthquakes = EarthquakeEvent.objects.count()
        active_device_tokens = DeviceToken.objects.count()
        users_with_tokens = DeviceToken.objects.values('user').distinct().count()

        # Fetch earthquakes for dashboard analytics (2006-2026 range)
        monthly_count = 0
        today_count = 0
        magnitude_total = 0.0
        magnitude_count = 0
        all_earthquakes, _ = self._fetch_earthquakes()
        if isinstance(all_earthquakes, list) and len(all_earthquakes) > 0:
            total_earthquakes = len(all_earthquakes)

        # Parse dates and calculate metrics (matching mobile frontend logic exactly)
        now = timezone.now()

        for event in all_earthquakes:
            occurred_at = None
            try:
                # Try ISO format first (from API responses)
                occurred_at = datetime.fromisoformat(str(event.get('occurred_at', '')).replace('Z', '+00:00'))
            except (ValueError, AttributeError, TypeError):
                pass
            magnitude = event.get('magnitude')
            magnitude_value = None
            if magnitude is not None:
                try:
                    magnitude_value = float(magnitude)
                except (ValueError, TypeError):
                    magnitude_value = None

            if occurred_at:
                # Check if this month
                if occurred_at.month == now.month and occurred_at.year == now.year:
                    monthly_count += 1
                
                # Check if today
                if (occurred_at.day == now.day and 
                    occurred_at.month == now.month and 
                    occurred_at.year == now.year):
                    today_count += 1

            # Calculate average magnitude exactly like mobile
            if magnitude_value is not None:
                magnitude_total += magnitude_value
                magnitude_count += 1

        # Format average magnitude the same way as mobile (toFixed(1))
        average_magnitude = round(magnitude_total / magnitude_count, 1) if magnitude_count > 0 else 0.0

        # Recent earthquakes (last 7 days)
        last_week = timezone.now() - timedelta(days=7)
        recent_earthquakes = EarthquakeEvent.objects.filter(
            scraped_at__gte=last_week
        ).order_by('-scraped_at')[:5]
        # Recent alerts (last 7 days)
        recent_alerts = AlertNotification.objects.filter(
            created_at__gte=last_week
        ).order_by('-created_at')[:5]

        # Yearly average magnitude trend for chart axis: X=Year, Y=Magnitude
        start_year = 2006
        end_year = 2026
        yearly_totals = {year: 0.0 for year in range(start_year, end_year + 1)}
        yearly_counts = {year: 0 for year in range(start_year, end_year + 1)}

        for event in all_earthquakes:
            occurred_at = None
            try:
                occurred_at = datetime.fromisoformat(str(event.get('occurred_at', '')).replace('Z', '+00:00'))
            except (ValueError, AttributeError, TypeError):
                occurred_at = None

            magnitude = event.get('magnitude')
            if occurred_at is None or magnitude is None:
                continue

            try:
                value = float(magnitude)
            except (ValueError, TypeError):
                continue

            year = occurred_at.year
            if year < start_year or year > end_year or value < 0:
                continue

            yearly_totals[year] += value
            yearly_counts[year] += 1

        yearly_magnitude_stats = []
        for year in range(start_year, end_year + 1):
            count = yearly_counts[year]
            yearly_magnitude_stats.append(
                {
                    'year': str(year),
                    'average_magnitude': round(yearly_totals[year] / count, 2) if count > 0 else None,
                    'count': count,
                }
            )

        magnitude_chart_labels = [item['year'] for item in yearly_magnitude_stats]
        magnitude_chart_values = [item['average_magnitude'] for item in yearly_magnitude_stats]
        magnitude_chart_colors = ['#1f6fd8' for _ in yearly_magnitude_stats]

        context = {
            'total_users': total_users,
            'total_alerts': total_alerts,
            'total_earthquakes': total_earthquakes,
            'active_device_tokens': active_device_tokens,
            'users_with_tokens': users_with_tokens,
            'monthly_count': monthly_count,
            'today_count': today_count,
            'average_magnitude': average_magnitude,
            'recent_earthquakes': recent_earthquakes,
            'recent_alerts': recent_alerts,
            'yearly_magnitude_stats': yearly_magnitude_stats,
            'magnitude_chart_labels': magnitude_chart_labels,
            'magnitude_chart_values': magnitude_chart_values,
            'magnitude_chart_colors': magnitude_chart_colors,
            'title': 'Dashboard',
        }

        return render(request, 'admin/dashboard.html', context)


# Create custom admin site instance
seismonep_admin = CustomAdminSite(name='seismonep')

# Register models with custom admin
seismonep_admin.register(User)
seismonep_admin.register(ClientProfile)
seismonep_admin.register(AlertNotification)
seismonep_admin.register(DeviceToken)
seismonep_admin.register(EarthquakeEvent)

