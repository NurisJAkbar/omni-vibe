import streamlit as st
import google.generativeai as genai
from PIL import Image
import io

# --- 1. CONFIGURATION & SECURITY ---
# Pastikan Anda sudah memasukkan GOOGLE_API_KEY di Streamlit Cloud: 
# Settings -> Secrets -> GOOGLE_API_KEY = "AIza..."
try:
    API_KEY = st.secrets["GOOGLE_API_KEY"]
    genai.configure(api_key=API_KEY)
except Exception as e:
    st.error("API Key tidak ditemukan! Masukkan di Secrets Streamlit.")
    st.stop()

# --- 2. MODEL INITIALIZATION ---
# Kita pindahkan System Instruction ke sini agar bersih
SYSTEM_INSTRUCTION = """
# ROLE: OMNI-VIBE Autonomous Creative Director
# TRACK: Marathon Agent & Creative Autopilot

You are a high-end Autonomous Creative Agent. Your goal is to transform any visual input into a professional brand identity.

## PROCESS:
1. [SPATIAL ANALYSIS]: Analyze geometry, textures, and lighting.
2. [THINKING LOG]: Show how you self-corrected your initial design thoughts.
3. [ACTION]: Provide technical execution logic.
"""

model = genai.GenerativeModel(
    model_name="gemini-3-flash-preview",
    system_instruction=SYSTEM_INSTRUCTION
)

# --- 3. UI SETUP ---
st.set_page_config(page_title="OMNI-VIBE", page_icon="🎨")
st.title("🎨 OMNI-VIBE: Creative Agent")

uploaded_file = st.file_uploader("Upload Sketch atau Foto Produk", type=['png', 'jpg', 'jpeg'])
target_vibe = st.text_input("Target Vibe", "Industrial Luxury")

if st.button("Execute Analysis"):
    if uploaded_file is not None:
        try:
            with st.spinner("Agent is reasoning..."):
                # Konversi file upload menjadi objek Image PIL
                img = Image.open(uploaded_file)
                
                # JALANKAN GENERASI (Tanpa genai.upload_file)
                # Kita kirim list berisi text prompt dan objek gambar langsung
                prompt = f"Analyze this image. Target Vibe: {target_vibe}. Action: Initial Brand Concept."
                
                response = model.generate_content([prompt, img])
                
                st.markdown("---")
                st.markdown(response.text)
                
        except Exception as e:
            st.error(f"Sistem Error: {str(e)}")
    else:
        st.warning("Silakan unggah gambar terlebih dahulu.")
