from pydantic import BaseModel


class UpdateRoleRequest(BaseModel):
    """Request body for PATCH /admin/users/{user_id}/role.

    Only field admin_routes.py's change_user_role() accesses is
    payload.role, compared against VALID_ROLES ({'student', 'educator',
    'admin'}) inside the route itself — so validation of which specific
    strings are acceptable happens there, not here. This model's only
    job is confirming the request body contains a string field named
    'role'.
    """

    role: str