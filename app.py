"""Main Application Entry Point for ShelfSense AI.

Module Owner: Project Lead & Integrator (Member 1)

ShelfSense AI is a multimodal, AI-assisted inventory management platform for grocery
stores, small retailers, cafés, and kitchens handling expiry-sensitive packaged goods.

Run with:
    streamlit run app.py
"""

import streamlit as st
from ui import render_image_uploader

# -----------------------------------------------------------------------------
# Streamlit Page Configuration
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="ShelfSense AI — Scan Smart. Track Fresh. Reduce Waste.",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -----------------------------------------------------------------------------
# Clean Modern SaaS Styling (Emerald Green & Neutral Palette)
# -----------------------------------------------------------------------------
st.markdown(
    """
    <style>
    /* Global layout & typography */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1080px;
    }
    
    /* Header styling */
    .brand-title {
        font-size: 2.25rem;
        font-weight: 700;
        color: #064e3b;
        margin-bottom: 0.25rem;
        letter-spacing: -0.02em;
    }
    .brand-tagline {
        font-size: 1.1rem;
        font-weight: 500;
        color: #047857;
        margin-bottom: 1.5rem;
    }
    
    /* Information cards */
    .info-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1.25rem;
        height: 100%;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
    }
    .info-card h4 {
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-size: 1.05rem;
        font-weight: 600;
    }
    .info-card p {
        color: #475569;
        font-size: 0.925rem;
        line-height: 1.45;
        margin-bottom: 0;
    }

    /* Workflow step callout */
    .workflow-container {
        background: #f0fdf4;
        border-left: 4px solid #10b981;
        padding: 1rem 1.25rem;
        border-radius: 0 8px 8px 0;
        margin-bottom: 2rem;
    }
    .workflow-title {
        font-weight: 600;
        color: #065f46;
        margin-bottom: 0.35rem;
    }
    .workflow-text {
        color: #047857;
        font-size: 0.92rem;
        margin-bottom: 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# -----------------------------------------------------------------------------
# Sidebar Context & Architecture
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### **ShelfSense AI**")
    st.caption("Version 0.1.0 • Phase 1 Foundation")
    st.markdown("---")
    st.markdown(
        "**System Architecture:**\n"
        "- **Vision Engine:** Gemma 4 (Gemini API)\n"
        "- **Database:** SQLite (Batch-wise)\n"
        "- **Frontend:** Streamlit\n"
        "- **Strategy:** First Expired, First Out (FEFO)"
    )
    st.markdown("---")
    st.info(
        "⚡ **Development Note:**\n"
        "This installation is a clean, modular foundation. External API calls and "
        "database writes are currently unattached."
    )

# -----------------------------------------------------------------------------
# Main Application Header
# -----------------------------------------------------------------------------
st.markdown('<div class="brand-title">ShelfSense AI</div>', unsafe_allow_html=True)
st.markdown('<div class="brand-tagline">Scan Smart. Track Fresh. Reduce Waste.</div>', unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Workflow Explanation Banner
# -----------------------------------------------------------------------------
st.markdown(
    """
    <div class="workflow-container">
        <div class="workflow-title">How ShelfSense AI Works</div>
        <div class="workflow-text">
            ShelfSense AI helps stores and kitchens prevent stock spoilage.
            Snap or upload a photo of any packaged product label → Gemma 4 reads the brand, batch,
            and printed date markings → verify the extracted data → track batches with proactive
            expiry notifications and waste-reduction dispatch priorities.
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# -----------------------------------------------------------------------------
# Section 1: Product Capture Interface (Modular Component from ui.py)
# -----------------------------------------------------------------------------
st.markdown("---")
st.subheader("1. Ingestion Interface")
image_bytes, mime_type = render_image_uploader()

# -----------------------------------------------------------------------------
# Section 2: Planned Capability Overview (Three Informational Cards)
# -----------------------------------------------------------------------------
st.markdown("---")
st.subheader("2. Upcoming Capability Modules")
st.caption("Parallel development tracks underway for the 4-hour hackathon sprint.")

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown(
        """
        <div class="info-card">
            <h4>🔍 AI Product Scanning</h4>
            <p>
                Multimodal label reading powered by Gemma 4. Automatically identifies product title,
                brand, batch ID, and separates safety-critical 'Expiry Dates' from quality-based
                'Best Before' notices with strict confidence thresholds.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col2:
    st.markdown(
        """
        <div class="info-card">
            <h4>📦 Batch-wise Inventory</h4>
            <p>
                Structured SQLite tracking preserving lot numbers and physical locations.
                Differentiates packaging label facts from operational stock counts to maintain
                an accurate, auditable inventory register.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col3:
    st.markdown(
        """
        <div class="info-card">
            <h4>⏱️ Expiry & Waste Monitoring</h4>
            <p>
                Dynamic prioritization highlighting items nearing printed deadlines. Empowers staff
                to apply timely markdowns or feature near-expiry stock in commercial kitchens before
                preventable waste occurs.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )
