from dataclasses import dataclass, field
from enum import Enum
from functools import lru_cache, wraps
import json
import logging
import time
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AuthEngine")



class AuthErrorCode(str, Enum):
    TOKEN_INVALID = "AUTH_1001"
    TOKEN_EXPIRED = "AUTH_1002"
    PERMISSION_DENIED = "AUTH_2001"
    BULK_AUTH_PARTIAL_FAILURE = "AUTH_2002"
    COMPONENT_UNINITIALIZED = "AUTH_3001"
    INVALID_RESOURCE_CONTEXT = "AUTH_3002"


class AuthError(Exception):
    """Base exception providing descriptive context and structured output."""

    def __init__(
        self,
        message: str,
        code: AuthErrorCode,
        component: str,
        action: Optional[str] = None,
        user_id: Optional[str] = None,
        resource_id: Optional[str] = None,
        remediation: Optional[str] = None,
        extra_details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.component = component
        self.action = action
        self.user_id = user_id
        self.resource_id = resource_id
        self.remediation = remediation
        self.extra_details = extra_details or {}
        self.timestamp = time.time()
        super().__init__(self._build_descriptive_message())

    def _build_descriptive_message(self) -> str:
        ctx_parts = [f"[{self.code.value}] Component '{self.component}' failed"]
        if self.action:
            ctx_parts.append(f"during '{self.action}'")
        if self.user_id:
            ctx_parts.append(f"for User '{self.user_id}'")
        if self.resource_id:
            ctx_parts.append(f"on Resource '{self.resource_id}'")

        header = " ".join(ctx_parts) + f": {self.message}"
        
        details = []
        if self.remediation:
            details.append(f"  Fix/Remediation: {self.remediation}")
        if self.extra_details:
            details.append(f"  Context Data: {json.dumps(self.extra_details)}")

        return "\n".join([header] + details) if details else header

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.code.value,
            "message": self.message,
            "component": self.component,
            "action": self.action,
            "user_id": self.user_id,
            "resource_id": self.resource_id,
            "remediation": self.remediation,
            "extra_details": self.extra_details,
            "timestamp": self.timestamp,
        }


class AuthenticationError(AuthError):
    """Raised when user identity validation fails."""
    pass


class AuthorizationError(AuthError):
    """Raised when access control permissions are violated."""
    pass


class ComponentConfigError(AuthError):
    """Raised when a component is misconfigured or uninitialized."""
    pass



@dataclass(frozen=True)
class UserContext:
    user_id: str
    roles: Set[str]
    permissions: Set[str]
    token_exp: float


@dataclass
class DatasetRecord:
    record_id: str
    sensitivity_level: str  # e.g., "public", "internal", "restricted"
    required_permission: str


class DatasetAuthEngine:
    """High-performance authorization engine designed for large datasets."""

    def __init__(self, component_name: str = "DatasetAuthEngine"):
        self.component_name = component_name

    @lru_cache(maxsize=1024)
    def validate_user_token(self, token: str) -> UserContext:
        """Simulate fast token parsing and caching to eliminate per-record overhead."""
        if not token:
            raise AuthenticationError(
                message="Authentication token is missing.",
                code=AuthErrorCode.TOKEN_INVALID,
                component=self.component_name,
                action="validate_user_token",
                remediation="Ensure the 'Authorization' header contains a valid bearer token.",
            )

        if token == "expired_token":
            raise AuthenticationError(
                message="Authentication token has expired.",
                code=AuthErrorCode.TOKEN_EXPIRED,
                component=self.component_name,
                action="validate_user_token",
                remediation="Request a fresh access token from the Identity Provider.",
            )
        elif token == "invalid_token":
            raise AuthenticationError(
                message="Authentication token signature verification failed.",
                code=AuthErrorCode.TOKEN_INVALID,
                component=self.component_name,
                action="validate_user_token",
                remediation="Verify token integrity or re-authenticate.",
            )

        return UserContext(
            user_id="usr_88291",
            roles={"analyst"},
            permissions={"read:public", "read:internal"},
            token_exp=time.time() + 3600,
        )

    def filter_authorized_records(
        self, user_ctx: UserContext, records: List[DatasetRecord], strict: bool = False
    ) -> List[DatasetRecord]:
        """
        Fast batch auth check over large dataset slices using set-based operations.
        O(N) time complexity with vectorized permission evaluation.
        """
        start_time = time.perf_counter()
        user_perms = user_ctx.permissions
        authorized: List[DatasetRecord] = []
        unauthorized_records: List[Tuple[str, str]] = []

        for record in records:
            if record.required_permission in user_perms:
                authorized.append(record)
            else:
                unauthorized_records.append((record.record_id, record.required_permission))

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.debug(f"Processed {len(records)} records in {elapsed_ms:.2f}ms")

        if unauthorized_records and strict:
            failed_ids = [r[0] for r in unauthorized_records[:5]]
            missing_perms = list({r[1] for r in unauthorized_records})
            raise AuthorizationError(
                message=f"Access denied for {len(unauthorized_records)} dataset records.",
                code=AuthErrorCode.BULK_AUTH_PARTIAL_FAILURE,
                component=self.component_name,
                action="filter_authorized_records",
                user_id=user_ctx.user_id,
                remediation=f"Grant missing permission(s) {missing_perms} to user or filter query beforehand.",
                extra_details={
                    "total_requested": len(records),
                    "failed_count": len(unauthorized_records),
                    "sample_failed_record_ids": failed_ids,
                    "missing_permissions": missing_perms,
                },
            )

        return authorized



