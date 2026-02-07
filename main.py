import google.generativeai as genai
import os

# 1. KONFIGURASI API
# Pastikan Anda sudah set API Key di environment variable atau masukkan langsung (hanya untuk testing lokal)
API_KEY = "MASUKKAN_API_KEY_ANDA_DI_SINI"
genai.configure(api_key=API_KEY)

# 2. SETTING MODEL
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/markdown", # Kita minta markdown agar rapi
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-pro",
  generation_config=generation_config,
  # MASUKKAN SYSTEM INSTRUCTION YANG KITA BUAT SEBELUMNYA DI SINI
  system_instruction="""
# ROLE: OMNI-VIBE Autonomous Creative Director
# TRACK: Marathon Agent & Creative Autopilot
(Salin seluruh System Instruction yang saya berikan sebelumnya ke sini)
""",
)

# 3. FUNGSI UNTUK MENJALANKAN AGENT
def run_omni_vibe(file_path, target_vibe, action_trigger):
    # Upload file ke Gemini API
    uploaded_file = genai.upload_file(file_path, mime_type="image/jpeg") # Sesuaikan mime_type
    
    # Prompt user yang kita buat sebelumnya
    user_prompt = f"Analyze the uploaded file. Target Vibe: {target_vibe}. Action Triggered: {action_trigger}"
    
    response = model.generate_content([user_prompt, uploaded_file])
    return response.text

# 4. CONTOH PENGGUNAAN
if __name__ == "__main__":
    # Test sederhana
    result = run_omni_vibe("sketsa_anda.jpg", "Industrial Luxury", "Analyze Vibe")
    print(result)
