from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import BusinessUnitMembership
from core.models import BusinessUnit
from ir.models import Incident


class IncidentRbacTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user_staff = User.objects.create_user(
            username='ir_staff',
            password='password',
        )
        self.user_outsider = User.objects.create_user(
            username='ir_outsider',
            password='password',
        )

        self.bu1 = BusinessUnit.objects.create(
            name='BU One',
            code='IR1',
        )
        self.bu2 = BusinessUnit.objects.create(
            name='BU Two',
            code='IR2',
        )

        BusinessUnitMembership.objects.create(
            user=self.user_staff,
            business_unit=self.bu1,
            role='STAFF',
        )

        Incident.objects.create(
            business_unit=self.bu1,
            reference='IR-001',
            reported_by=self.user_staff,
            incident_date=timezone.now(),
            location='Area A',
            description='Test incident',
            severity='Minor',
        )
        Incident.objects.create(
            business_unit=self.bu2,
            reference='IR-002',
            reported_by=self.user_staff,
            incident_date=timezone.now(),
            location='Area B',
            description='Other incident',
            severity='Major',
        )

    def _get_results(self, response):
        data = response.data
        return data.get('results', data)

    def test_incident_list_scoped_to_member_business_units(self):
        self.client.force_authenticate(user=self.user_staff)
        response = self.client.get('/api/ir/incidents/')
        self.assertEqual(response.status_code, 200)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['business_unit'], self.bu1.id)

    def test_incident_create_requires_membership(self):
        payload = {
            'business_unit': self.bu1.id,
            'incident_date': timezone.now().isoformat(),
            'location': 'Area C',
            'description': 'New incident',
            'severity': 'Moderate',
        }

        self.client.force_authenticate(user=self.user_outsider)
        response = self.client.post('/api/ir/incidents/', payload, format='json')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(user=self.user_staff)
        response = self.client.post('/api/ir/incidents/', payload, format='json')
        self.assertEqual(response.status_code, 201)
