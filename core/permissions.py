from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import BusinessUnitMembership


def get_user_business_unit_ids(user):
    if not user or not user.is_authenticated:
        return []
    if user.is_staff or user.is_superuser:
        return None
    return list(
        BusinessUnitMembership.objects.filter(user=user).values_list(
            'business_unit_id', flat=True
        )
    )


def filter_queryset_by_membership(queryset, user, bu_field):
    bu_ids = get_user_business_unit_ids(user)
    if bu_ids is None:
        return queryset
    return queryset.filter(**{f'{bu_field}__in': bu_ids})


def user_in_business_unit(user, bu_id, roles=None):
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    qs = BusinessUnitMembership.objects.filter(user=user, business_unit_id=bu_id)
    if roles:
        qs = qs.filter(role__in=roles)
    return qs.exists()


def user_has_role(user, bu_id, roles):
    if not roles:
        return user_in_business_unit(user, bu_id)
    return user_in_business_unit(user, bu_id, roles)


class BusinessUnitRolePermission(BasePermission):
    """
    Enforces BU membership and optional role checks.

    View attributes:
    - write_roles: tuple of roles allowed to write (None = any member).
    - admin_only_write: bool to restrict write access to staff/superuser only.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        if request.method in SAFE_METHODS:
            return True
        if getattr(view, 'admin_only_write', False):
            return False
        if request.method != 'POST':
            return True
        bu_id = None
        if hasattr(view, 'get_bu_id_for_request'):
            bu_id = view.get_bu_id_for_request(request)
        if not bu_id:
            return False
        return user_in_business_unit(
            request.user, bu_id, getattr(view, 'write_roles', None)
        )

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        bu_id = None
        if hasattr(view, 'get_bu_id_for_obj'):
            bu_id = view.get_bu_id_for_obj(obj)
        else:
            bu_id = getattr(obj, 'business_unit_id', None)
        if not bu_id:
            return False
        if request.method in SAFE_METHODS:
            return user_in_business_unit(request.user, bu_id)
        if getattr(view, 'admin_only_write', False):
            return False
        return user_in_business_unit(
            request.user, bu_id, getattr(view, 'write_roles', None)
        )
