from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import BusinessUnitMembership
from core.models import BusinessUnit
from nc.models import NonConformance


class NonConformanceRbacTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user_staff = User.objects.create_user(
            username='nc_staff',
            password='password',
        )
        self.user_outsider = User.objects.create_user(
            username='nc_outsider',
            password='password',
        )

        self.bu1 = BusinessUnit.objects.create(
            name='BU One',
            code='NC1',
        )
        self.bu2 = BusinessUnit.objects.create(
            name='BU Two',
            code='NC2',
        )

        BusinessUnitMembership.objects.create(
            user=self.user_staff,
            business_unit=self.bu1,
            role='STAFF',
        )

        NonConformance.objects.create(
            business_unit=self.bu1,
            reference='NC-001',
            description='Test NC',
            classification='Minor',
            status='Open',
        )
        NonConformance.objects.create(
            business_unit=self.bu2,
            reference='NC-002',
            description='Other NC',
            classification='Major',
            status='Open',
        )

    def _get_results(self, response):
        data = response.data
        return data.get('results', data)

    def test_nonconformance_list_scoped_to_member_business_units(self):
        self.client.force_authenticate(user=self.user_staff)
        response = self.client.get('/api/nc/nonconformances/')
        self.assertEqual(response.status_code, 200)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['business_unit'], self.bu1.id)

    def test_nonconformance_create_requires_membership(self):
        payload = {
            'business_unit': self.bu1.id,
            'description': 'New NC',
            'classification': 'Moderate',
            'status': 'Open',
            'due_date': timezone.now().date().isoformat(),
        }

        self.client.force_authenticate(user=self.user_outsider)
        response = self.client.post('/api/nc/nonconformances/', payload, format='json')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(user=self.user_staff)
        response = self.client.post('/api/nc/nonconformances/', payload, format='json')
        self.assertEqual(response.status_code, 201)
