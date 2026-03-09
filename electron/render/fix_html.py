import os
import glob
import re

html_files = glob.glob("*.html")

user_profile_html = """
  <div class="user-profile" style="margin-right: 15px; display: flex; align-items: center; gap: 8px; font-weight: 500;">
    <i class="fa-solid fa-circle-user" style="font-size: 1.2rem; color: #d4af37;"></i>
    <span id="loggedUserName">Usuario</span>
  </div>
"""

user_script = """
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem('koraLuxe_userName');
    if (userName) {
      const nameEl = document.getElementById('loggedUserName');
      if (nameEl) nameEl.textContent = userName;
    }
    
    // Si la pagina tiene elemento de bienvenida (ej. Dashboard) "Bienvenido, Diany"
    const welcomeEl = document.querySelector('.welcome-row h1');
    if (welcomeEl && userName) {
      welcomeEl.textContent = 'Bienvenido, ' + userName;
    }
  });
</script>
</body>
"""

for filepath in html_files:
    if filepath == "login.html":
        continue # Login doesn't need the header user profile
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    # 1. Fix absolute paths to relative
    # href="/electron/render/styles/..." -> href="./styles/..."
    content = content.replace('href="/electron/render/styles/', 'href="./styles/')
    
    # href="/electron/render/index.html" -> href="./index.html"
    content = content.replace('href="/electron/render/', 'href="./')
    
    # src="/electron/script.js" -> src="../script.js" etc
    content = re.sub(r'src="/electron/([^/]+?\.js)"', r'src="../\1"', content)
    
    # img src="img/Logo Kora Luxe.png" -> src="./img/Logo Kora Luxe.png" (if missing ./)
    # only if not already ./img
    content = re.sub(r'src="img/Logo', r'src="./img/Logo', content)
    
    # fix dashboard welcome row if any
    
    # 2. Inject user-profile into header (if not already there)
    if 'id="loggedUserName"' not in content:
        # inject before <div class="menu-toggle"
        content = content.replace('<div class="menu-toggle"', user_profile_html + '  <div class="menu-toggle"')
        
    # 3. Inject script before </body>
    if 'id="loggedUserName"' not in content or 'localStorage.getItem(\'koraLuxe_userName\')' not in content:
        content = content.replace('</body>', user_script)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
print("HTML files updated successfully.")
