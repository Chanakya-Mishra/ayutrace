"""Reusable UI Components for ShelfSense AI.

Module Owner: Frontend Developer (Member 3)

Planned Responsibilities:
1. Product capture and image upload controls.
2. Verified label correction forms (allowing human review of AI extractions).
3. Batch inventory tabular view and filtering components.
4. Expiry warning indicators and stock priority callouts.

Current Status:
Initialization phase. Provides a modular, reusable image uploader and preview
component integrated into the main Streamlit application.
"""

from typing import Optional, Tuple
import streamlit as st


def render_image_uploader() -> Tuple[Optional[bytes], Optional[str]]:
    """Render the product image upload widget and preview container.

    Accepts JPG, JPEG, and PNG images. When an image is provided by the user,
    displays a high-resolution preview along with informational status indicating
    that AI scanning is scheduled for the next development sprint.

    Returns:
        Tuple[Optional[bytes], Optional[str]]: A tuple containing:
            - image_bytes: Raw bytes of the uploaded file, or None if no file was uploaded.
            - mime_type: The MIME type of the uploaded file, or None.
    """
    st.markdown("### Upload a Product Image")
    st.markdown(
        "Upload a clear photograph of a packaged grocery item, food container, or retail product. "
        "Ensure dates, batch numbers, and product titles are clearly visible."
    )

    uploaded_file = st.file_uploader(
        label="Choose a product package photo",
        type=["jpg", "jpeg", "png"],
        help="Supported formats: JPG, JPEG, PNG. Optimal results with clear lighting and direct angles.",
        label_visibility="collapsed",
    )

    if uploaded_file is not None:
        file_bytes = uploaded_file.getvalue()
        mime_type = uploaded_file.type

        st.image(
            uploaded_file,
            caption=f"Uploaded Image: {uploaded_file.name} ({len(file_bytes) / 1024:.1f} KB)",
            use_container_width=True,
        )

        st.info(
            "ℹ️ **Status Notice:** Gemma 4-powered product scanning will be available "
            "in the next development phase."
        )

        return file_bytes, mime_type

    return None, None
