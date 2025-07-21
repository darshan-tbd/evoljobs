"""
Custom Branding and White-Labeling System
Provides tenant-specific branding, theming, and customization capabilities.
"""
import json
import base64
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import mimetypes
import hashlib
import os
from pathlib import Path

from .tenant_context import get_current_tenant, get_tenant_id, require_tenant_context


class BrandingAssetType(str, Enum):
    """Types of branding assets."""
    LOGO = "logo"
    FAVICON = "favicon"
    BANNER = "banner"
    BACKGROUND = "background"
    WATERMARK = "watermark"
    CUSTOM_CSS = "custom_css"
    CUSTOM_JS = "custom_js"


class ColorScheme(str, Enum):
    """Color scheme types."""
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"


@dataclass
class BrandingColors:
    """Branding color configuration."""
    primary: str = "#2563eb"  # Blue
    secondary: str = "#64748b"  # Slate
    accent: str = "#f59e0b"  # Amber
    background: str = "#ffffff"  # White
    surface: str = "#f8fafc"  # Light gray
    text_primary: str = "#1e293b"  # Dark slate
    text_secondary: str = "#64748b"  # Slate
    success: str = "#10b981"  # Green
    warning: str = "#f59e0b"  # Amber
    error: str = "#ef4444"  # Red
    info: str = "#3b82f6"  # Blue
    
    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary."""
        return {
            "primary": self.primary,
            "secondary": self.secondary,
            "accent": self.accent,
            "background": self.background,
            "surface": self.surface,
            "text_primary": self.text_primary,
            "text_secondary": self.text_secondary,
            "success": self.success,
            "warning": self.warning,
            "error": self.error,
            "info": self.info
        }
    
    def to_css_variables(self) -> str:
        """Convert to CSS custom properties."""
        css_vars = []
        for key, value in self.to_dict().items():
            css_var = f"--color-{key.replace('_', '-')}: {value};"
            css_vars.append(css_var)
        return "\n".join(css_vars)


@dataclass
class BrandingTypography:
    """Typography configuration."""
    font_family_primary: str = "Inter, system-ui, -apple-system, sans-serif"
    font_family_secondary: str = "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace"
    font_size_base: str = "16px"
    font_size_scale: float = 1.25
    line_height_base: float = 1.5
    font_weight_light: int = 300
    font_weight_normal: int = 400
    font_weight_medium: int = 500
    font_weight_semibold: int = 600
    font_weight_bold: int = 700
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "font_family_primary": self.font_family_primary,
            "font_family_secondary": self.font_family_secondary,
            "font_size_base": self.font_size_base,
            "font_size_scale": self.font_size_scale,
            "line_height_base": self.line_height_base,
            "font_weight_light": self.font_weight_light,
            "font_weight_normal": self.font_weight_normal,
            "font_weight_medium": self.font_weight_medium,
            "font_weight_semibold": self.font_weight_semibold,
            "font_weight_bold": self.font_weight_bold
        }


@dataclass
class BrandingAsset:
    """Branding asset information."""
    id: str
    tenant_id: str
    asset_type: BrandingAssetType
    filename: str
    content_type: str
    file_size: int
    file_path: str
    public_url: str
    alt_text: Optional[str] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "asset_type": self.asset_type.value,
            "filename": self.filename,
            "content_type": self.content_type,
            "file_size": self.file_size,
            "file_path": self.file_path,
            "public_url": self.public_url,
            "alt_text": self.alt_text,
            "description": self.description,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


@dataclass
class BrandingConfig:
    """Complete branding configuration for a tenant."""
    tenant_id: str
    brand_name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    support_email: Optional[str] = None
    colors: BrandingColors = field(default_factory=BrandingColors)
    typography: BrandingTypography = field(default_factory=BrandingTypography)
    color_scheme: ColorScheme = ColorScheme.LIGHT
    assets: Dict[str, BrandingAsset] = field(default_factory=dict)
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    email_template_override: Optional[str] = None
    custom_domain: Optional[str] = None
    hide_powered_by: bool = False
    custom_footer: Optional[str] = None
    social_links: Dict[str, str] = field(default_factory=dict)
    contact_info: Dict[str, str] = field(default_factory=dict)
    seo_config: Dict[str, str] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def get_asset(self, asset_type: BrandingAssetType) -> Optional[BrandingAsset]:
        """Get asset by type."""
        return self.assets.get(asset_type.value)
    
    def add_asset(self, asset: BrandingAsset) -> None:
        """Add or update asset."""
        self.assets[asset.asset_type.value] = asset
        self.updated_at = datetime.utcnow()
    
    def remove_asset(self, asset_type: BrandingAssetType) -> bool:
        """Remove asset by type."""
        if asset_type.value in self.assets:
            del self.assets[asset_type.value]
            self.updated_at = datetime.utcnow()
            return True
        return False
    
    def generate_css(self) -> str:
        """Generate CSS for the branding configuration."""
        css_parts = [
            ":root {",
            self.colors.to_css_variables(),
            f"--font-family-primary: {self.typography.font_family_primary};",
            f"--font-family-secondary: {self.typography.font_family_secondary};",
            f"--font-size-base: {self.typography.font_size_base};",
            f"--line-height-base: {self.typography.line_height_base};",
            "}"
        ]
        
        if self.custom_css:
            css_parts.append(self.custom_css)
        
        return "\n".join(css_parts)
    
    def generate_theme_config(self) -> Dict[str, Any]:
        """Generate theme configuration for frontend."""
        return {
            "brand_name": self.brand_name,
            "tagline": self.tagline,
            "colors": self.colors.to_dict(),
            "typography": self.typography.to_dict(),
            "color_scheme": self.color_scheme.value,
            "assets": {k: v.to_dict() for k, v in self.assets.items()},
            "custom_domain": self.custom_domain,
            "hide_powered_by": self.hide_powered_by,
            "custom_footer": self.custom_footer,
            "social_links": self.social_links,
            "contact_info": self.contact_info,
            "seo_config": self.seo_config
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "tenant_id": self.tenant_id,
            "brand_name": self.brand_name,
            "tagline": self.tagline,
            "description": self.description,
            "website_url": self.website_url,
            "support_email": self.support_email,
            "colors": self.colors.to_dict(),
            "typography": self.typography.to_dict(),
            "color_scheme": self.color_scheme.value,
            "assets": {k: v.to_dict() for k, v in self.assets.items()},
            "custom_css": self.custom_css,
            "custom_js": self.custom_js,
            "email_template_override": self.email_template_override,
            "custom_domain": self.custom_domain,
            "hide_powered_by": self.hide_powered_by,
            "custom_footer": self.custom_footer,
            "social_links": self.social_links,
            "contact_info": self.contact_info,
            "seo_config": self.seo_config,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class BrandingService:
    """Service for managing tenant branding and white-labeling."""
    
    def __init__(self, storage_path: str = "static/branding"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.allowed_image_types = {
            "image/jpeg", "image/png", "image/svg+xml", "image/webp", "image/gif"
        }
        self.max_file_size = 10 * 1024 * 1024  # 10MB
    
    @require_tenant_context
    def get_branding_config(self, tenant_id: Optional[str] = None) -> Optional[BrandingConfig]:
        """Get branding configuration for tenant."""
        if not tenant_id:
            tenant_id = get_tenant_id()
        
        # In a real implementation, this would load from database
        # For now, we'll return a default configuration
        return BrandingConfig(
            tenant_id=tenant_id,
            brand_name=f"Tenant {tenant_id}",
            tagline="Your Recruitment Partner",
            description="Enterprise recruitment platform"
        )
    
    @require_tenant_context
    def update_branding_config(self, config: BrandingConfig) -> BrandingConfig:
        """Update branding configuration."""
        config.updated_at = datetime.utcnow()
        
        # Validate configuration
        self._validate_branding_config(config)
        
        # In a real implementation, this would save to database
        # For now, we'll just return the updated config
        return config
    
    @require_tenant_context
    def upload_asset(self, 
                    tenant_id: str,
                    asset_type: BrandingAssetType,
                    file_content: bytes,
                    filename: str,
                    content_type: str,
                    alt_text: Optional[str] = None,
                    description: Optional[str] = None) -> BrandingAsset:
        """Upload branding asset."""
        # Validate file
        self._validate_asset_file(file_content, filename, content_type, asset_type)
        
        # Generate unique filename
        file_hash = hashlib.md5(file_content).hexdigest()
        file_extension = Path(filename).suffix
        unique_filename = f"{tenant_id}_{asset_type.value}_{file_hash}{file_extension}"
        
        # Save file
        file_path = self.storage_path / tenant_id / unique_filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Generate public URL
        public_url = f"/static/branding/{tenant_id}/{unique_filename}"
        
        # Create asset record
        asset = BrandingAsset(
            id=file_hash,
            tenant_id=tenant_id,
            asset_type=asset_type,
            filename=filename,
            content_type=content_type,
            file_size=len(file_content),
            file_path=str(file_path),
            public_url=public_url,
            alt_text=alt_text,
            description=description
        )
        
        return asset
    
    @require_tenant_context
    def delete_asset(self, tenant_id: str, asset_id: str) -> bool:
        """Delete branding asset."""
        # In a real implementation, this would remove from database and filesystem
        # For now, we'll just return True
        return True
    
    @require_tenant_context
    def generate_custom_css(self, tenant_id: str) -> str:
        """Generate custom CSS for tenant."""
        config = self.get_branding_config(tenant_id)
        if not config:
            return ""
        
        return config.generate_css()
    
    @require_tenant_context
    def generate_theme_bundle(self, tenant_id: str) -> Dict[str, Any]:
        """Generate complete theme bundle for frontend."""
        config = self.get_branding_config(tenant_id)
        if not config:
            return {}
        
        return {
            "config": config.generate_theme_config(),
            "css": config.generate_css(),
            "js": config.custom_js or "",
            "assets": {k: v.public_url for k, v in config.assets.items()}
        }
    
    def _validate_branding_config(self, config: BrandingConfig) -> None:
        """Validate branding configuration."""
        # Validate brand name
        if not config.brand_name or len(config.brand_name) > 100:
            raise ValueError("Brand name must be between 1 and 100 characters")
        
        # Validate colors (hex format)
        import re
        hex_pattern = re.compile(r'^#(?:[0-9a-fA-F]{3}){1,2}$')
        
        for color_name, color_value in config.colors.to_dict().items():
            if not hex_pattern.match(color_value):
                raise ValueError(f"Invalid color format for {color_name}: {color_value}")
        
        # Validate URLs
        if config.website_url:
            if not config.website_url.startswith(('http://', 'https://')):
                raise ValueError("Website URL must start with http:// or https://")
        
        # Validate email
        if config.support_email:
            import re
            email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_pattern.match(config.support_email):
                raise ValueError("Invalid support email format")
    
    def _validate_asset_file(self, 
                           file_content: bytes,
                           filename: str,
                           content_type: str,
                           asset_type: BrandingAssetType) -> None:
        """Validate asset file."""
        # Check file size
        if len(file_content) > self.max_file_size:
            raise ValueError(f"File size exceeds maximum of {self.max_file_size} bytes")
        
        # Check content type for images
        if asset_type in [BrandingAssetType.LOGO, BrandingAssetType.FAVICON, 
                         BrandingAssetType.BANNER, BrandingAssetType.BACKGROUND]:
            if content_type not in self.allowed_image_types:
                raise ValueError(f"Invalid image type: {content_type}")
        
        # Check CSS content
        if asset_type == BrandingAssetType.CUSTOM_CSS:
            if content_type not in ["text/css", "text/plain"]:
                raise ValueError("CSS files must have text/css or text/plain content type")
        
        # Check JS content
        if asset_type == BrandingAssetType.CUSTOM_JS:
            if content_type not in ["application/javascript", "text/javascript", "text/plain"]:
                raise ValueError("JS files must have appropriate JavaScript content type")
    
    def get_default_branding_templates(self) -> Dict[str, BrandingConfig]:
        """Get default branding templates."""
        return {
            "corporate": BrandingConfig(
                tenant_id="template",
                brand_name="Corporate Template",
                tagline="Professional Excellence",
                colors=BrandingColors(
                    primary="#1e40af",
                    secondary="#64748b",
                    accent="#0ea5e9"
                ),
                typography=BrandingTypography(
                    font_family_primary="'Roboto', sans-serif"
                )
            ),
            "modern": BrandingConfig(
                tenant_id="template",
                brand_name="Modern Template",
                tagline="Innovation & Growth",
                colors=BrandingColors(
                    primary="#8b5cf6",
                    secondary="#6b7280",
                    accent="#10b981"
                ),
                typography=BrandingTypography(
                    font_family_primary="'Poppins', sans-serif"
                )
            ),
            "minimal": BrandingConfig(
                tenant_id="template",
                brand_name="Minimal Template",
                tagline="Simplicity & Focus",
                colors=BrandingColors(
                    primary="#000000",
                    secondary="#9ca3af",
                    accent="#f59e0b"
                ),
                typography=BrandingTypography(
                    font_family_primary="'Inter', sans-serif"
                )
            )
        }


# Global branding service instance
branding_service = BrandingService()


# Helper functions for templates
def get_tenant_branding() -> Optional[BrandingConfig]:
    """Get current tenant's branding configuration."""
    tenant_id = get_tenant_id()
    if not tenant_id:
        return None
    
    return branding_service.get_branding_config(tenant_id)


def get_tenant_theme_bundle() -> Dict[str, Any]:
    """Get complete theme bundle for current tenant."""
    tenant_id = get_tenant_id()
    if not tenant_id:
        return {}
    
    return branding_service.generate_theme_bundle(tenant_id)


def get_tenant_css() -> str:
    """Get custom CSS for current tenant."""
    tenant_id = get_tenant_id()
    if not tenant_id:
        return ""
    
    return branding_service.generate_custom_css(tenant_id) 