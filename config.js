import sys
import subprocess
import json

# --- BAGIAN 1: Auto-Install Package ---
# Mengecek apakah library 'requests' sudah terinstall.
# Jika belum, script akan otomatis menginstalnya.
try:
    import requests
except ImportError:
    print("📦 Paket 'requests' belum terinstall. Memulai instalasi otomatis...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
        print("✅ Instalasi selesai! Melanjutkan program...\n")
        import requests
    except Exception as e:
        print(f"❌ Gagal menginstall 'requests'. Harap install manual: pip install requests. Error: {e}")
        sys.exit(1)

# --- BAGIAN 2: Konfigurasi Token ---
tokens = [
    "9a9a0b0ee3e335b9ee22ce03ff24a7c66abad71ed723c149794f9238182cdc3b",
    "9a9a0b0ee3e335b9ee22ce03ff24a7c66abad71ed723c149794f9238182cdc3b"
]

current_token_index = 0

def react_to_post(post_url, emojis):
    global current_token_index
    attempts = 0
    max_attempts = len(tokens)

    # Pastikan emojis dalam bentuk List
    if isinstance(emojis, str):
        # Jika string dipisah koma (misal: "👍,🔥"), ubah jadi list
        if "," in emojis:
            emojis = [e.strip() for e in emojis.split(",")]
        else:
            emojis = [emojis]

    while attempts < max_attempts:
        api_key = tokens[current_token_index]
        
        # Headers persis seperti request asli
        headers = {
            'authority': 'foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'content-type': 'application/json',
            'origin': 'https://asitha.top',
            'referer': 'https://asitha.top/',
            'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
        }

        payload = {
            'post_link': post_url,
            'reacts': emojis
        }

        try:
            print(f"🎯 Reacting to: {post_url}")
            print(f"🎭 With emojis: {emojis}")
            print(f"🔑 Using token index: {current_token_index}")

            url = f"https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=9a9a0b0ee3e335b9ee22ce03ff24a7c66abad71ed723c149794f9238182cdc3b"
            
            # Request menggunakan library 'requests'
            response = requests.post(url, headers=headers, json=payload, timeout=15)

            # Jika sukses (HTTP 200)
            if response.status_code == 200:
                print('✅ Success!')
                try:
                    print(json.dumps(response.json(), indent=2))
                except:
                    print(response.text)
                return True

            # Jika error (bukan 200), raise exception untuk ditangkap di bawah
            response.raise_for_status()

        except requests.exceptions.RequestException as e:
            # Ambil detail error dari response jika ada
            error_msg = str(e)
            error_data = None
            status_code = 0

            if e.response is not None:
                status_code = e.response.status_code
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('message', str(error_data))
                except:
                    error_msg = e.response.text

            print(f"❌ Token {current_token_index} failed: {error_msg}")

            # Cek apakah error karena Limit atau 402
            is_limit = False
            if status_code == 402:
                is_limit = True
            elif error_msg and ('limit' in str(error_msg).lower()):
                is_limit = True

            if is_limit:
                current_token_index = (current_token_index + 1) % len(tokens)
                attempts += 1
                print(f"🔄 Limit reached. Switching to token index: {current_token_index}")
                continue # Ulangi loop dengan token baru
            
            # Jika error lain (bukan limit), berhenti
            print('❌ Failed (Non-limit error)!')
            return False

    print('❌ All tokens limited!')
    return False

# --- BAGIAN 3: Eksekusi Utama ---
if __name__ == "__main__":
    print("\n--- 🤖 Auto React Tool (Python) ---")
    
    # Cek apakah argumen diberikan lewat command line
    # Contoh: python go.py https://t.me/xxx 👍
    if len(sys.argv) >= 3:
        target_url = sys.argv[1]
        # Menggabungkan sisa argumen jika ada spasi, atau ambil index 2
        target_emoji = "".join(sys.argv[2:])
        react_to_post(target_url, target_emoji)
    
    # Jika tidak ada argumen, minta input manual
    else:
        try:
            target_url = input("🔗 Masukkan Link Post: ").strip()
            emoji_input = input("🎭 Masukkan Emoji (cth: 👍 atau 👍,🔥): ").strip()

            if not target_url or not emoji_input:
                print("❌ Error: Link dan Emoji tidak boleh kosong.")
            else:
                print("-" * 30)
                react_to_post(target_url, emoji_input)
        except KeyboardInterrupt:
            print("\n❌ Program dihentikan pengguna.")