def require_permission(permission: str, component_name: str):
    """Decorator for component methods ensuring proper authorization & rich exceptions."""

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(self, user_ctx: UserContext, *args, **kwargs):
            if not isinstance(user_ctx, UserContext):
                raise ComponentConfigError(
                    message="Invalid UserContext object supplied to component.",
                    code=AuthErrorCode.COMPONENT_UNINITIALIZED,
                    component=component_name,
                    action=func.__name__,
                    remediation="Pass a valid UserContext retrieved from DatasetAuthEngine.",
                )

            if permission not in user_ctx.permissions:
                raise AuthorizationError(
                    message=f"Required permission '{permission}' is missing from user context.",
                    code=AuthErrorCode.PERMISSION_DENIED,
                    component=component_name,
                    action=func.__name__,
                    user_id=user_ctx.user_id,
                    remediation=f"Assign role containing permission '{permission}' to user '{user_ctx.user_id}'.",
                    extra_details={
                        "required_permission": permission,
                        "granted_permissions": list(user_ctx.permissions),
                        "user_roles": list(user_ctx.roles),
                    },
                )

            return func(self, user_ctx, *args, **kwargs)

        return wrapper

    return decorator



class DataPipelineComponent:
    """Component consuming datasets with strict permission checks."""

    def __init__(self):
        self.name = "DataPipelineComponent"

    @require_permission("read:restricted", component_name="DataPipelineComponent")
    def process_restricted_dataset(self, user_ctx: UserContext, dataset_id: str):
        return f"Successfully processed restricted dataset '{dataset_id}'"



if __name__ == "__main__":
    engine = DatasetAuthEngine()

    print("--- TEST 1: High-Performance Dataset Filtering (100,000 records) ---")
    large_dataset = [
        DatasetRecord(f"rec_{i}", "internal", "read:internal" if i % 10 != 0 else "read:restricted")
        for i in range(100_000)
    ]
    
    user_ctx = engine.validate_user_token("valid_token")
    
    start = time.perf_counter()
    filtered = engine.filter_authorized_records(user_ctx, large_dataset, strict=False)
    duration = time.perf_counter() - start
    
    print(f"Filter Time: {duration:.4f}s | Input: {len(large_dataset)} | Authorized Output: {len(filtered)}")

    print("\n--- TEST 2: Descriptive Bulk Auth Error Handling ---")
    try:
        engine.filter_authorized_records(user_ctx, large_dataset, strict=True)
    except AuthorizationError as e:
        print("Caught Expected AuthorizationError:\n")
        print(e)

    print("\n--- TEST 3: Descriptive Component Permission Error ---")
    pipeline = DataPipelineComponent()
    try:
        pipeline.process_restricted_dataset(user_ctx, dataset_id="ds_sensitive_99")
    except AuthorizationError as e:
        print("Caught Expected Component Error:\n")
        print(e)