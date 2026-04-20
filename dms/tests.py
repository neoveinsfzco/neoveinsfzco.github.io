from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import BusinessUnitMembership
from core.models import BusinessUnit
from dms.models import Document, DocumentCategory, DocumentType, DocumentVersion


class DmsRbacTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user_admin = User.objects.create_user(
            username='bu_admin',
            password='password',
        )
        self.user_quality = User.objects.create_user(
            username='quality_user',
            password='password',
        )
        self.user_staff = User.objects.create_user(
            username='staff_user',
            password='password',
        )
        self.user_outsider = User.objects.create_user(
            username='outsider',
            password='password',
        )

        self.bu1 = BusinessUnit.objects.create(
            name='BU One',
            code='BU1',
        )
        self.bu2 = BusinessUnit.objects.create(
            name='BU Two',
            code='BU2',
        )

        BusinessUnitMembership.objects.create(
            user=self.user_admin,
            business_unit=self.bu1,
            role='BU_ADMIN',
        )
        BusinessUnitMembership.objects.create(
            user=self.user_quality,
            business_unit=self.bu1,
            role='QUALITY',
        )
        BusinessUnitMembership.objects.create(
            user=self.user_staff,
            business_unit=self.bu1,
            role='STAFF',
        )

        self.cat1 = DocumentCategory.objects.create(
            business_unit=self.bu1,
            name='Policies',
            code='POL',
        )
        self.cat2 = DocumentCategory.objects.create(
            business_unit=self.bu2,
            name='Procedures',
            code='PRO',
        )
        self.type1 = DocumentType.objects.create(
            business_unit=self.bu1,
            name='Manual',
            code='MAN',
        )

    def _get_results(self, response):
        data = response.data
        return data.get('results', data)

    def test_category_list_scoped_to_member_business_units(self):
        self.client.force_authenticate(user=self.user_staff)
        response = self.client.get('/api/dms/categories/')
        self.assertEqual(response.status_code, 200)
        results = self._get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['business_unit'], self.bu1.id)

    def test_category_create_requires_quality_or_admin(self):
        payload = {
            'business_unit': self.bu1.id,
            'name': 'Work Instructions',
            'code': 'WI',
        }

        self.client.force_authenticate(user=self.user_staff)
        response = self.client.post('/api/dms/categories/', payload, format='json')
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(user=self.user_quality)
        response = self.client.post('/api/dms/categories/', payload, format='json')
        self.assertEqual(response.status_code, 201)

    def test_new_document_endpoint_requires_membership(self):
        upload = SimpleUploadedFile(
            'test.pdf',
            b'%PDF-1.4 test',
            content_type='application/pdf',
        )
        payload = {
            'business_unit': self.bu1.id,
            'title': 'Test Document',
            'category': self.cat1.id,
            'type': self.type1.id,
            'file': upload,
        }

        self.client.force_authenticate(user=self.user_outsider)
        response = self.client.post(
            reverse('dms_new_document'),
            payload,
            format='multipart',
        )
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(user=self.user_quality)
        response = self.client.post(
            reverse('dms_new_document'),
            payload,
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        document = Document.objects.first()
        self.assertIsNotNone(document)
        self.assertTrue(document.code)
        self.assertTrue(DocumentVersion.objects.exists())
